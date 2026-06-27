import os
import sys
import sqlite3
import random
import datetime
import uuid
from typing import Optional, Dict, List
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure the backend directory is in the system path for imports
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.append(BACKEND_DIR)

DB_PATH = os.path.join(BACKEND_DIR, 'database', 'contextguard.db')

app = FastAPI(
    title="ContextGuard API",
    description="Backend API for bank fraud detection system",
    version="1.0.0"
)

# Enable CORS for frontend dev server and production Vercel URL
# NOTE: Replace "https://contextguard-bob-2026.vercel.app" in Step 5
# with the real Vercel URL once frontend is deployed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://contextguard-bob-2026.vercel.app",  # STEP5_REPLACE
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def run_seeder_if_empty():
    """Automatically runs the database seeder if the database is missing or empty."""
    needs_seeding = False
    if not os.path.exists(DB_PATH):
        needs_seeding = True
    else:
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            # Check if table exists and has records
            cursor.execute("SELECT count(name) FROM sqlite_master WHERE type='table' AND name='risk_events'")
            if cursor.fetchone()[0] == 0:
                needs_seeding = True
            else:
                cursor.execute("SELECT COUNT(*) FROM risk_events")
                if cursor.fetchone()[0] == 0:
                    needs_seeding = True
            conn.close()
        except Exception:
            needs_seeding = True

    if needs_seeding:
        print("Database is empty or missing. Auto-seeding database...")
        try:
            from database import seed_data
            # Initialize tables and seed
            seed_data.init_db()
            user_profiles = seed_data.seed_users()
            seed_data.seed_employees()
            seed_data.seed_events(user_profiles)
            print("Auto-seeding completed successfully.")
        except Exception as e:
            print(f"Error during auto-seeding: {e}")

@app.on_event("startup")
def startup_event():
    run_seeder_if_empty()

# ----------------- PYDANTIC SCHEMAS -----------------

class AnalyzeRequest(BaseModel):
    user_id: str
    ip_address: str
    city: Optional[str] = None
    login_hour: int
    is_new_device: bool
    keystroke_variance_ms: float
    last_login_city: Optional[str] = None
    is_recovery_attempt: bool
    records_accessed: int
    transaction_amount: float

class AnalyzeResponse(BaseModel):
    event_id: str
    user_id: str
    final_risk_score: int
    decision: str
    signals: Dict[str, int]
    timestamp: str

class LiveFeedEvent(BaseModel):
    event_id: str
    user_id: str
    city: Optional[str]
    final_risk_score: int
    decision: str
    timestamp: str
    top_signal: str

class DashboardStats(BaseModel):
    total_events_today: int
    high_risk_blocked: int
    human_review_pending: int
    avg_trust_score: float
    clear_percentage: int

class UserHistoryEvent(BaseModel):
    event_id: str
    user_id: str
    timestamp: str
    login_hour: int
    ip_address: str
    city: Optional[str]
    is_new_device: bool
    keystroke_variance_ms: float
    location_risk_score: int
    device_risk_score: int
    time_risk_score: int
    behavioral_risk_score: int
    transaction_risk_score: int
    recovery_risk_score: int
    final_risk_score: int
    decision: str
    top_signal: str
    is_confirmed_fraud: bool

class Employee(BaseModel):
    emp_id: str
    name: str
    department: str
    normal_records_per_day: int
    access_level: str

class EmployeeAnalyzeRequest(BaseModel):
    emp_id: str
    records_accessed_today: int
    login_hour: int
    data_exported_mb: float

class EmployeeAnalyzeResponse(BaseModel):
    emp_id: str
    risk_score: int
    risk_level: str
    narrative: str
    recommended_action: str

# ----------------- API ROUTES -----------------

@app.get("/")
def read_root():
    return {"status": "ContextGuard API running", "version": "1.0.0"}

