import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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
  if (level === 'CRITICAL') return 'var(--status-red)';
  if (level === 'HIGH')     return 'var(--status-orange)';
  if (level === 'MEDIUM')   return 'var(--status-amber)';
  return 'var(--status-green)';
};

const getRiskBg = (level) => {
  if (level === 'CRITICAL') return 'var(--status-red-bg)';
  if (level === 'HIGH')     return 'var(--status-orange-bg)';
  if (level === 'MEDIUM')   return 'var(--status-amber-bg)';
  return 'var(--status-green-bg)';
};

const getRiskBorder = (level) => {
  if (level === 'CRITICAL') return 'var(--status-red-border)';
  if (level === 'HIGH')     return 'var(--status-orange-border)';
  if (level === 'MEDIUM')   return 'var(--status-amber-border)';
  return 'var(--status-green-border)';
};

const getDeptColor = (dept) => {
  const map = { 
    Loans: 'var(--status-amber)', 
    IT: 'var(--status-blue)', 
    Operations: 'var(--text-secondary)', 
    Retail: 'var(--accent)', 
    Compliance: 'var(--status-green)' 
  };
  return map[dept] || 'var(--text-tertiary)';
};

const getDeptBg = (dept) => {
  const map = {
    Loans: 'var(--status-amber-bg)',
    IT: 'var(--status-blue-bg)',
    Operations: 'var(--bg-card-alt)',
    Retail: 'var(--accent-dim)',
    Compliance: 'var(--status-green-bg)'
  };
  return map[dept] || 'var(--bg-card-alt)';
};

