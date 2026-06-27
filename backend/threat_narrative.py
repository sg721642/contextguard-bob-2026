"""
threat_narrative.py
===================
Generates insider threat AI narratives using Gemini 2.0 Flash.
Called by main.py's POST /api/v1/employee/analyze endpoint.

Code path:
  1. If GEMINI_API_KEY is set  → real Gemini 2.0 Flash API call
  2. If API call fails at runtime → rule_based_fallback() (logged as error)
  3. If GEMINI_API_KEY missing   → rule_based_fallback() (logged as warning)

The fallback is a genuine last resort, not the primary path.
"""

import os
import json
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# SYSTEM PROMPT
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are a senior insider threat security analyst at the Cybersecurity
Operations Center of a major Indian bank (Bank of Baroda).

Analyze employee behavioral telemetry and produce a threat assessment report.

You MUST respond with ONLY valid JSON — no markdown fences, no explanation outside the JSON.

Output schema (strict):
{
  "risk_score": <integer 0-100>,
  "risk_level": <"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">,
  "narrative": <string — 2-3 sentences, plain English, cite the actual numbers from input>,
  "top_signals": [<list of 1-3 strings naming the signals that drove the score>],
  "recommended_action": <"NO_ACTION" | "MONITOR" | "TEMPORARY_SUSPEND" | "IMMEDIATE_SUSPEND" | "ESCALATE_TO_CISO">,
  "confidence": <float 0.0-1.0>
}

Scoring rules:
- records_ratio = records_accessed / normal_records_per_day
  - <= 1.0x  → +0 pts
  - 1.0-2.0x → +20 pts
  - 2.0-3.5x → +35 pts
  - > 3.5x   → +45 pts
- login_hour (0-23):
  - 8-18 → +0 pts (business hours)
  - 19-22 or 6-7 → +15 pts (fringe)
  - 0-5 or 23 → +30 pts (night, critical)
- data_exported_mb:
  - <= 5 MB  → +0 pts
  - 5-20 MB  → +10 pts
  - 20-50 MB → +20 pts
  - > 50 MB  → +30 pts
- risk_score = min(100, sum of above points)
- risk_level: 0-25 LOW, 26-50 MEDIUM, 51-75 HIGH, 76-100 CRITICAL

