"""
Live verification script for 4 decision tiers.
Run from backend/ directory: python scratch/test_live_tiers.py
"""
import urllib.request
import json

BACKEND_URL = "https://contextguard-backend.onrender.com/api/v1/analyze"

TIERS = {
    "CLEAR": {
        "user_id": "USR-9999",
        "ip_address": "49.12.34.56",  # Indian IP -> location_risk=35 (or home city match -> 0)
        "city": "Mumbai",
        "login_hour": 12,              # business hours -> time_risk=0
        "is_new_device": False,        # trusted device -> device_risk=0
        "keystroke_variance_ms": 80,   # normal -> behavioral_risk=0
        "last_login_city": "Mumbai",   # city match -> location_risk=0
        "is_recovery_attempt": False,  # normal -> recovery_risk=0
        "records_accessed": 10,
        "transaction_amount": 500      # low amount -> transaction_risk=0
    },
    "STEP_UP": {
        "user_id": "USR-9999",
        "ip_address": "49.12.34.56",
        "city": "Mumbai",
        "login_hour": 22,              # fringe hours -> time_risk=35
        "is_new_device": False,
        "keystroke_variance_ms": 150,  # medium variance -> behavioral_risk=40
        "last_login_city": "Mumbai",
        "is_recovery_attempt": False,
        "records_accessed": 10,
        "transaction_amount": 500
    },
    "HUMAN_REVIEW": {
        "user_id": "USR-9999",
        "ip_address": "185.220.101.5", # non-Indian IP -> location_risk=65
        "city": "Unknown",
        "login_hour": 3,               # night hours -> time_risk=70
        "is_new_device": True,         # new device -> device_risk=55
        "keystroke_variance_ms": 287,  # high variance -> behavioral_risk=75
        "last_login_city": "Mumbai",
        "is_recovery_attempt": True,   # recovery attempt -> recovery_risk=50
        "records_accessed": 200,
        "transaction_amount": 95000    # high amount -> transaction_risk=60
        # final risk score should be in 61-85 or 86-100 range.
        # Let's adjust values so it falls precisely into HUMAN_REVIEW (61-85)
    },
    "BLOCK": {
        "user_id": "USR-9999",
        "ip_address": "185.220.101.5",
        "city": "Unknown",
        "login_hour": 3,
        "is_new_device": True,
        "keystroke_variance_ms": 287,
        "last_login_city": "Mumbai",
        "is_recovery_attempt": True,
        "records_accessed": 200,
        "transaction_amount": 95000
    }
}

# Adjust HUMAN_REVIEW payload to target 61-85 final score range:
# location=65 (wt 0.20 -> 13)
# device=55 (wt 0.20 -> 11)
# time=0 (wt 0.15 -> 0)
# behavioral=40 (wt 0.25 -> 10)
# transaction=60 (wt 0.10 -> 6)
# recovery=50 (wt 0.10 -> 5)
# Sum = 13 + 11 + 0 + 10 + 6 + 5 = 45 -> Step Up.
# Let's increase some weights:
# location=65 (wt 0.20 -> 13)
# device=55 (wt 0.20 -> 11)
# time=70 (wt 0.15 -> 10.5)
# behavioral=40 (wt 0.25 -> 10)
# transaction=60 (wt 0.10 -> 6)
# recovery=50 (wt 0.10 -> 5)
# Sum = 13 + 11 + 10.5 + 10 + 6 + 5 = 55.5 -> 56.
# If behavioral=75 (wt 0.25 -> 18.75):
# Sum = 13 + 11 + 10.5 + 18.75 + 6 + 5 = 64.25 -> 64 -> HUMAN_REVIEW.
TIERS["HUMAN_REVIEW"] = {
    "user_id": "USR-9999",
    "ip_address": "185.220.101.5",
    "city": "Unknown",
    "login_hour": 3,               # time_risk = 70
    "is_new_device": True,         # device_risk = 55
    "keystroke_variance_ms": 287,  # behavioral_risk = 75
    "last_login_city": "Mumbai",   # location_risk = 65
    "is_recovery_attempt": False,  # recovery_risk = 0
    "records_accessed": 10,
    "transaction_amount": 1000     # transaction_risk = 0
}
# Score: 65 * 0.20 (13) + 55 * 0.20 (11) + 70 * 0.15 (10.5) + 75 * 0.25 (18.75) + 0 + 0 = 53.25 -> Step Up.
# Let's make recovery=True (recovery_risk = 50 -> wt 0.10 -> 5):
# Sum = 53.25 + 5 = 58.25 -> 58.
# Let's make transaction_amount = 60000 (transaction_risk = 60 -> wt 0.10 -> 6):
# Sum = 58.25 + 6 = 64.25 -> 64 -> HUMAN_REVIEW.
TIERS["HUMAN_REVIEW"] = {
    "user_id": "USR-9999",
    "ip_address": "185.220.101.5",
    "city": "Unknown",
    "login_hour": 3,
    "is_new_device": True,
    "keystroke_variance_ms": 287,
    "last_login_city": "Mumbai",
    "is_recovery_attempt": True,
    "records_accessed": 100,
    "transaction_amount": 60000
}

# BLOCK payload:
# location=65 (wt 0.20 -> 13)
# device=55 (wt 0.20 -> 11)
# time=70 (wt 0.15 -> 10.5)
# behavioral=75 (wt 0.25 -> 18.75)
# transaction=60 (wt 0.10 -> 6)
# recovery=50 (wt 0.10 -> 5)
# Sum = 64.25 + 5 (recovery) + 12 (both recovery and transaction active) = 86.25 -> 86 -> BLOCK.
TIERS["BLOCK"] = {
    "user_id": "USR-9999",
    "ip_address": "185.220.101.5",
    "city": "Unknown",
    "login_hour": 3,
    "is_new_device": True,
    "keystroke_variance_ms": 287,
    "last_login_city": "Mumbai",
    "is_recovery_attempt": True,
    "records_accessed": 100,
    "transaction_amount": 95000
}

print("=" * 70)
print("CONTEXTGUARD — LIVE DECISION TIER VERIFICATION")
print("=" * 70)

for name, payload in TIERS.items():
    print(f"\nTesting expected tier: {name}")
    req = urllib.request.Request(
        BACKEND_URL,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            print(f"  EVENT ID:  {data['event_id']}")
            print(f"  SCORE:     {data['final_risk_score']}/100")
            print(f"  DECISION:  {data['decision']}")
            print(f"  SIGNALS:   {data['signals']}")
            success = (data['decision'] == name)
            print(f"  RESULT:    {'✅ MATCH' if success else '❌ MISMATCH'}")
    except Exception as e:
        print(f"  API Error: {e}")
    print("-" * 70)
