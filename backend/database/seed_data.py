import os
import sqlite3
import random
import datetime
import uuid

# Define database file path to be in the same folder as the seed script
DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, 'contextguard.db')

CITIES = ["Mumbai", "Delhi", "Chennai", "Bangalore", "Jaipur", "Kolkata", "Hyderabad", "Pune"]
DEPARTMENTS = ["Loans", "Retail", "IT", "Operations", "Compliance"]
TRUST_LEVELS = ["TRUSTED", "MONITORED", "FLAGGED"]
ACCESS_LEVELS = ["L1", "L2", "L3"]

INDIAN_NAMES = [
    "Aarav Patel", "Ananya Rao", "Vihaan Sharma", "Diya Joshi",
    "Aditya Iyer", "Ishaan Gupta", "Sai Reddy", "Kavya Pillai",
    "Arjun Nair", "Vivaan Choudhury"
]

def init_db():
    """Initializes the database and creates risk_events, user_profiles, and employees tables."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Drop tables if they exist to ensure clean seeding
    cursor.execute("DROP TABLE IF EXISTS risk_events")
    cursor.execute("DROP TABLE IF EXISTS user_profiles")
    cursor.execute("DROP TABLE IF EXISTS employees")
    
    # Create tables
    cursor.execute("""
    CREATE TABLE risk_events (
        event_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        login_hour INTEGER NOT NULL,
        ip_address TEXT NOT NULL,
        city TEXT NOT NULL,
        is_new_device INTEGER NOT NULL,
        keystroke_variance_ms REAL NOT NULL,
        location_risk_score INTEGER NOT NULL,
        device_risk_score INTEGER NOT NULL,
        time_risk_score INTEGER NOT NULL,
        behavioral_risk_score INTEGER NOT NULL,
        transaction_risk_score INTEGER NOT NULL,
        recovery_risk_score INTEGER NOT NULL,
        final_risk_score INTEGER NOT NULL,
        decision TEXT NOT NULL,
        top_signal TEXT NOT NULL,
        is_confirmed_fraud INTEGER NOT NULL
    )
    """)
    
    cursor.execute("""
    CREATE TABLE user_profiles (
        user_id TEXT PRIMARY KEY,
        normal_city TEXT NOT NULL,
        normal_login_hour_start INTEGER NOT NULL,
        normal_login_hour_end INTEGER NOT NULL,
        baseline_keystroke_ms REAL NOT NULL,
        account_age_days INTEGER NOT NULL,
        trust_level TEXT NOT NULL
    )
    """)
    
    cursor.execute("""
    CREATE TABLE employees (
        emp_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        normal_records_per_day INTEGER NOT NULL,
        access_level TEXT NOT NULL
    )
    """)
    
    conn.commit()
    conn.close()

def seed_users():
    """Generates and inserts 20 user profiles."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    user_ids = set()
    while len(user_ids) < 20:
        uid = f"USR-{random.randint(1234, 9999)}"
        user_ids.add(uid)
    
    user_ids = sorted(list(user_ids))
    user_profiles = []
    
    for uid in user_ids:
        normal_city = random.choice(CITIES)
        start_hour = random.randint(6, 22)
        # End hour usually 8 to 10 hours later
        end_hour = (start_hour + random.randint(8, 10)) % 24
        baseline_keystroke = round(random.uniform(80.0, 200.0), 2)
        account_age = random.randint(30, 1000)
        trust_level = random.choices(TRUST_LEVELS, weights=[0.7, 0.2, 0.1], k=1)[0]
        
        user_profiles.append((
            uid,
            normal_city,
            start_hour,
            end_hour,
            baseline_keystroke,
            account_age,
            trust_level
        ))
        
    cursor.executemany("""
    INSERT INTO user_profiles (
        user_id, normal_city, normal_login_hour_start, normal_login_hour_end,
        baseline_keystroke_ms, account_age_days, trust_level
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, user_profiles)
    
    conn.commit()
    conn.close()
    return user_profiles

def seed_employees():
    """Generates and inserts 10 employee profiles."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    employees = []
    for i in range(10):
        emp_id = f"EMP-{i+1:03d}"
        name = INDIAN_NAMES[i]
        dept = random.choice(DEPARTMENTS)
        records_per_day = random.randint(10, 50)
        access = random.choices(ACCESS_LEVELS, weights=[0.5, 0.3, 0.2], k=1)[0]
        
        employees.append((emp_id, name, dept, records_per_day, access))
        
    cursor.executemany("""
    INSERT INTO employees (
        emp_id, name, department, normal_records_per_day, access_level
    ) VALUES (?, ?, ?, ?, ?)
    """, employees)
    
    conn.commit()
    conn.close()

def is_hour_in_range(hour, start, end):
    """Helper to check if an hour falls within a range, handling wrap-arounds."""
    if start <= end:
        return start <= hour <= end
    else:
        return hour >= start or hour <= end

def generate_indian_ip():
    """Generates a realistic Indian IP address with 49, 103, or 117 prefix."""
    prefix = random.choice([49, 103, 117])
    return f"{prefix}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}"

def generate_event(user, decision, is_block_fraud=False):
    """Generates a realistic risk event matching the decision criteria."""
    uid, normal_city, start_hour, end_hour, baseline_keystroke, account_age, trust_level = user
    
    # 1. Event ID in "EVT-a3f2b1c4" format
    event_id = f"EVT-{uuid.uuid4().hex[:8]}"
    
    # 2. Timestamp within last 48 hours
    now = datetime.datetime.now()
    delta_seconds = random.randint(0, 48 * 3600)
    timestamp_dt = now - datetime.timedelta(seconds=delta_seconds)
    timestamp_str = timestamp_dt.strftime("%Y-%m-%d %H:%M:%S")
    login_hour = timestamp_dt.hour
    
    is_normal_hour = is_hour_in_range(login_hour, start_hour, end_hour)
    
    # 3. City matching or mismatching user normal city
    if decision == 'CLEAR':
        city = normal_city if random.random() < 0.90 else random.choice(CITIES)
    elif decision == 'STEP_UP':
        city = normal_city if random.random() < 0.50 else random.choice(CITIES)
    else: # HUMAN_REVIEW or BLOCK
        city = normal_city if random.random() < 0.20 else random.choice(CITIES)
        
    is_normal_city = (city == normal_city)
    
    # 4. New Device flag
    if decision == 'CLEAR':
        is_new_device = 0 if random.random() < 0.95 else 1
    elif decision == 'STEP_UP':
        is_new_device = 0 if random.random() < 0.60 else 1
    else: # HUMAN_REVIEW or BLOCK
        is_new_device = 1 if random.random() < 0.80 else 0
        
    # 5. Keystroke variance MS (50 - 300)
    if decision == 'CLEAR':
        keystroke_variance_ms = round(max(50.0, min(300.0, baseline_keystroke + random.uniform(-15.0, 15.0))), 2)
    elif decision == 'STEP_UP':
        keystroke_variance_ms = round(max(50.0, min(300.0, baseline_keystroke + random.uniform(-40.0, 40.0))), 2)
    else: # HUMAN_REVIEW or BLOCK
        keystroke_variance_ms = round(max(50.0, min(300.0, baseline_keystroke + random.choice([random.uniform(-100.0, -40.0), random.uniform(40.0, 100.0)]))), 2)
        
    keystroke_diff = abs(keystroke_variance_ms - baseline_keystroke)
    
    # 6. IP Address
    ip_address = generate_indian_ip()
    
    # 7. Generate risk scores based on decision and features
    if decision == 'CLEAR':
        final_risk_score = random.randint(0, 30)
        scores = {}
        for signal in [
            'location_risk_score', 'device_risk_score', 'time_risk_score',
            'behavioral_risk_score', 'transaction_risk_score', 'recovery_risk_score'
        ]:
            scores[signal] = random.randint(0, final_risk_score)
        
        # Ensure the maximum score equals final_risk_score
        max_signal_key = random.choice(list(scores.keys()))
        scores[max_signal_key] = final_risk_score
        
    elif decision == 'STEP_UP':
        final_risk_score = random.randint(31, 60)
        scores = {}
        for signal in [
            'location_risk_score', 'device_risk_score', 'time_risk_score',
            'behavioral_risk_score', 'transaction_risk_score', 'recovery_risk_score'
        ]:
            scores[signal] = random.randint(min(10, final_risk_score), final_risk_score)
            
        # Correlate scores with anomalies
        if not is_normal_city:
            scores['location_risk_score'] = max(scores['location_risk_score'], random.randint(min(40, final_risk_score), final_risk_score))
        if is_new_device:
            scores['device_risk_score'] = max(scores['device_risk_score'], random.randint(min(40, final_risk_score), final_risk_score))
        if not is_normal_hour:
            scores['time_risk_score'] = max(scores['time_risk_score'], random.randint(min(40, final_risk_score), final_risk_score))
        if keystroke_diff > 30:
            scores['behavioral_risk_score'] = max(scores['behavioral_risk_score'], random.randint(min(40, final_risk_score), final_risk_score))
            
        max_signal_key = random.choice(list(scores.keys()))
        scores[max_signal_key] = final_risk_score
        
    elif decision == 'HUMAN_REVIEW':
        final_risk_score = random.randint(61, 85)
        scores = {}
        for signal in [
            'location_risk_score', 'device_risk_score', 'time_risk_score',
            'behavioral_risk_score', 'transaction_risk_score', 'recovery_risk_score'
        ]:
            scores[signal] = random.randint(min(30, final_risk_score), final_risk_score)
            
        if not is_normal_city:
            scores['location_risk_score'] = max(scores['location_risk_score'], random.randint(min(60, final_risk_score), final_risk_score))
        if is_new_device:
            scores['device_risk_score'] = max(scores['device_risk_score'], random.randint(min(60, final_risk_score), final_risk_score))
        if not is_normal_hour:
            scores['time_risk_score'] = max(scores['time_risk_score'], random.randint(min(60, final_risk_score), final_risk_score))
        if keystroke_diff > 50:
            scores['behavioral_risk_score'] = max(scores['behavioral_risk_score'], random.randint(min(60, final_risk_score), final_risk_score))
            
        max_signal_key = random.choice(list(scores.keys()))
        scores[max_signal_key] = final_risk_score
        
    else: # BLOCK
        final_risk_score = random.randint(86, 100)
        scores = {}
        for signal in [
            'location_risk_score', 'device_risk_score', 'time_risk_score',
            'behavioral_risk_score', 'transaction_risk_score', 'recovery_risk_score'
        ]:
            scores[signal] = random.randint(min(50, final_risk_score), final_risk_score)
            
        if not is_normal_city:
            scores['location_risk_score'] = max(scores['location_risk_score'], random.randint(min(80, final_risk_score), final_risk_score))
        if is_new_device:
            scores['device_risk_score'] = max(scores['device_risk_score'], random.randint(min(80, final_risk_score), final_risk_score))
        if not is_normal_hour:
            scores['time_risk_score'] = max(scores['time_risk_score'], random.randint(min(80, final_risk_score), final_risk_score))
        if keystroke_diff > 70:
            scores['behavioral_risk_score'] = max(scores['behavioral_risk_score'], random.randint(min(80, final_risk_score), final_risk_score))
            
        max_signal_key = random.choice(list(scores.keys()))
        scores[max_signal_key] = final_risk_score
        
    # Determine the top signal name
    top_signal = max(scores, key=scores.get)
    
    # 8. Fraud Confirmation: 15% of BLOCK decisions (exactly 1 out of 5 BLOCK events in our dataset)
    is_confirmed_fraud = 1 if (decision == 'BLOCK' and is_block_fraud) else 0
    
    return (
        event_id,
        uid,
        timestamp_str,
        login_hour,
        ip_address,
        city,
        is_new_device,
        keystroke_variance_ms,
        scores['location_risk_score'],
        scores['device_risk_score'],
        scores['time_risk_score'],
        scores['behavioral_risk_score'],
        scores['transaction_risk_score'],
        scores['recovery_risk_score'],
        final_risk_score,
        decision,
        top_signal,
        is_confirmed_fraud
    )

def seed_events(user_profiles):
    """Generates exactly 100 events with specified decision distribution and inserts them."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 60 CLEAR, 25 STEP_UP, 10 HUMAN_REVIEW, 5 BLOCK
    decisions = ['CLEAR'] * 60 + ['STEP_UP'] * 25 + ['HUMAN_REVIEW'] * 10 + ['BLOCK'] * 5
    random.shuffle(decisions)
    
    # Identify indices of BLOCK decisions to assign one block decision as confirmed fraud
    block_indices = [i for i, d in enumerate(decisions) if d == 'BLOCK']
    # Choose 1 of the 5 BLOCK decisions (representing 20%, which is closest to 15% of 5)
    fraud_block_idx = random.choice(block_indices)
    
    events = []
    for idx, decision in enumerate(decisions):
        user = random.choice(user_profiles)
        is_block_fraud = (idx == fraud_block_idx)
        event = generate_event(user, decision, is_block_fraud)
        events.append(event)
        
    cursor.executemany("""
    INSERT INTO risk_events (
        event_id, user_id, timestamp, login_hour, ip_address, city,
        is_new_device, keystroke_variance_ms, location_risk_score,
        device_risk_score, time_risk_score, behavioral_risk_score,
        transaction_risk_score, recovery_risk_score, final_risk_score,
        decision, top_signal, is_confirmed_fraud
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, events)
    
    conn.commit()
    conn.close()

def main():
    init_db()
    user_profiles = seed_users()
    seed_employees()
    seed_events(user_profiles)
    print("Seeded: 100 events, 20 users, 10 employees")

if __name__ == "__main__":
    main()
