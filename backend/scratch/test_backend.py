import os
import sys
import unittest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..', '..', 'Dropbox', 'PC', 'Documents', 'contextguard-bob-2026', 'backend')))
# Or simply add the absolute workspace path
sys.path.append(r"c:\Users\hp\Dropbox\PC\Documents\contextguard-bob-2026\backend")

from main import app

class TestContextGuardBackend(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_root_route(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ContextGuard API running", "version": "1.0.0"})

    def test_analyze_route_clear(self):
        # CLEAR decision payload (low amount, same city, normal hour, low variance)
        payload = {
            "user_id": "USR-1234",
            "ip_address": "49.23.44.12",
            "city": "Mumbai",
            "login_hour": 14,
            "is_new_device": False,
            "keystroke_variance_ms": 89.3,
            "last_login_city": "Mumbai",
            "is_recovery_attempt": False,
            "records_accessed": 15,
            "transaction_amount": 5000
        }
        response = self.client.post("/api/v1/analyze", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("event_id", data)
        self.assertEqual(data["user_id"], "USR-1234")
        self.assertEqual(data["decision"], "CLEAR")
        self.assertLessEqual(data["final_risk_score"], 30)

    def test_analyze_route_step_up(self):
        # STEP_UP decision payload (new device: 55 points)
        # final_score = 55 * 0.20 = 11. Wait, let's add some more points
        # different Indian city: 35 points (starts with 49., 103., or 117.)
        # new device: 55 points
        # login_hour: 22 (35 points)
        # final_score = 35*0.2 + 55*0.2 + 35*0.15 = 7 + 11 + 5.25 = 23.25 -> 23 -> CLEAR
        # Let's make:
        # new device: True (55) -> 11 points
        # different Indian city: True (35) -> 7 points
        # login_hour: 2 (70) -> 10.5 points
        # keystroke variance: 220 (75) -> 18.75 points
        # transaction amount: 60000 (60) -> 6 points
        # recovery: True (50) -> 5 points
        # Total final score = 11 + 7 + 10.5 + 18.75 + 6 + 5 = 58.25 -> 58 -> STEP_UP
        payload = {
            "user_id": "USR-1234",
            "ip_address": "49.23.44.12",
            "city": "Delhi",
            "login_hour": 2,
            "is_new_device": True,
            "keystroke_variance_ms": 220.0,
            "last_login_city": "Mumbai",
            "is_recovery_attempt": True,
            "records_accessed": 15,
            "transaction_amount": 60000
        }
        response = self.client.post("/api/v1/analyze", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["decision"], "STEP_UP")
        self.assertTrue(31 <= data["final_risk_score"] <= 60)

    def test_live_feed(self):
        response = self.client.get("/api/v1/live-feed")
        self.assertEqual(response.status_code, 200)
        events = response.json()
        self.assertIsInstance(events, list)
        self.assertLessEqual(len(events), 50)
        if len(events) > 0:
            evt = events[0]
            self.assertIn("event_id", evt)
            self.assertIn("decision", evt)
            self.assertIn("final_risk_score", evt)

    def test_dashboard_stats(self):
        response = self.client.get("/api/v1/dashboard/stats")
        self.assertEqual(response.status_code, 200)
        stats = response.json()
        self.assertIn("total_events_today", stats)
        self.assertIn("high_risk_blocked", stats)
        self.assertIn("human_review_pending", stats)
        self.assertIn("avg_trust_score", stats)
        self.assertIn("clear_percentage", stats)

    def test_employees(self):
        response = self.client.get("/api/v1/employees")
        self.assertEqual(response.status_code, 200)
        employees = response.json()
        self.assertEqual(len(employees), 10)
        self.assertEqual(employees[0]["emp_id"], "EMP-001")

    def test_employee_analyze_low(self):
        # Normal records = 10 to 50
        # Let's target EMP-001
        response = self.client.get("/api/v1/employees")
        emp1 = response.json()[0]
        emp_id = emp1["emp_id"]
        normal = emp1["normal_records_per_day"]

        # regular hours, regular records, low export
        payload = {
            "emp_id": emp_id,
            "records_accessed_today": normal,
            "login_hour": 10,
            "data_exported_mb": 5.0
        }
        response = self.client.post("/api/v1/employee/analyze", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["emp_id"], emp_id)
        self.assertEqual(data["risk_level"], "LOW")
        self.assertEqual(data["recommended_action"], "NO_ACTION")

    def test_employee_analyze_high(self):
        # We target EMP-001
        response = self.client.get("/api/v1/employees")
        emp1 = response.json()[0]
        emp_id = emp1["emp_id"]
        normal = emp1["normal_records_per_day"]

        # Night login (30 pts), 3x normal records (45 pts), high export (15 pts) -> total risk 90
        payload = {
            "emp_id": emp_id,
            "records_accessed_today": normal * 3,
            "login_hour": 2,
            "data_exported_mb": 45.0
        }
        response = self.client.post("/api/v1/employee/analyze", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["emp_id"], emp_id)
        self.assertEqual(data["risk_level"], "HIGH")
        self.assertEqual(data["recommended_action"], "TEMPORARY_SUSPEND")
        self.assertIn("possible exfiltration", data["narrative"])

if __name__ == '__main__':
    unittest.main()
