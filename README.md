# ContextGuard — Identity Trust Engine
> Continuous behavioral authentication and adaptive threat mitigation for banking channels.

---

## The Problem
Modern digital banking interfaces remain vulnerable to identity compromises due to three systemic gaps:
* **Static Credentials Fail Post-Authentication**: Traditional MFA/passwords only secure the *gate*. Once a session is established, malicious actors can hijack the session cookie or active tab (account takeovers cost the banking industry over $15B annually).
* **High Friction in Step-Up Friction**: Legacy risk scoring systems force users through repetitive SMS/email OTP checks for regular transactions, driving a 25% drop in transaction conversion rates due to "MFA fatigue."
* **Opaque Fraud Decisions**: Security teams and branch managers are presented with binary "Block" warnings without contextual explanation, making human-in-the-loop review slow and prone to errors.

---

## Our Solution
ContextGuard is an adaptive, continuous identity trust engine that evaluates the risk of active banking sessions in real-time. Instead of treating authentication as a one-time gate check, ContextGuard aggregates behavioral, device, network, and transaction metadata to establish a rolling Trust Score. 

If session characteristics deviate from historical user patterns, ContextGuard silently escalates verification tiers. This allows clear users to transact with zero-friction, redirects borderline anomalies to video KYC checks, and freezes accounts experiencing severe pattern disruptions, all while presenting security analysts with clear, signal-by-signal explainability dashboards.

---

## How It Works
```text
[ User Action ]
       │
       ▼
┌────────────────────────────────────────────────────────┐
│               6 Signals Collected                      │
│ ┌───────────────┬──────────────────┬─────────────────┐ │
│ │ Biometrics    │ Device ID        │ Location (IP)   │ │
│ ├───────────────┼──────────────────┼─────────────────┤ │
│ │ Hour of Day   │ Transaction Size │ Recovery Flag   │ │
│ └───────────────┴──────────────────┴─────────────────┘ │
└──────────────────────┬─────────────────────────────────┘
                       │ (Telemetry Payload)
                       ▼
┌────────────────────────────────────────────────────────┐
│               Risk Score Engine                        │
│  - Calculates weighted final score (0-100)             │
│  - Formulates SHAP-like signal contributions           │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│               Decision Matrix Rules                    │
│    Score:  0-30      31-60        61-85       86-100   │
│    Tiers: [CLEAR]  [STEP_UP]  [HUMAN_REVIEW] [BLOCK]   │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│               Adaptive Response Tiers                  │
│  - CLEAR: Bypass secondary authentication              │
│  - STEP_UP: Prompt Video KYC / MFA challenge            │
│  - HUMAN_REVIEW: Queue in Manager HITL Sandbox         │
│  - BLOCK: Freeze account & restrict core transactions  │
└────────────────────────────────────────────────────────┘
```

---

## The 6 Signal Modules

| Signal | What It Detects | Risk Weight | Risk if Triggered |
| :--- | :--- | :---: | :--- |
| **Location Risk** | Geographic discrepancy against registration and last active city. | 20% | same city: `0`, Indian mismatch: `35`, foreign IP: `65`, city is null: `20` |
| **Device Risk** | Unrecognized browser user-agents and device fingerprints. | 20% | trusted device: `0`, unrecognized device: `55` |
| **Time Risk** | Access hour anomalies outside the user's historical log patterns. | 15% | standard (8-20): `0`, fringe (20-23): `35`, night (0-8): `70` |
| **Behavioral** | Deviations in keystroke flight time and key press durations. | 25% | variance < 100ms: `0`, 100-200ms: `40`, >200ms: `75` |
| **Transaction** | Transaction amount spikes compared to account averages. | 10% | <10K: `0`, 10K-50K: `30`, >50K: `60` |
| **Recovery Risk** | High-velocity password reset or account recovery attempts. | 10% | standard login: `0`, recovery attempt: `50` |

---

## Risk Score → Decision Matrix

| Score Range | Decision | User Experience | Example Trigger |
| :---: | :--- | :--- | :--- |
| **0 - 30** | `CLEAR` | Zero-friction. User passes directly to transaction authorization. | Normal Mumbai login at 2 PM, trusted browser, 120ms baseline keystrokes. |
| **31 - 60** | `STEP_UP` | Session challenged. Prompts secondary MFA or Video KYC verification. | Login from Delhi (different Indian city) using a new device in regular hours. |
| **61 - 85** | `HUMAN_REVIEW` | Transaction suspended. Sent to branch manager console for human approval. | Jaipur login, new device, 230ms keystroke variance, ₹45,000 transaction. |
| **86 - 100** | `BLOCK` | Session terminated. Core account features frozen; security team alerted. | Nighttime login at 3 AM from foreign IP, new device, ₹95,000 transaction. |