@app.post("/api/v1/analyze", response_model=AnalyzeResponse)
def analyze_risk(payload: AnalyzeRequest):
    # 1. Location Risk Score Calculation
    if not payload.city:
        location_risk = 20
    elif payload.last_login_city and payload.city.strip().lower() == payload.last_login_city.strip().lower():
        location_risk = 0
    else:
        # Check if IP address starts with realistic Indian prefixes (49.x, 103.x, 117.x)
        is_indian_ip = False
        if payload.ip_address:
            is_indian_ip = any(payload.ip_address.strip().startswith(prefix) for prefix in ["49.", "103.", "117."])
        
        if is_indian_ip:
            location_risk = 35
        else:
            location_risk = 65

    # 2. Device Risk Score Calculation
    device_risk = 55 if payload.is_new_device else 0

    # 3. Time Risk Score Calculation
    if 8 <= payload.login_hour < 20:
        time_risk = 0
    elif 20 <= payload.login_hour <= 23:
        time_risk = 35
    else: # 0 <= login_hour < 8
        time_risk = 70

    # 4. Behavioral Risk Score Calculation
    if payload.keystroke_variance_ms < 100:
        behavioral_risk = 0
    elif 100 <= payload.keystroke_variance_ms <= 200:
        behavioral_risk = 40
    else:
        behavioral_risk = 75

    # 5. Transaction Risk Score Calculation
    if payload.transaction_amount < 10000:
        transaction_risk = 0
    elif 10000 <= payload.transaction_amount <= 50000:
        transaction_risk = 30
    else:
        transaction_risk = 60

    # 6. Recovery Risk Score Calculation
    recovery_risk = 50 if payload.is_recovery_attempt else 0

    # Weighted Final Score Calculation
    final_score = (
        location_risk * 0.20 +
        device_risk * 0.20 +
        time_risk * 0.15 +
        behavioral_risk * 0.25 +
        transaction_risk * 0.10 +
        recovery_risk * 0.10
    )
    final_risk_score = round(final_score)

    # Decision Mapping
    if final_risk_score <= 30:
        decision = "CLEAR"
    elif final_risk_score <= 60:
        decision = "STEP_UP"
    elif final_risk_score <= 85:
        decision = "HUMAN_REVIEW"
    else:
        decision = "BLOCK"

    # Identify the highest risk signal name (as stored in SQLite schema: e.g. 'location_risk_score')
    scores_dict = {
        'location_risk_score': location_risk,
        'device_risk_score': device_risk,
        'time_risk_score': time_risk,
        'behavioral_risk_score': behavioral_risk,
        'transaction_risk_score': transaction_risk,
        'recovery_risk_score': recovery_risk
    }
    top_signal = max(scores_dict, key=scores_dict.get)

    # Determine is_confirmed_fraud: True (1) for 15% of BLOCK decisions
    is_confirmed_fraud = 0
    if decision == "BLOCK" and random.random() < 0.15:
        is_confirmed_fraud = 1

    # Current Timestamps
    now = datetime.datetime.now()
    timestamp_db = now.strftime("%Y-%m-%d %H:%M:%S")
    timestamp_iso = now.isoformat(timespec='seconds')

    event_id = f"EVT-{uuid.uuid4().hex[:8]}"

    # Save to SQLite Database
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO risk_events (
            event_id, user_id, timestamp, login_hour, ip_address, city,
            is_new_device, keystroke_variance_ms, location_risk_score,
            device_risk_score, time_risk_score, behavioral_risk_score,
            transaction_risk_score, recovery_risk_score, final_risk_score,
            decision, top_signal, is_confirmed_fraud
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            event_id, payload.user_id, timestamp_db, payload.login_hour, payload.ip_address, payload.city,
            1 if payload.is_new_device else 0, payload.keystroke_variance_ms, location_risk,
            device_risk, time_risk, behavioral_risk, transaction_risk,
            recovery_risk, final_risk_score, decision, top_signal, is_confirmed_fraud
        ))
        conn.commit()
        conn.close()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database write error: {e}"
        )

    return AnalyzeResponse(
        event_id=event_id,
        user_id=payload.user_id,
        final_risk_score=final_risk_score,
        decision=decision,
        signals={
            "location_risk": location_risk,
            "device_risk": device_risk,
            "time_risk": time_risk,
            "behavioral_risk": behavioral_risk,
            "transaction_risk": transaction_risk,
            "recovery_risk": recovery_risk
        },
        timestamp=timestamp_iso
    )

