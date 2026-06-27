"""
Live Gemini integration test — 3 different employee profiles.
Run from backend/ directory: python scratch/test_gemini.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from threat_narrative import generate_threat_narrative

TEST_CASES = [
    {
        "emp_id": "EMP-001", "name": "Rajesh Kumar", "department": "Loans",
        "records_accessed": 127, "normal_records_per_day": 42,
        "login_hour": 2, "data_exported_mb": 45.2
    },
    {
        "emp_id": "EMP-007", "name": "Vikram Nair", "department": "Loans",
        "records_accessed": 65, "normal_records_per_day": 42,
        "login_hour": 19, "data_exported_mb": 8.0
    },
    {
        "emp_id": "EMP-002", "name": "Priya Sharma", "department": "IT",
        "records_accessed": 38, "normal_records_per_day": 40,
        "login_hour": 10, "data_exported_mb": 0.0
    },
]

print("=" * 70)
print("CONTEXTGUARD — LIVE GEMINI THREAT NARRATIVE TEST")
print("=" * 70)

for i, emp in enumerate(TEST_CASES, 1):
    print(f"\n[TEST {i}] {emp['emp_id']} — {emp['name']} ({emp['department']})")
    print(f"  Input: {emp['records_accessed']} records, hour={emp['login_hour']}, export={emp['data_exported_mb']}MB")
    result = generate_threat_narrative(emp)
    print(f"  SOURCE:  {result['source']}")
    print(f"  SCORE:   {result['risk_score']}/100")
    print(f"  LEVEL:   {result['risk_level']}")
    print(f"  CONF:    {result.get('confidence')}")
    print(f"  ACTION:  {result['recommended_action']}")
    print(f"  SIGNALS: {result['top_signals']}")
    print(f"  NARRATIVE:")
    print(f"    {result['narrative']}")
    print("-" * 70)
