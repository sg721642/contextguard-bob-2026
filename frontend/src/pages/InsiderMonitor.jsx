import React, { useState, useEffect } from 'react';

// ─── Hardcoded employee data ────────────────────────────────────────────────
const EMPLOYEES = [
  {
    id: 'EMP-001', name: 'Rajesh Kumar',  department: 'Loans',      risk: 82,  level: 'HIGH',
    records: 127, normalRecords: 42,  loginTime: '02:34 AM', dataExported: 45.2,
    normalHours: { start: 9, end: 18 }, loginHour: 2,
    analysis: `ANALYZING: EMP-001 — Rajesh Kumar | Loans Department
RISK SCORE: 82/100 | LEVEL: HIGH

Employee accessed 127 customer loan records (3.0x baseline of 42) and exported
45.2MB of data between 02:00–03:30 AM, outside approved working hours of
9AM–6PM. Access pattern matches known data exfiltration signatures. Combined
with login from new IP (117.x.x.x) not associated with office network, this
warrants immediate investigation.

RECOMMENDED ACTION: TEMPORARY_SUSPEND + SECURITY AUDIT`
  },
  {
    id: 'EMP-002', name: 'Priya Sharma',  department: 'IT',         risk: 15,  level: 'LOW',
    records: 38,  normalRecords: 40,  loginTime: '10:12 AM', dataExported: 0,
    normalHours: { start: 9, end: 18 }, loginHour: 10,
    analysis: `ANALYZING: EMP-002 — Priya Sharma | IT Department
RISK SCORE: 15/100 | LEVEL: LOW

No anomalies detected. Record access count (38) within baseline range of 40.
Login at 10:12 AM falls within approved working hours. Zero data exports recorded.
Standard IT operations profile. No further action required.

RECOMMENDED ACTION: NO_ACTION — Continue routine monitoring`
  },
  {
    id: 'EMP-003', name: 'Amit Singh',    department: 'Operations', risk: 61,  level: 'MEDIUM',
    records: 89,  normalRecords: 45,  loginTime: '08:02 PM', dataExported: 12,
    normalHours: { start: 9, end: 18 }, loginHour: 20,
    analysis: `ANALYZING: EMP-003 — Amit Singh | Operations Department
RISK SCORE: 61/100 | LEVEL: MEDIUM

Employee accessed 89 records (1.98x baseline of 45) and exported 12MB of data
at 8:02 PM, marginally outside approved working hours. Elevated but not yet
critical. The data export volume (12MB) is above the 10MB threshold.
Pattern is consistent with end-of-day batch operations but warrants monitoring.

RECOMMENDED ACTION: MONITOR — Review export content logs`
  },
  {
    id: 'EMP-004', name: 'Neha Patel',    department: 'Compliance', risk: 8,   level: 'LOW',
    records: 22,  normalRecords: 30,  loginTime: '11:05 AM', dataExported: 2,
    normalHours: { start: 9, end: 18 }, loginHour: 11,
    analysis: `ANALYZING: EMP-004 — Neha Patel | Compliance Department
RISK SCORE: 8/100 | LEVEL: LOW

No anomalies detected. Record access below baseline (22 vs 30). Login at
11:05 AM is within normal working hours. Data export of 2MB is within
acceptable limits. Standard compliance workflow observed.

RECOMMENDED ACTION: NO_ACTION — Normal behaviour confirmed`
  },
  {
    id: 'EMP-005', name: 'Suresh Yadav',  department: 'Retail',    risk: 91,  level: 'CRITICAL',
    records: 203, normalRecords: 50,  loginTime: '03:11 AM', dataExported: 78,
    normalHours: { start: 9, end: 18 }, loginHour: 3,
    analysis: `ANALYZING: EMP-005 — Suresh Yadav | Retail Department
RISK SCORE: 91/100 | LEVEL: CRITICAL

CRITICAL ANOMALY DETECTED. Employee accessed 203 retail customer records
(4.06x baseline of 50) and exported 78MB of data at 03:11 AM — deep outside
approved hours. This volume and timing is strongly correlated with exfiltration
attempts. Unrecognized device fingerprint detected. IP geolocation mismatch.

RECOMMENDED ACTION: IMMEDIATE_SUSPEND + ESCALATE TO CISO`
  },
  {
    id: 'EMP-006', name: 'Ananya Roy',    department: 'IT',         risk: 25,  level: 'LOW',
    records: 41,  normalRecords: 40,  loginTime: '02:15 PM', dataExported: 5,
    normalHours: { start: 9, end: 18 }, loginHour: 14,
    analysis: `ANALYZING: EMP-006 — Ananya Roy | IT Department
RISK SCORE: 25/100 | LEVEL: LOW

Minor elevation in record access (41 vs 40 baseline). Login at 2:15 PM is
within normal working hours. Data export of 5MB is within acceptable range.
No anomalous patterns detected. Routine IT administration workload.

RECOMMENDED ACTION: NO_ACTION — Continue standard monitoring`
  },
  {
    id: 'EMP-007', name: 'Vikram Nair',   department: 'Loans',     risk: 44,  level: 'MEDIUM',
    records: 65,  normalRecords: 42,  loginTime: '07:48 PM', dataExported: 8,
    normalHours: { start: 9, end: 18 }, loginHour: 19,
    analysis: `ANALYZING: EMP-007 — Vikram Nair | Loans Department
RISK SCORE: 44/100 | LEVEL: MEDIUM

Record access at 65 (1.55x baseline of 42). Late login at 7:48 PM marginally
outside approved hours. Data export of 8MB is within acceptable bounds.
Pattern is consistent with end-of-month loan processing. Low-to-medium concern.

RECOMMENDED ACTION: MONITOR — Flag for supervisor review if pattern persists`
  },
  {
    id: 'EMP-008', name: 'Kavya Reddy',   department: 'Operations', risk: 12,  level: 'LOW',
    records: 18,  normalRecords: 35,  loginTime: '09:22 AM', dataExported: 1,
    normalHours: { start: 9, end: 18 }, loginHour: 9,
    analysis: `ANALYZING: EMP-008 — Kavya Reddy | Operations Department
RISK SCORE: 12/100 | LEVEL: LOW

No anomalies detected. Record access well below baseline (18 vs 35).
Login at 9:22 AM within approved hours. Data export minimal (1MB).
Standard light-duty operations observed.

RECOMMENDED ACTION: NO_ACTION — Normal pattern confirmed`
  },
  {
    id: 'EMP-009', name: 'Rohit Gupta',   department: 'Retail',    risk: 73,  level: 'HIGH',
    records: 110, normalRecords: 48,  loginTime: '11:52 PM', dataExported: 31,
    normalHours: { start: 9, end: 18 }, loginHour: 23,
    analysis: `ANALYZING: EMP-009 — Rohit Gupta | Retail Department
RISK SCORE: 73/100 | LEVEL: HIGH

Employee accessed 110 retail records (2.29x baseline of 48) at 11:52 PM,
significantly outside approved working hours of 9AM–6PM. Data export of 31MB
is well above the 10MB threshold. Night-time access combined with elevated
record count is consistent with unauthorized data harvesting behaviour.

RECOMMENDED ACTION: TEMPORARY_SUSPEND + MANAGER NOTIFICATION`
  },
  {
    id: 'EMP-010', name: 'Divya Mehta',   department: 'Compliance', risk: 5,   level: 'LOW',
    records: 15,  normalRecords: 28,  loginTime: '10:40 AM', dataExported: 0,
    normalHours: { start: 9, end: 18 }, loginHour: 10,
    analysis: `ANALYZING: EMP-010 — Divya Mehta | Compliance Department
RISK SCORE: 5/100 | LEVEL: LOW

No anomalies detected. Record count (15) below baseline. Login at 10:40 AM
is within approved hours. No data exports recorded.
Optimal compliance behaviour observed.

RECOMMENDED ACTION: NO_ACTION — Trusted profile`
  }
];