---

## Why This Wins
* **Continuous and Passive**: Traditional MFA only runs at the login gate. ContextGuard evaluates trust passively *during* the session without interrupting the user.
* **Explainable Decisions**: Decisions are not black boxes. Branch managers see the exact telemetry signal values that contributed to the score, preventing false positive overrides.
* **Adaptive Risk Baselines**: Baselines adjust to changing user habits (e.g. travel, changing devices) rather than using static global rules that generate noise.

---

## Explainability (SHAP)
Fraud engines are useless if they cannot be audited. ContextGuard calculates SHAP-like signal contributions for every assessment. The telemetry logs identify precisely which vectors (e.g., location deviation +22.1 pts, device trust +28.4 pts) drove the transaction into the review queue. This explainability is mapped straight to both the backend SQLite logs and the manager’s threat assessment cards.

---

## Human-In-The-Loop Design
ContextGuard keeps humans in the loop for borderline scores (`HUMAN_REVIEW` tier) because full automation can result in high customer drop-offs and operational friction. A bank manager can inspect the telemetry sandbox, assess whether the user is performing legitimate out-of-character actions (like transacting while traveling), and select the most appropriate response (e.g., bypass, prompt video KYC, or escalate) with one click.

---

## Demo

### Run Locally

#### Prerequisites
* Python 3.10+
* Node.js 18+

#### 1. Setup Backend
```bash
# Clone the repository
git clone https://github.com/sg721642/contextguard-bob-2026.git
cd contextguard-bob-2026

# Navigate to backend and install requirements
cd backend
pip install -r requirements.txt

# Create local environment config
copy .env.example .env

# Run database seeder (seeds 100 events, 20 profiles, 10 employees)
python database/seed_data.py

# Start the backend server
uvicorn main:app --reload
```

#### 2. Setup Frontend
```bash
# Navigate to the frontend directory
cd ../frontend

# Install dependencies
npm install

# Run the dev server
npm run dev
```
Open `http://localhost:5173` to access the ContextGuard SOC Console.

### API Endpoints

| Method | Endpoint | Description |
| :---: | :--- | :--- |
| `GET` | `/` | Checks service health and version metadata. |
| `POST` | `/api/v1/analyze` | Evaluates a transaction's risk score, determines the decision, and commits to database. |
| `GET` | `/api/v1/live-feed` | Retrieves the latest 50 security events logged, newest first. |
| `GET` | `/api/v1/dashboard/stats` | Aggregates daily stats, overall trust averages, and clear percentages. |
| `GET` | `/api/v1/user/{user_id}/history` | Fetches the last 20 logged risk events for a specific customer. |
| `GET` | `/api/v1/employees` | Lists all 10 monitored bank employees. |
| `POST` | `/api/v1/employee/analyze` | Analyzes insider threat risk based on records accessed, time, and data size. |

---

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend** | FastAPI (Python 3.13) | High-performance, asynchronous REST API service. |
| **Database** | SQLite3 | Local SQL storage tracking events, users, and audit logs. |
| **Frontend** | React (Vite) | Fast component-based client environment. |
| **Charts** | Recharts | Renders score history and risk trend lines. |

---

## Addresses All Problem Statement Risks
- [x] **Account Takeover (ATO)**: Continuous keystroke variance checks and device tracking.
- [x] **Session Hijacking**: Evaluates trust scores dynamically post-authentication.
- [x] **Credential Stuffing**: Mitigates high-velocity login and recovery attempt spikes.
- [x] **Location Geofencing Spoofing**: Mismatches between Indian registers and foreign IP locations.
- [x] **Data Exfiltration**: Checks employee record access ratios against normal baselines.
- [x] **Off-Hours Core Access**: Red-flags unauthorized night access to database tables.
- [x] **MFA Bypass/Fatigue**: Step-up triggers challenge suspicious actions without gating clean users.

---

## Future Scope
* **Biometric Keystroke Continuous Re-Training**: Moving baseline calculations to dynamic online learning models running inside web workers.
* **IP Velocity Tracking**: Flagging impossible travel scenarios (e.g. logins from Mumbai and Jaipur within 30 minutes).
* **Decentralized Audit Trails**: Committing manager decision override approvals to a private hyperledger network to prevent insider logs tampering.

---

## Team
* **Team Sentinel** — Bank of Baroda PSB Hackathon 2026

---
*ContextGuard — Trust is not a password. Trust is a pattern.*
*Bank of Baroda PSB Hackathon 2026 | IIT Gandhinagar*