Narrative rules:
- Always mention the employee name, department, and actual numbers.
- Do not invent data not present in the input.
- Be direct and professional, not alarmist.
"""

# ---------------------------------------------------------------------------
# FEW-SHOT EXAMPLES (2 examples to anchor the model's output format)
# ---------------------------------------------------------------------------
FEW_SHOT_EXAMPLES = [
    {
        "role": "user",
        "content": json.dumps({
            "emp_id": "EMP-005", "name": "Suresh Yadav", "department": "Retail",
            "records_accessed": 203, "normal_records_per_day": 50,
            "login_hour": 3, "data_exported_mb": 78.0
        })
    },
    {
        "role": "model",
        "content": json.dumps({
            "risk_score": 91, "risk_level": "CRITICAL",
            "narrative": (
                "Suresh Yadav accessed 203 Retail records — 4.06x his daily baseline of 50 — "
                "and exported 78MB of data at 3AM, deep outside approved working hours. "
                "This combination of night-time access, excessive volume, and large export "
                "strongly matches known data exfiltration patterns and warrants immediate suspension."
            ),
            "top_signals": ["login_hour", "data_exported_mb", "records_ratio"],
            "recommended_action": "IMMEDIATE_SUSPEND",
            "confidence": 0.95
        })
    },
    {
        "role": "user",
        "content": json.dumps({
            "emp_id": "EMP-004", "name": "Neha Patel", "department": "Compliance",
            "records_accessed": 22, "normal_records_per_day": 30,
            "login_hour": 11, "data_exported_mb": 2.0
        })
    },
    {
        "role": "model",
        "content": json.dumps({
            "risk_score": 8, "risk_level": "LOW",
            "narrative": (
                "Neha Patel accessed 22 Compliance records, below her baseline of 30, "
                "during standard working hours at 11AM. Data export of 2MB is within "
                "acceptable limits. No anomalous signals detected in today's session."
            ),
            "top_signals": [],
            "recommended_action": "NO_ACTION",
            "confidence": 0.97
        })
    }
]


# ---------------------------------------------------------------------------
# RULE-BASED FALLBACK
# Only called when the live Gemini API call actually fails at runtime.
# ---------------------------------------------------------------------------
def _rule_based_fallback(employee_data: dict) -> dict:
    records  = employee_data.get("records_accessed", 0)
    normal   = max(employee_data.get("normal_records_per_day", 40), 1)
    hour     = employee_data.get("login_hour", 12)
    exported = employee_data.get("data_exported_mb", 0.0)
    name     = employee_data.get("name", employee_data.get("emp_id", "Employee"))
    dept     = employee_data.get("department", "")

    ratio = records / normal

    if ratio <= 1.0:     r_pts = 0
    elif ratio <= 2.0:   r_pts = 20
    elif ratio <= 3.5:   r_pts = 35
    else:                r_pts = 45

    if 8 <= hour <= 18:              l_pts = 0
    elif (19 <= hour <= 22) or (6 <= hour <= 7): l_pts = 15
    else:                            l_pts = 30

    if exported <= 5.0:    e_pts = 0
    elif exported <= 20.0: e_pts = 10
    elif exported <= 50.0: e_pts = 20
    else:                  e_pts = 30

    risk_score = min(100, r_pts + l_pts + e_pts)

    if risk_score <= 25:
        risk_level, action = "LOW",      "NO_ACTION"
    elif risk_score <= 50:
        risk_level, action = "MEDIUM",   "MONITOR"
    elif risk_score <= 75:
        risk_level, action = "HIGH",     "TEMPORARY_SUSPEND"
    else:
        risk_level, action = "CRITICAL", "IMMEDIATE_SUSPEND"

    top_signals = []
    if r_pts >= 20: top_signals.append("records_ratio")
    if l_pts >= 15: top_signals.append("login_hour")
    if e_pts >= 10: top_signals.append("data_exported_mb")

    dept_str = f" {dept}" if dept else ""
    narrative = (
        f"{name} accessed {records}{dept_str} records ({ratio:.1f}x baseline of {normal}) "
        f"at {hour:02d}:00"
    )
    if exported > 0:
        narrative += f", exporting {exported:.1f}MB"
    if risk_level == "CRITICAL":
        narrative += ". Activity profile matches high-severity exfiltration — immediate action required."
    elif risk_level == "HIGH":
        narrative += ". Elevated access pattern warrants review and temporary access restriction."
    elif risk_level == "MEDIUM":
        narrative += ". Mildly elevated activity — continue monitoring for repeated behaviour."
    else:
        narrative += ". No significant anomalies detected."

    return {
        "risk_score":         risk_score,
        "risk_level":         risk_level,
        "narrative":          narrative,
        "top_signals":        top_signals,
        "recommended_action": action,
        "confidence":         0.72,
        "source":             "rule_based_fallback"
    }


# ---------------------------------------------------------------------------
# MAIN PUBLIC FUNCTION
# ---------------------------------------------------------------------------
def generate_threat_narrative(employee_data: dict) -> dict:
    """
    Returns a threat assessment dict for one employee.

    Keys returned:
      risk_score (int), risk_level (str), narrative (str),
      top_signals (list), recommended_action (str),
      confidence (float), source (str: "gemini-2.0-flash" or "rule_based_fallback")
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    if not api_key:
        logger.warning(
            "GEMINI_API_KEY not set — using rule-based fallback for %s",
            employee_data.get("emp_id", "?")
        )
        return _rule_based_fallback(employee_data)

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        # Build few-shot conversation turns for v2 SDK
        contents = []
        for turn in FEW_SHOT_EXAMPLES:
            contents.append(
                types.Content(
                    role=turn["role"],
                    parts=[types.Part(text=turn["content"])]
                )
            )
        # Append the actual employee to analyse
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part(text=json.dumps(employee_data))]
            )
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0.25,
                max_output_tokens=512,
            )
        )

        raw = response.text.strip()

        # Strip markdown fences if the model adds them despite the mime type
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        result = json.loads(raw)

        # Validate all required keys are present
        required = {
            "risk_score", "risk_level", "narrative",
            "top_signals", "recommended_action", "confidence"
        }
        missing = required - result.keys()
        if missing:
            raise ValueError(f"Gemini response missing keys: {missing}")

        # Clamp risk_score to [0, 100]
        result["risk_score"] = max(0, min(100, int(result["risk_score"])))
        result["source"] = "gemini-2.0-flash"

        logger.info(
            "Gemini analysis complete for %s — score=%s level=%s confidence=%s",
            employee_data.get("emp_id", "?"),
            result["risk_score"],
            result["risk_level"],
            result.get("confidence")
        )
        return result

    except Exception as exc:
        logger.error(
            "Gemini API call failed for %s: %s — falling back to rule-based",
            employee_data.get("emp_id", "?"),
            exc,
            exc_info=True
        )
        result = _rule_based_fallback(employee_data)
        result["source"] = "rule_based_fallback"
        return result