// ─── Colour helpers ─────────────────────────────────────────────────────────
const getRiskColor = (level) => {
  if (level === 'CRITICAL') return 'var(--red-threat)';
  if (level === 'HIGH')     return 'var(--orange-mid)';
  if (level === 'MEDIUM')   return 'var(--amber)';
  return 'var(--clear)';
};

const getRiskBg = (level) => {
  if (level === 'CRITICAL') return 'var(--red-dim)';
  if (level === 'HIGH')     return 'rgba(255,107,53,0.12)';
  if (level === 'MEDIUM')   return 'var(--amber-dim)';
  return 'var(--clear-dim)';
};

const getRiskBorder = (level) => {
  if (level === 'CRITICAL') return 'rgba(255,45,45,0.4)';
  if (level === 'HIGH')     return 'rgba(255,107,53,0.4)';
  if (level === 'MEDIUM')   return 'var(--border-amber)';
  return 'rgba(0,255,135,0.4)';
};

const getDeptColor = (dept) => {
  const map = { Loans: 'var(--amber)', IT: 'var(--orange-mid)', Operations: 'var(--text-mono)', Retail: '#A0D0FF', Compliance: 'var(--clear)' };
  return map[dept] || 'var(--text-dim)';
};

const isOutsideHours   = (emp) => emp.loginHour < emp.normalHours.start || emp.loginHour >= emp.normalHours.end;
const isHighRecords    = (emp) => emp.records > emp.normalRecords * 2;
const isHighExport     = (emp) => emp.dataExported > 10;