const getDeptBorder = (dept) => {
  const map = {
    Loans: 'var(--status-amber-border)',
    IT: 'var(--status-blue-border)',
    Operations: 'var(--border)',
    Retail: 'var(--accent-border)',
    Compliance: 'var(--status-green-border)'
  };
  return map[dept] || 'var(--border)';
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

  const handleSelectEmployee = async (emp) => {
    if (selected?.id === emp.id) {
      setSelected(null);
      return;
    }
    setSelected(emp);
    
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
        const updatedEmp = {
          ...emp,
          risk: data.risk_score,
          level: data.risk_level,
          analysis: data.narrative,
          confidence: data.confidence,
          source: data.source
        };
        setEmployees(prev => prev.map(e => e.id === emp.id ? updatedEmp : e));
        setSelected(prev => prev && prev.id === emp.id ? updatedEmp : prev);
      }
    } catch (e) {
      console.log("Error loading live employee analysis:", e);
    }
  };

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
        setEmployees(prev => prev.map(e => {
          if (e.id === emp.id) {
            return {
              ...e,
              risk: data.risk_score,
              level: data.risk_level,
              analysis: data.narrative,
              confidence: data.confidence,
              source: data.source
            };
          }
          return e;
        }));
        setSelected(prev => {
          if (prev && prev.id === emp.id) {
            return {
              ...prev,
              risk: data.risk_score,
              level: data.risk_level,
              analysis: data.narrative,
              confidence: data.confidence,
              source: data.source
            };
          }
          return prev;
        });
      }
    } catch (e) {
      console.log("Backend unreachable during suspension analysis. Performing offline override.");
    }
    handleAction(emp.id, 'SUSPENDED');
  };

  return (
    <>
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
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .emp-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-hover);
          border-color: var(--accent-light) !important;
        }
        .blink-im {
          animation: blink-cursor-im 0.9s step-start infinite;
          color: var(--accent);
        }
      `}</style>

      <div style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: 'var(--bg-page)',
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
              backgroundColor: 'var(--status-red-bg)',
              borderBottom: '1px solid var(--status-red-border)',
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexShrink: 0,
              zIndex: 10
            }}>
              <span className="pulse-red-dot" />
              <span className="font-mono" style={{ fontSize: '12px', color: 'var(--status-red)', fontWeight: '700' }}>
                WARNING: {criticalEmployees.length} employee{criticalEmployees.length > 1 ? 's' : ''} flagged with elevated risk scores
                &nbsp;—&nbsp;
                {criticalEmployees.map(e => e.id).join(', ')}
              </span>
            </div>
          )}

          {/* PAGE HEADER */}
          <header className="glass" style={{
            height: 'var(--header-height)', position: 'sticky', top: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 28px', flexShrink: 0,
            boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Link to="/" style={{
                display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)',
                textDecoration: 'none', fontSize: '13px', fontWeight: '600',
                padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-strong)',
                background: 'var(--bg-card-alt)', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                Dashboard
              </Link>
              <span style={{ color: 'var(--border-strong)' }}>/</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
                Insider Threat Monitor
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 12px', borderRadius: '99px',
                background: isDemoMode ? 'var(--status-amber-bg)' : 'var(--status-green-bg)',
                border: `1px solid ${isDemoMode ? 'var(--status-amber-border)' : 'var(--status-green-border)'}`,
              }}>
                <span className={isDemoMode ? '' : 'pulse-green-dot'} style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: isDemoMode ? 'var(--status-amber)' : 'var(--status-green)',
                  display: 'inline-block',
                }} />
                <span style={{
                  fontSize: '11px', fontWeight: '600',
                  color: isDemoMode ? 'var(--status-amber)' : 'var(--status-green)',
                }}>
                  {isDemoMode ? 'Demo Mode' : 'API Connected'}
                </span>
              </div>
              <img src="/bob-logo.png" alt="Bank of Baroda" style={{ height: '28px', objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none'; }} />
            </div>
          </header>

          {/* SUB-HEADER METRICS */}
          <div style={{
            padding: '24px 28px 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif", margin: 0, letterSpacing: '-0.01em' }}>
                Insider Threat Monitor
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0', fontWeight: '500' }}>
                Real-time tracking of internal employee access anomalies and data exfiltration pathways.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-clear" style={{ padding: '6px 14px', fontSize: '11px' }}>
                {employees.length} Monitored
              </span>
              <span className="badge badge-block" style={{ padding: '6px 14px', fontSize: '11px' }}>
                {criticalEmployees.length} Critical
              </span>
            </div>
          </div>

          {/* EMPLOYEE GRID */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 28px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '20px'
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
                    className="emp-card card"
                    onClick={() => handleSelectEmployee(emp)}
                    style={{
                      backgroundColor: isSelected ? 'var(--bg-card-alt)' : 'var(--bg-card)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      position: 'relative',
                    }}
                  >
                    {/* Status badge */}
                    {status !== 'ACTIVE' && (
                      <div style={{
                        position: 'absolute', top: '16px', right: '16px',
                        padding: '4px 10px',
                        borderRadius: '99px',
                        backgroundColor:
                          status === 'SUSPENDED' ? 'var(--status-red-bg)' :
                          status === 'FLAGGED'   ? 'var(--status-amber-bg)' : 'var(--status-green-bg)',
                        border: `1px solid ${
                          status === 'SUSPENDED' ? 'var(--status-red-border)' :
                          status === 'FLAGGED'   ? 'var(--status-amber-border)' : 'var(--status-green-border)'
                        }`
                      }}>
                        <span className="font-mono" style={{
                          fontSize: '10px', fontWeight: '700',
                          color:
                            status === 'SUSPENDED' ? 'var(--status-red)' :
                            status === 'FLAGGED'   ? 'var(--status-amber)' : 'var(--status-green)'
                        }}>
                          {status}
                        </span>
                      </div>
                    )}

                    {/* Top line: Avatar + Name + Dept */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FF6A13 0%, #E05206 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: '700', color: '#fff',
                        boxShadow: 'var(--shadow-sm)',
                      }}>
                        {emp.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
                          {emp.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: "'Inter', sans-serif", fontWeight: '500' }}>
                            {emp.id}
                          </span>
                          <span style={{
                            fontSize: '9px', fontWeight: '700', textTransform: 'uppercase',
                            color: getDeptColor(emp.department),
                            border: `1px solid ${getDeptBorder(emp.department)}`,
                            backgroundColor: getDeptBg(emp.department),
                            padding: '2px 8px', borderRadius: '4px',
                          }}>
                            {emp.department}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Risk progress section */}
                    <div style={{ background: 'var(--bg-card-alt)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>RISK LEVEL</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: getRiskColor(emp.level), fontFamily: "'Space Grotesk', sans-serif" }}>
                          {emp.risk}/100 · {emp.level}
                        </span>
                      </div>
                      <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${emp.risk}%`, height: '100%',
                          background: `linear-gradient(90deg, ${getRiskColor(emp.level)}dd, ${getRiskColor(emp.level)})`,
                          borderRadius: '99px', transition: 'width 0.8s ease'
                        }} />
                      </div>
                    </div>

                    {/* Detailed metrics logs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '600' }}>RECORDS</span>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: badRecords ? 'var(--status-red)' : 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
                          {emp.records} <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '400' }}>/ {emp.normalRecords}</span>
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '600' }}>LOGIN HOUR</span>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: badOutsideHrs ? 'var(--status-red)' : 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
                          {emp.loginTime}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '600' }}>EXPORT VOLUME</span>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: badExport ? 'var(--status-red)' : 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
                          {emp.dataExported} <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '400' }}>MB</span>
                        </span>
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
            width: '420px',
            height: '100%',
            backgroundColor: 'var(--bg-card)',
            borderLeft: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            animation: 'slide-in-right 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 200
          }}>
            {/* Panel header */}
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-card-alt)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <div>
                <span className="font-mono" style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: '700' }}>
                  {selected.id}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '10px', fontWeight: '600' }}>
                  {selected.department} Department
                </span>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--text-tertiary)', width: '30px', height: '30px',
                  cursor: 'pointer', fontSize: '14px', borderRadius: '6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-page)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
              >
                ✕
              </button>
            </div>

            {/* Panel body */}
            <div style={{ flex: 1, padding: '22px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Name & Risk */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF6A13 0%, #E05206 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', fontWeight: '700', color: '#fff',
                }}>
                  {selected.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-display" style={{
                    fontSize: '18px', fontWeight: '700',
                    color: 'var(--text-primary)', lineHeight: 1.2
                  }}>
                    {selected.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: getRiskColor(selected.level), fontFamily: "'Space Grotesk', sans-serif" }}>
                      {selected.risk}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '500' }}>/ 100</span>
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
              </div>

              {/* Full stats */}
              <div style={{
                backgroundColor: 'var(--bg-card-alt)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {[
                  { label: 'Records Accessed', value: `${selected.records}`, normal: `baseline limit: ${selected.normalRecords}`, bad: isHighRecords(selected) },
                  { label: 'Login Hour', value: selected.loginTime, normal: `approved shifts: ${selected.normalHours.start}AM–${selected.normalHours.end >= 12 ? selected.normalHours.end - 12 + 'PM' : selected.normalHours.end + 'AM'}`, bad: isOutsideHours(selected) },
                  { label: 'Data Exported', value: `${selected.dataExported} MB`, normal: 'allowance: 10 MB', bad: isHighExport(selected) },
                ].map(({ label, value, normal, bad }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>{label}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: bad ? 'var(--status-red)' : 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
                        {value}
                      </span>
                      <br />
                      <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '500' }}>{normal}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gemini Analysis terminal */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>AI Threat Assessment</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '500' }}>Powered by Gemini 2.5 Flash</div>
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid rgba(255,106,19,0.15)',
                  borderRadius: '10px',
                  padding: '16px'
                }}>
                  <pre style={{
                    margin: 0, fontSize: '12.5px',
                    color: '#E2E8F0', lineHeight: '1.9',
                    whiteSpace: 'pre-wrap',
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
                  }}>
                    <span style={{ color: '#F1F5F9' }}>{selected.analysis}</span>
                    <span className="blink-im">█</span>
                  </pre>
                  <div style={{
                    fontSize: '10px', color: 'var(--text-on-dark-dim)',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    paddingTop: '8px', marginTop: '12px'
                  }}>
                    — Source: {selected.source === 'gemini-2.0-flash' ? 'Gemini 2.5 Flash' : 'Rule-Based Engine'} · Confidence: {selected.confidence || '0.91'} · Model: contextguard-insider-v1
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', paddingTop: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Analyst Response Actions
                </div>

                <button
                  className="btn btn-ghost"
                  onClick={() => handleAction(selected.id, 'CLEARED')}
                  style={{ justifyContent: 'center', height: '38px', fontSize: '12px', fontWeight: '600' }}
                >
                  Clear — False Positive
                </button>

                <button
                  className="btn btn-primary"
                  onClick={() => handleAction(selected.id, 'FLAGGED')}
                  style={{ justifyContent: 'center', height: '38px', fontSize: '12px', fontWeight: '600', background: 'linear-gradient(135deg, #FF6A13 0%, #EA580C 100%)', boxShadow: '0 4px 12px rgba(255,106,19,0.2)' }}
                >
                  Flag for Investigation
                </button>

                <button
                  className="btn btn-danger"
                  onClick={() => handleSuspend(selected)}
                  style={{ justifyContent: 'center', height: '38px', fontSize: '12px', fontWeight: '600' }}
                >
                  Suspend User Session
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
