import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api/v1';

const fallbackEmployees = [
  { emp_id: "EMP-001", name: "Aarav Patel", department: "Retail", normal_records_per_day: 24, access_level: "L3" },
  { emp_id: "EMP-002", name: "Ananya Rao", department: "IT", normal_records_per_day: 35, access_level: "L2" },
  { emp_id: "EMP-003", name: "Vihaan Sharma", department: "Loans", normal_records_per_day: 15, access_level: "L1" },
  { emp_id: "EMP-004", name: "Diya Joshi", department: "Operations", normal_records_per_day: 40, access_level: "L2" },
  { emp_id: "EMP-005", name: "Aditya Iyer", department: "Compliance", normal_records_per_day: 18, access_level: "L3" },
  { emp_id: "EMP-006", name: "Ishaan Gupta", department: "IT", normal_records_per_day: 30, access_level: "L1" },
  { emp_id: "EMP-007", name: "Sai Reddy", department: "Retail", normal_records_per_day: 22, access_level: "L2" },
  { emp_id: "EMP-008", name: "Kavya Pillai", department: "Compliance", normal_records_per_day: 28, access_level: "L3" },
  { emp_id: "EMP-009", name: "Arjun Nair", department: "Loans", normal_records_per_day: 12, access_level: "L1" },
  { emp_id: "EMP-010", name: "Vivaan Choudhury", department: "Operations", normal_records_per_day: 45, access_level: "L2" }
];