const API_BASE = 'https://contextguard-backend.onrender.com/api/v1';

export default function InsiderMonitor() {
  const [employees, setEmployees] = useState(EMPLOYEES);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [selected, setSelected] = useState(null);
  const [empStatuses, setEmpStatuses] = useState(() =>
    Object.fromEntries(EMPLOYEES.map(e => [e.id, 'ACTIVE']))
  );

  const criticalEmployees = employees.filter(e => e.risk > 80);

  // Fetch employees from backend on mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${API_BASE}/employees`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        
        // Merge backend data with local metrics baselines and descriptions
        const merged = data.map(fe => {
          const match = EMPLOYEES.find(e => e.id === fe.emp_id);
          if (match) {
            return {
              ...match,
              name: fe.name,
              department: fe.department,
              normalRecords: fe.normal_records_per_day,
              access_level: fe.access_level
            };
          }
          return {
            id: fe.emp_id,
            name: fe.name,
            department: fe.department,
            risk: 10,
            level: 'LOW',
            records: fe.normal_records_per_day,
            normalRecords: fe.normal_records_per_day,
            loginTime: '10:00 AM',
            dataExported: 0,
            normalHours: { start: 9, end: 18 },
            loginHour: 10,
            analysis: `ANALYZING: ${fe.emp_id} — ${fe.name}\nNo critical activity anomalies detected.`
          };
        });
        setEmployees(merged);
        setIsDemoMode(false);
      } catch (e) {
        console.log("Backend offline. Fallback to static demo mode.");
        setIsDemoMode(true);
      }
    };
    fetchEmployees();
  }, []);

  const handleAction = (empId, action) => {
    setEmpStatuses(prev => ({ ...prev, [empId]: action }));
  };

  const handleSuspend = async (emp) => {
    try {
      const res = await fetch(`${API_BASE}/employee/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emp_id: emp.id,
          records_accessed_today: emp.records,
          login_hour: emp.loginHour,
          data_exported_mb: emp.dataExported
        })
      });
      if (res.ok) {
        const data = await res.json();
        // Dynamically update the employee's risk score and description in the UI
        setEmployees(prev => prev.map(e => {
          if (e.id === emp.id) {
            return {
              ...e,
              risk: data.risk_score,
              level: data.risk_level,
              analysis: data.narrative
            };
          }
          return e;
        }));
        setSelected(prev => ({
          ...prev,
          risk: data.risk_score,
          level: data.risk_level,
          analysis: data.narrative
        }));
      }
    } catch (e) {
      console.log("Backend unreachable during suspension analysis. Performing offline override.");
    }
    handleAction(emp.id, 'SUSPENDED');
  };

  return (
    <>
      {/* Keyframes */}
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes blink-cursor-im {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        .emp-card {
          transition: border-color 0.15s, background-color 0.15s;
          cursor: pointer;
        }
        .emp-card:hover { border-color: var(--amber) !important; background-color: #12151E !important; }
        .action-btn { transition: background-color 0.15s, color 0.15s; cursor: pointer; }
      `}</style>

      <div style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: 'var(--bg-void)',
        overflow: 'hidden',
        position: 'relative'
      }}>

        {/* ── MAIN CONTENT ─────────────────────────────────────── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0
        }}>

          {/* CRITICAL ALERT BANNER */}
          {criticalEmployees.length > 0 && (
            <div style={{
              backgroundColor: 'rgba(255,45,45,0.08)',
              borderBottom: '1px solid rgba(255,45,45,0.4)',
              padding: '10px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexShrink: 0
            }}>
              <span style={{
                width: '8px', height: '8px',
                backgroundColor: 'var(--red-threat)',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'pulse-amber 1.1s infinite ease-in-out'
              }} />
              <span className="mono" style={{ fontSize: '12px', color: 'var(--amber)', fontWeight: 'bold' }}>
                ⚠ CRITICAL: {criticalEmployees.length} employee{criticalEmployees.length > 1 ? 's' : ''} flagged for immediate review
                &nbsp;—&nbsp;
                {criticalEmployees.map(e => e.id).join(', ')}
              </span>
            </div>
          )}

          {/* PAGE HEADER */}
          <div style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <div>
              <h1 className="display" style={{
                fontSize: '22px', fontWeight: '700',
                color: 'var(--amber)', margin: '0 0 6px 0'
              }}>
                INSIDER THREAT MONITOR
              </h1>
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px', color: 'var(--text-dim)', margin: 0
              }}>
                Bank employee behavioral analysis — real-time anomaly detection
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', marginRight: '10px' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: isDemoMode ? 'var(--amber)' : 'var(--clear)',
                  borderRadius: '50%',
                  display: 'inline-block'
                }}></span>
                <span style={{ color: isDemoMode ? 'var(--amber)' : 'var(--clear)', letterSpacing: '0.1em', fontWeight: 'bold' }}>
                  {isDemoMode ? 'DEMO MODE' : 'API CONNECTED'}
                </span>
              </div>
              <span className="mono" style={{
                fontSize: '11px', fontWeight: 'bold',
                color: 'var(--amber)',
                border: '1px solid var(--border-amber)',
                padding: '5px 12px',
                backgroundColor: 'var(--amber-dim)'
              }}>
                {employees.length} EMPLOYEES MONITORED
              </span>
              <span className="mono" style={{
                fontSize: '11px', fontWeight: 'bold',
                color: 'var(--red-threat)',
                border: '1px solid rgba(255,45,45,0.4)',
                padding: '5px 12px',
                backgroundColor: 'var(--red-dim)'
              }}>
                {criticalEmployees.length} CRITICAL
              </span>
            </div>
          </div>

          {/* EMPLOYEE GRID */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '14px'
            }}>
              {employees.map((emp) => {
                const isSelected   = selected?.id === emp.id;
                const status       = empStatuses[emp.id];
                const badOutsideHrs = isOutsideHours(emp);
                const badRecords   = isHighRecords(emp);
                const badExport    = isHighExport(emp);

                return (
                  <div
                    key={emp.id}
                    className="emp-card"
                    onClick={() => setSelected(isSelected ? null : emp)}
                    style={{
                      backgroundColor: isSelected ? '#12151E' : '#0F1117',
                      border: `1px solid ${isSelected ? 'var(--amber)' : 'var(--border)'}`,
                      borderRadius: 0,
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      position: 'relative'
                    }}
                  >
                    {/* Status ribbon */}
                    {status !== 'ACTIVE' && (
                      <div style={{
                        position: 'absolute', top: 0, right: 0,
                        padding: '3px 10px',
                        backgroundColor:
                          status === 'SUSPENDED' ? 'var(--red-dim)' :
                          status === 'FLAGGED'   ? 'var(--amber-dim)' : 'var(--clear-dim)',
                        borderLeft: `2px solid ${
                          status === 'SUSPENDED' ? 'var(--red-threat)' :
                          status === 'FLAGGED'   ? 'var(--amber)' : 'var(--clear)'
                        }`
                      }}>
                        <span className="mono" style={{
                          fontSize: '9px', fontWeight: 'bold',
                          color:
                            status === 'SUSPENDED' ? 'var(--red-threat)' :
                            status === 'FLAGGED'   ? 'var(--amber)' : 'var(--clear)'
                        }}>
                          {status}
                        </span>
                      </div>
                    )}

                    {/* Top row: EMP ID + dept badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="mono" style={{
                        fontSize: '12px', fontWeight: 'bold', color: 'var(--amber)'
                      }}>
                        {emp.id}
                      </span>
                      <span className="mono" style={{
                        fontSize: '10px', color: getDeptColor(emp.department),
                        border: `1px solid ${getDeptColor(emp.department)}33`,
                        padding: '2px 8px'
                      }}>
                        {emp.department.toUpperCase()}
                      </span>
                    </div>

                    {/* Name + Level Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="display" style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '600' }}>
                        {emp.name}
                      </span>
                      <span className="badge" style={{
                        fontSize: '9px',
                        backgroundColor: getRiskBg(emp.level),
                        color: getRiskColor(emp.level),
                        border: `1px solid ${getRiskBorder(emp.level)}`
                      }}>
                        {emp.level}
                      </span>
                    </div>

                    {/* Risk bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span className="mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>RISK SCORE</span>
                        <span className="mono" style={{
                          fontSize: '11px', fontWeight: 'bold',
                          color: getRiskColor(emp.level)
                        }}>
                          {emp.risk}/100
                        </span>
                      </div>
                      <div style={{
                        width: '100%', height: '6px',
                        backgroundColor: 'var(--bg-void)',
                        border: '1px solid var(--border)'
                      }}>
                        <div style={{
                          width: `${emp.risk}%`, height: '100%',
                          backgroundColor: getRiskColor(emp.level),
                          transition: 'width 0.8s ease'
                        }} />
                      </div>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div className="mono" style={{ fontSize: '11px', color: badRecords ? 'var(--red-threat)' : 'var(--text-dim)' }}>
                        Records today:&nbsp;
                        <span style={{ fontWeight: 'bold' }}>{emp.records}</span>
                        <span style={{ color: 'var(--text-dim)' }}> (normal: {emp.normalRecords})</span>
                      </div>
                      <div className="mono" style={{ fontSize: '11px', color: badOutsideHrs ? 'var(--red-threat)' : 'var(--text-dim)' }}>
                        Last login:&nbsp;
                        <span style={{ fontWeight: 'bold' }}>{emp.loginTime}</span>
                      </div>
                      <div className="mono" style={{ fontSize: '11px', color: badExport ? 'var(--red-threat)' : 'var(--text-dim)' }}>
                        Data exported:&nbsp;
                        <span style={{ fontWeight: 'bold' }}>{emp.dataExported} MB</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── DETAIL PANEL (slide in from right) ───────────────── */}
        {selected && (
          <div style={{
            width: '380px',
            height: '100%',
            backgroundColor: '#0F1117',
            borderLeft: '1px solid var(--amber)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            animation: 'slide-in-right 0.22s ease-out',
            overflowY: 'auto'
          }}>
            {/* Panel header */}
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
              backgroundColor: 'rgba(255,140,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <div>
                <span className="mono" style={{ fontSize: '12px', color: 'var(--amber)', fontWeight: 'bold' }}>
                  {selected.id}
                </span>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--text-dim)', marginLeft: '10px' }}>
                  {selected.department}
                </span>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--text-dim)', width: '28px', height: '28px',
                  cursor: 'pointer', fontSize: '14px', borderRadius: 0
                }}
              >
                ✕
              </button>
            </div>

            {/* Panel body */}
            <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Name & Risk */}
              <div>
                <div className="display" style={{
                  fontSize: '18px', fontWeight: '700',
                  color: 'var(--text-primary)', marginBottom: '6px'
                }}>
                  {selected.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="mono" style={{
                    fontSize: '24px', fontWeight: 'bold',
                    color: getRiskColor(selected.level)
                  }}>
                    {selected.risk}
                  </span>
                  <span className="mono" style={{ fontSize: '12px', color: 'var(--text-dim)' }}>/ 100</span>
                  <span className="badge" style={{
                    fontSize: '10px',
                    backgroundColor: getRiskBg(selected.level),
                    color: getRiskColor(selected.level),
                    border: `1px solid ${getRiskBorder(selected.level)}`
                  }}>
                    {selected.level}
                  </span>
                </div>
              </div>

              {/* Full stats */}
              <div style={{
                backgroundColor: 'var(--bg-void)',
                border: '1px solid var(--border)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {[
                  { label: 'Records Accessed', value: `${selected.records}`, normal: `baseline: ${selected.normalRecords}`, bad: isHighRecords(selected) },
                  { label: 'Login Time', value: selected.loginTime, normal: `approved: ${selected.normalHours.start}AM–${selected.normalHours.end >= 12 ? selected.normalHours.end - 12 + 'PM' : selected.normalHours.end + 'AM'}`, bad: isOutsideHours(selected) },
                  { label: 'Data Exported', value: `${selected.dataExported} MB`, normal: 'threshold: 10 MB', bad: isHighExport(selected) },
                ].map(({ label, value, normal, bad }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span className="mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{label}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span className="mono" style={{ fontSize: '12px', fontWeight: 'bold', color: bad ? 'var(--red-threat)' : 'var(--text-primary)' }}>
                        {value}
                      </span>
                      <br />
                      <span className="mono" style={{ fontSize: '9px', color: 'var(--text-dim)' }}>{normal}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gemini Analysis terminal */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="mono" style={{ fontSize: '10px', color: 'var(--amber)', fontWeight: 'bold', letterSpacing: '0.06em' }}>
                    AI THREAT ASSESSMENT
                  </span>
                  <span className="badge" style={{
                    fontSize: '8px', padding: '2px 6px',
                    backgroundColor: 'rgba(255,140,0,0.15)',
                    color: 'var(--amber)',
                    border: '1px solid var(--border-amber)'
                  }}>
                    GEMINI 2.5 FLASH
                  </span>
                </div>
                <div style={{
                  backgroundColor: '#050709',
                  border: '1px solid rgba(255,140,0,0.3)',
                  padding: '12px'
                }}>
                  <pre className="mono" style={{
                    margin: 0, fontSize: '11px',
                    color: 'var(--amber)', lineHeight: '1.8',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}>
                    {selected.analysis}
                    <span style={{ animation: 'blink-cursor-im 0.8s step-start infinite', color: 'var(--amber)' }}>█</span>
                  </pre>
                  <div className="mono" style={{
                    fontSize: '9px', color: 'var(--text-dim)',
                    borderTop: '1px solid var(--border)',
                    paddingTop: '6px', marginTop: '8px'
                  }}>
                    — Generated by Gemini 2.5 Flash | Confidence: 0.91 | Model: contextguard-insider-v1
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--amber)', fontWeight: 'bold', letterSpacing: '0.06em', marginBottom: '2px' }}>
                  MANAGER ACTIONS
                </div>

                <button
                  className="action-btn mono"
                  onClick={() => handleAction(selected.id, 'CLEARED')}
                  style={{
                    width: '100%', height: '38px', borderRadius: 0,
                    backgroundColor: 'transparent',
                    border: '1px solid var(--clear)',
                    color: 'var(--clear)',
                    fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.04em'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--clear-dim)'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  CLEAR — NO THREAT DETECTED
                </button>

                <button
                  className="action-btn mono"
                  onClick={() => handleAction(selected.id, 'FLAGGED')}
                  style={{
                    width: '100%', height: '38px', borderRadius: 0,
                    backgroundColor: 'transparent',
                    border: '1px solid var(--amber)',
                    color: 'var(--amber)',
                    fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.04em'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--amber-dim)'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  FLAG FOR REVIEW
                </button>

                <button
                  className="action-btn mono"
                  onClick={() => handleSuspend(selected)}
                  style={{
                    width: '100%', height: '38px', borderRadius: 0,
                    backgroundColor: 'var(--red-threat)',
                    border: '1px solid var(--red-threat)',
                    color: '#FFFFFF',
                    fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.04em'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#C81E1E'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--red-threat)'}
                >
                  SUSPEND IMMEDIATELY
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