@app.get("/api/v1/live-feed", response_model=List[LiveFeedEvent])
def live_feed():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
        SELECT event_id, user_id, city, final_risk_score, decision, timestamp, top_signal
        FROM risk_events
        ORDER BY timestamp DESC
        LIMIT 50
        """)
        rows = cursor.fetchall()
        conn.close()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database read error: {e}"
        )

    events = []
    for r in rows:
        events.append(LiveFeedEvent(
            event_id=r[0],
            user_id=r[1],
            city=r[2] if r[2] else None,
            final_risk_score=r[3],
            decision=r[4],
            timestamp=r[5].replace(" ", "T"),
            top_signal=r[6]
        ))
    return events

@app.get("/api/v1/dashboard/stats", response_model=DashboardStats)
def dashboard_stats():
    today_str = datetime.datetime.now().strftime("%Y-%m-%d")
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Total events today
        cursor.execute("SELECT COUNT(*) FROM risk_events WHERE timestamp LIKE ?", (f"{today_str}%",))
        total_events_today = cursor.fetchone()[0]

        # High risk blocked today
        cursor.execute("SELECT COUNT(*) FROM risk_events WHERE decision = 'BLOCK' AND timestamp LIKE ?", (f"{today_str}%",))
        high_risk_blocked = cursor.fetchone()[0]

        # Human review pending today
        cursor.execute("SELECT COUNT(*) FROM risk_events WHERE decision = 'HUMAN_REVIEW' AND timestamp LIKE ?", (f"{today_str}%",))
        human_review_pending = cursor.fetchone()[0]

        # Average trust score across all database entries (100 - average_risk_score)
        cursor.execute("SELECT AVG(final_risk_score) FROM risk_events")
        avg_risk = cursor.fetchone()[0]
        avg_trust_score = round(100.0 - avg_risk, 1) if avg_risk is not None else 100.0

        # Clear percentage today (fallback to overall database if no events today)
        if total_events_today > 0:
            cursor.execute("SELECT COUNT(*) FROM risk_events WHERE decision = 'CLEAR' AND timestamp LIKE ?", (f"{today_str}%",))
            clear_today = cursor.fetchone()[0]
            clear_percentage = round((clear_today / total_events_today) * 100)
        else:
            cursor.execute("SELECT COUNT(*) FROM risk_events WHERE decision = 'CLEAR'")
            clear_all = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM risk_events")
            total_all = cursor.fetchone()[0]
            clear_percentage = round((clear_all / total_all) * 100) if total_all > 0 else 100

        conn.close()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database read error: {e}"
        )

    return DashboardStats(
        total_events_today=total_events_today,
        high_risk_blocked=high_risk_blocked,
        human_review_pending=human_review_pending,
        avg_trust_score=avg_trust_score,
        clear_percentage=clear_percentage
    )

@app.get("/api/v1/user/{user_id}/history", response_model=List[UserHistoryEvent])
def user_history(user_id: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
        SELECT event_id, user_id, timestamp, login_hour, ip_address, city,
               is_new_device, keystroke_variance_ms, location_risk_score,
               device_risk_score, time_risk_score, behavioral_risk_score,
               transaction_risk_score, recovery_risk_score, final_risk_score,
               decision, top_signal, is_confirmed_fraud
        FROM risk_events
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT 20
        """, (user_id,))
        rows = cursor.fetchall()
        conn.close()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database read error: {e}"
        )

    events = []
    for r in rows:
        events.append(UserHistoryEvent(
            event_id=r[0],
            user_id=r[1],
            timestamp=r[2].replace(" ", "T"),
            login_hour=r[3],
            ip_address=r[4],
            city=r[5] if r[5] else None,
            is_new_device=bool(r[6]),
            keystroke_variance_ms=r[7],
            location_risk_score=r[8],
            device_risk_score=r[9],
            time_risk_score=r[10],
            behavioral_risk_score=r[11],
            transaction_risk_score=r[12],
            recovery_risk_score=r[13],
            final_risk_score=r[14],
            decision=r[15],
            top_signal=r[16],
            is_confirmed_fraud=bool(r[17])
        ))
    return events