export default function InsiderMonitor() {
  const [employees, setEmployees] = useState(fallbackEmployees);
  const [selectedEmp, setSelectedEmp] = useState(fallbackEmployees[0]);

  // Simulation Parameters
  const [recordsAccessed, setRecordsAccessed] = useState(selectedEmp.normal_records_per_day * 2);
  const [loginHour, setLoginHour] = useState(2); // default 2 AM
  const [dataExported, setDataExported] = useState(45.2);

  // Results
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch employees on load
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${API_BASE}/employees`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setEmployees(data);
            setSelectedEmp(data[0]);
            setRecordsAccessed(data[0].normal_records_per_day * 2);
          }
        }
      } catch (e) {
        console.log("Backend offline, utilizing cached fallback employee details.");
      }
    };
    fetchEmployees();
  }, []);

  // Update records accessed when selected employee changes
  const handleSelectEmployee = (emp) => {
    setSelectedEmp(emp);
    setRecordsAccessed(emp.normal_records_per_day * 2);
  };

  // Run Rule Engine Analysis
  const handleRunAnalysis = async () => {
    setLoading(true);
    try {
      const payload = {
        emp_id: selectedEmp.emp_id,
        records_accessed_today: parseInt(recordsAccessed),
        login_hour: parseInt(loginHour),
        data_exported_mb: parseFloat(dataExported)
      };

      const res = await fetch(`${API_BASE}/employee/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data);
      } else {
        throw new Error();
      }
    } catch (e) {
      // Local fallback calculation if backend is offline
      const normal = selectedEmp.normal_records_per_day;
      const ratio = recordsAccessed / normal;
      
      let recordsPoints = 0;
      if (ratio <= 1.0) recordsPoints = 0;
      else if (ratio <= 1.5) recordsPoints = 15;
      else if (ratio <= 2.5) recordsPoints = 30;
      else recordsPoints = 45;

      let loginPoints = 0;
      if (loginHour >= 8 && loginHour <= 18) loginPoints = 0;
      else if ((loginHour > 18 && loginHour <= 22) || (loginHour >= 6 && loginHour < 8)) loginPoints = 15;
      else loginPoints = 30;

      let exportPoints = 0;
      if (dataExported <= 10.0) exportPoints = 0;
      else if (dataExported <= 50.0) exportPoints = 15;
      else exportPoints = 25;

      const riskScore = Math.min(100, recordsPoints + loginPoints + exportPoints);
      
      let riskLevel = "LOW";
      let action = "NO_ACTION";
      if (riskScore > 35 && riskScore <= 70) {
        riskLevel = "MEDIUM";
        action = "MONITOR";
      } else if (riskScore > 70) {
        riskLevel = "HIGH";
        action = "TEMPORARY_SUSPEND";
      }

      const ratioStr = ratio % 1 !== 0 ? ratio.toFixed(1) : Math.floor(ratio).toString();
      const hourStr = loginHour === 0 ? "12AM" : loginHour === 12 ? "12PM" : loginHour < 12 ? `${loginHour}AM` : `${loginHour-12}PM`;
      const exportStr = dataExported % 1 !== 0 ? dataExported.toFixed(1) : Math.floor(dataExported).toString();

      let narrative = `Employee accessed ${ratioStr}x normal records at ${hourStr}`;
      if (exportPoints > 0) {
        narrative += ` and exported ${exportStr}MB data`;
      }
      if (riskLevel === "HIGH") {
        narrative += " — possible exfiltration";
      } else if (riskLevel === "MEDIUM") {
        narrative += " — suspicious activity";
      }

      setAnalysisResult({
        emp_id: selectedEmp.emp_id,
        risk_score: riskScore,
        risk_level: riskLevel,
        recommended_action: action,
        narrative: narrative
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper colors
  const getSeverityColor = (level) => {
    if (level === 'LOW') return 'var(--clear)';
    if (level === 'MEDIUM') return 'var(--amber)';
    return 'var(--red-threat)';
  };

  const getActionBadgeClass = (action) => {
    if (action === 'NO_ACTION') return 'badge-clear';
    if (action === 'MONITOR') return 'badge-step';
    return 'badge-block';
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-void)',
      overflow: 'hidden'
    }}>
      {/* HEADER */}
      <header style={{
        height: '52px',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/" style={{ color: 'var(--text-dim)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <span className="display" style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
            INSIDER THREAT MONITOR
          </span>
        </div>
        <div className="mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
          WORKSPACE SECURITY PROTOCOL / PRIVILEGED ACCESS ONLY
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: '20px',
        padding: '20px',
        minHeight: 0
      }}>
        {/* LEFT COLUMN: EMPLOYEE DIRECTORY */}
        <div style={{
          width: '50%',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
          <h3 className="mono" style={{
            fontSize: '12px',
            color: 'var(--amber)',
            fontWeight: 'bold',
            letterSpacing: '0.1em',
            margin: '0 0 10px 0',
            flexShrink: 0
          }}>
            EMPLOYEE ACCESS DIRECTORY
          </h3>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-surface)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{
                position: 'sticky',
                top: 0,
                backgroundColor: 'var(--bg-elevated)',
                borderBottom: '1px solid var(--border)',
                zIndex: 10
              }}>
                <tr>
                  <th className="mono" style={{ padding: '12px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold' }}>EMP_ID</th>
                  <th className="mono" style={{ padding: '12px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold' }}>NAME</th>
                  <th className="mono" style={{ padding: '12px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold' }}>DEPT</th>
                  <th className="mono" style={{ padding: '12px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold', textAlign: 'center' }}>BASE ACCESS/DAY</th>
                  <th className="mono" style={{ padding: '12px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold', textAlign: 'right' }}>ACCESS LEVEL</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr
                    key={emp.emp_id}
                    onClick={() => handleSelectEmployee(emp)}
                    style={{
                      backgroundColor: selectedEmp.emp_id === emp.emp_id ? 'var(--amber-dim)' : 'transparent',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      borderLeft: selectedEmp.emp_id === emp.emp_id ? '3px solid var(--amber)' : '3px solid transparent',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseOver={(e) => { if (selectedEmp.emp_id !== emp.emp_id) e.currentTarget.style.backgroundColor = '#0D0F14'; }}
                    onMouseOut={(e) => { if (selectedEmp.emp_id !== emp.emp_id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td className="mono" style={{ padding: '12px', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                      {emp.emp_id}
                    </td>
                    <td className="mono" style={{ padding: '12px', fontSize: '12px', color: 'var(--text-primary)' }}>
                      {emp.name}
                    </td>
                    <td className="mono" style={{ padding: '12px', fontSize: '12px', color: 'var(--text-mono)' }}>
                      {emp.department}
                    </td>
                    <td className="mono" style={{ padding: '12px', fontSize: '12px', color: 'var(--text-mono)', textAlign: 'center' }}>
                      {emp.normal_records_per_day} records
                    </td>
                    <td className="mono" style={{ padding: '12px', fontSize: '12px', color: 'var(--amber)', fontWeight: 'bold', textAlign: 'right' }}>
                      {emp.access_level}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: SIMULATION & ENGINE */}
        <div style={{
          width: '50%',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          minHeight: 0
        }}>
          {/* SANDBOX CONTROLS */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 className="mono" style={{
              fontSize: '12px',
              color: 'var(--amber)',
              fontWeight: 'bold',
              letterSpacing: '0.1em',
              margin: '0 0 10px 0',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '8px'
            }}>
              RISK SIMULATION SANDBOX ({selectedEmp.emp_id} - {selectedEmp.name})
            </h3>

            {/* Parameter 1: Records Accessed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--text-mono)' }}>RECORDS ACCESSED TODAY</span>
                <span className="mono" style={{ fontSize: '12px', color: 'var(--amber)', fontWeight: 'bold' }}>
                  {recordsAccessed} ({(recordsAccessed / selectedEmp.normal_records_per_day).toFixed(1)}x baseline)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={selectedEmp.normal_records_per_day * 4}
                value={recordsAccessed}
                onChange={(e) => setRecordsAccessed(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: 'var(--amber)',
                  background: 'var(--bg-void)',
                  height: '4px',
                  borderRadius: 0,
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Parameter 2: Hour of Access */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--text-mono)' }}>LOGIN HOUR OF ACCESS</span>
                <span className="mono" style={{ fontSize: '12px', color: 'var(--amber)', fontWeight: 'bold' }}>
                  {loginHour === 0 ? "12 AM" : loginHour === 12 ? "12 PM" : loginHour < 12 ? `${loginHour} AM` : `${loginHour-12} PM`} (Hour: {loginHour})
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="23"
                value={loginHour}
                onChange={(e) => setLoginHour(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: 'var(--amber)',
                  background: 'var(--bg-void)',
                  height: '4px',
                  borderRadius: 0,
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Parameter 3: Data Exported */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--text-mono)' }}>DATA EXPORTED (MB)</span>
                <span className="mono" style={{ fontSize: '12px', color: 'var(--amber)', fontWeight: 'bold' }}>
                  {dataExported} MB
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={dataExported}
                onChange={(e) => setDataExported(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: 'var(--amber)',
                  background: 'var(--bg-void)',
                  height: '4px',
                  borderRadius: 0,
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              className="mono"
              style={{
                width: '100%',
                height: '40px',
                backgroundColor: 'var(--amber)',
                border: '1px solid var(--amber)',
                color: 'var(--bg-void)',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                letterSpacing: '0.05em',
                transition: 'background-color 0.2s',
                borderRadius: 0,
                marginTop: '10px'
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--amber-light)'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--amber)'; }}
            >
              {loading ? "PROCESSING ANOMALY CHECK..." : "RUN SECURITY ANALYSIS ENGINE"}
            </button>
          </div>

          {/* ENGINE RESULTS */}
          <div style={{
            flex: 1,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
          }}>
            <h3 className="mono" style={{
              fontSize: '12px',
              color: 'var(--amber)',
              fontWeight: 'bold',
              letterSpacing: '0.1em',
              margin: '0 0 16px 0',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '8px',
              flexShrink: 0
            }}>
              SECURITY TELEMETRY RESPONSE
            </h3>

            {analysisResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1 }}>
                
                {/* Score and level */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  {/* Circular visual score */}
                  <div style={{
                    width: '72px',
                    height: '72px',
                    border: `3px solid ${getSeverityColor(analysisResult.risk_level)}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span className="mono" style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {analysisResult.risk_score}
                    </span>
                    <span className="mono" style={{ fontSize: '8px', color: 'var(--text-dim)' }}>RISK</span>
                  </div>

                  <div>
                    <div className="mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>DETECTED THREAT LEVEL</div>
                    <div className="mono" style={{ fontSize: '18px', fontWeight: 'bold', color: getSeverityColor(analysisResult.risk_level), marginTop: '4px' }}>
                      {analysisResult.risk_level} LEVEL
                    </div>
                  </div>
                </div>

                {/* Narrative */}
                <div>
                  <div className="mono" style={{ fontSize: '11px', color: 'var(--text-mono)' }}>TELEMETRY SUMMARY</div>
                  <div className="mono" style={{
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-void)',
                    borderLeft: `3px solid ${getSeverityColor(analysisResult.risk_level)}`,
                    padding: '12px',
                    marginTop: '8px',
                    lineHeight: '1.4'
                  }}>
                    {analysisResult.narrative}
                  </div>
                </div>

                {/* Recommended action */}
                <div>
                  <div className="mono" style={{ fontSize: '11px', color: 'var(--text-mono)', marginBottom: '8px' }}>MITIGATION ACTION</div>
                  <span className={`badge ${getActionBadgeClass(analysisResult.recommended_action)}`}>
                    {analysisResult.recommended_action.replace('_', ' ')}
                  </span>
                </div>

              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', color: 'var(--text-dim)' }}>
                <span className="mono" style={{ fontSize: '12px' }}>
                  AWAITING SANDBOX EVENT TELEMETRY.<br />SELECT EMPLOYEE, ADJUST METRICS, AND RUN ANALYSIS.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