# ---------------------------------------------------------------------------
# BATCH HELPER
# ---------------------------------------------------------------------------
def batch_analyze(employees: list) -> list:
    """
    Runs generate_threat_narrative for a list of employee dicts.
    Each dict should contain the same keys as generate_threat_narrative expects.
    """
    return [generate_threat_narrative(emp) for emp in employees]


# ---------------------------------------------------------------------------
# USER PROFILE IDENTITY TRUST ASSESSMENT
# ---------------------------------------------------------------------------
USER_SYSTEM_PROMPT = """You are a senior identity trust analyst at the Cybersecurity Operations Center of a major Indian bank (Bank of Baroda).
Analyze a customer's recent login history compared to their registered baseline profile and generate a professional threat narrative.

You MUST respond with ONLY valid JSON — no markdown fences.

Output schema (strict):
{
  "risk_level": <"CLEAR" | "ELEVATED" | "CRITICAL">,
  "narrative": <string — 2-3 sentences, citing actual cities, device types, or times from baseline and history>,
  "confidence": <float 0.0-1.0>
}
"""

USER_FEW_SHOT_EXAMPLES = [
    {
        "role": "user",
        "content": json.dumps({
            "user_profile": {
                "user_id": "USR-4721", "normal_city": "Mumbai",
                "normal_login_hour_start": 9, "normal_login_hour_end": 19,
                "baseline_keystroke_ms": 120.0, "account_age_days": 847
            },
            "recent_events": [
                {
                    "timestamp": "2026-06-27 02:34:17", "city": "Jaipur", "login_hour": 2,
                    "is_new_device": True, "keystroke_variance_ms": 285.0,
                    "final_risk_score": 95, "decision": "BLOCK"
                }
            ]
        })
    },
    {
        "role": "model",
        "content": json.dumps({
            "risk_level": "CRITICAL",
            "narrative": (
                "Behavioral pattern deviation detected. User USR-4721 accessed account from Jaipur "
                "(registered city Mumbai) using a new device at 02:34 AM — outside the normal window of 09:00-19:00. "
                "Keystroke variance of 285ms is significantly higher than the 120ms baseline, suggesting possible takeover."
            ),
            "confidence": 0.94
        })
    }
]

def _user_rule_based_fallback(user_profile: dict, recent_events: list) -> dict:
    if not recent_events:
        return {
            "risk_level": "CLEAR",
            "narrative": f"No anomalous activity detected for user {user_profile.get('user_id')}. Account patterns are within normal operational limits.",
            "confidence": 0.85,
            "source": "user_rule_based_fallback"
        }

    latest = recent_events[0]
    score = latest.get("final_risk_score", 0)
    city = latest.get("city", "Unknown")
    normal_city = user_profile.get("normal_city", "Mumbai")
    hour = latest.get("login_hour", 12)
    device_status = "unrecognized device" if latest.get("is_new_device") else "trusted device"
    
    if score >= 86:
        risk_level = "CRITICAL"
        desc = "Critical behavioral pattern deviation detected."
    elif score >= 61:
        risk_level = "ELEVATED"
        desc = "Elevated risk pattern detected."
    else:
        risk_level = "CLEAR"
        desc = "Normal profile activity."

    narrative = (
        f"{desc} User {user_profile.get('user_id')} accessed account from {city} "
        f"(registered home: {normal_city}) using a {device_status} at {hour:02d}:00. "
        f"Session score is {score}/100."
    )

    return {
        "risk_level": risk_level,
        "narrative": narrative,
        "confidence": 0.80,
        "source": "user_rule_based_fallback"
    }

def generate_user_narrative(user_profile: dict, recent_events: list) -> dict:
    """
    Generates a threat assessment narrative for a bank customer.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    if not api_key:
        logger.warning("GEMINI_API_KEY not set — using user rule-based fallback")
        return _user_rule_based_fallback(user_profile, recent_events)

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        contents = []
        for turn in USER_FEW_SHOT_EXAMPLES:
            contents.append(
                types.Content(
                    role=turn["role"],
                    parts=[types.Part(text=turn["content"])]
                )
            )

        payload = {
            "user_profile": user_profile,
            "recent_events": recent_events[:5]  # send up to 5 events
        }

        contents.append(
            types.Content(
                role="user",
                parts=[types.Part(text=json.dumps(payload))]
            )
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=USER_SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0.2,
                max_output_tokens=512,
            )
        )

        raw = response.text.strip()
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        result = json.loads(raw)
        result["source"] = "gemini-2.0-flash"
        return result

    except Exception as exc:
        logger.error(f"User Gemini API call failed: {exc}")
        result = _user_rule_based_fallback(user_profile, recent_events)
        result["source"] = "user_rule_based_fallback"
        return result