@app.get("/api/v1/employees", response_model=List[Employee])
def list_employees():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT emp_id, name, department, normal_records_per_day, access_level FROM employees")
        rows = cursor.fetchall()
        conn.close()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database read error: {e}"
        )

    employees = []
    for r in rows:
        employees.append(Employee(
            emp_id=r[0],
            name=r[1],
            department=r[2],
            normal_records_per_day=r[3],
            access_level=r[4]
        ))
    return employees

@app.post("/api/v1/employee/analyze", response_model=EmployeeAnalyzeResponse)
def analyze_employee(payload: EmployeeAnalyzeRequest):
    # Fetch employee to get baseline details
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT normal_records_per_day FROM employees WHERE emp_id = ?", (payload.emp_id,))
        row = cursor.fetchone()
        conn.close()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database read error: {e}"
        )

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID {payload.emp_id} not found."
        )

    normal_records = row[0]

    # 1. Records Accessed Points
    ratio = payload.records_accessed_today / normal_records
    if ratio <= 1.0:
        records_points = 0
    elif ratio <= 1.5:
        records_points = 15
    elif ratio <= 2.5:
        records_points = 30
    else:
        records_points = 45

    # 2. Login Hour Points
    if 8 <= payload.login_hour <= 18:
        login_points = 0
    elif (18 < payload.login_hour <= 22) or (6 <= payload.login_hour < 8):
        login_points = 15
    else: # Night hours (22 < hour < 6)
        login_points = 30

    # 3. Data Exported Points
    if payload.data_exported_mb <= 10.0:
        export_points = 0
    elif payload.data_exported_mb <= 50.0:
        export_points = 15
    else:
        export_points = 25

    # Final Risk Score calculation
    risk_score = min(100, records_points + login_points + export_points)

    # Risk level & action mappings
    if risk_score <= 35:
        risk_level = "LOW"
        recommended_action = "NO_ACTION"
    elif risk_score <= 70:
        risk_level = "MEDIUM"
        recommended_action = "MONITOR"
    else:
        risk_level = "HIGH"
        recommended_action = "TEMPORARY_SUSPEND"

    # Construct Narrative
    ratio_str = f"{ratio:.1f}x" if ratio % 1 != 0 else f"{int(ratio)}x"

    if payload.login_hour == 0:
        hour_str = "12AM"
    elif payload.login_hour == 12:
        hour_str = "12PM"
    elif payload.login_hour < 12:
        hour_str = f"{payload.login_hour}AM"
    else:
        hour_str = f"{payload.login_hour - 12}PM"

    export_str = f"{int(payload.data_exported_mb)}MB" if payload.data_exported_mb % 1 == 0 else f"{payload.data_exported_mb:.1f}MB"

    narrative = f"Employee accessed {ratio_str} normal records at {hour_str}"
    if export_points > 0:
        narrative += f" and exported {export_str} data"
    
    if risk_level == "HIGH":
        narrative += " — possible exfiltration"
    elif risk_level == "MEDIUM":
        narrative += " — suspicious activity"

    return EmployeeAnalyzeResponse(
        emp_id=payload.emp_id,
        risk_score=risk_score,
        risk_level=risk_level,
        narrative=narrative,
        recommended_action=recommended_action
    )
