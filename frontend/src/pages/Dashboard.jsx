import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api/v1';

const CITIES = ["Mumbai", "Delhi", "Chennai", "Bangalore", "Jaipur", "Kolkata", "Hyderabad", "Pune"];
const SIGNALS = [
  "location_risk_score",
  "device_risk_score",
  "time_risk_score",
  "behavioral_risk_score",
  "transaction_risk_score",
  "recovery_risk_score"
];

// Helper to generate a realistic local fake event
const generateFakeEvent = (forcedDecision = null) => {
  const decisions = ['CLEAR', 'STEP_UP', 'HUMAN_REVIEW', 'BLOCK'];
  const decision = forcedDecision || decisions[Math.random() < 0.6 ? 0 : Math.random() < 0.62 ? 1 : Math.random() < 0.66 ? 2 : 3];
  
  let score;
  if (decision === 'CLEAR') score = Math.floor(Math.random() * 31);
  else if (decision === 'STEP_UP') score = Math.floor(Math.random() * 30) + 31;
  else if (decision === 'HUMAN_REVIEW') score = Math.floor(Math.random() * 25) + 61;
  else score = Math.floor(Math.random() * 15) + 86;

  const top_signal = SIGNALS[Math.floor(Math.random() * SIGNALS.length)];
  const userId = `USR-${Math.floor(Math.random() * 8765) + 1234}`;
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  const date = new Date();
  const timeStr = date.toISOString().replace('T', ' ').substring(0, 19);

  return {
    event_id: `EVT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    user_id: userId,
    city: city,
    final_risk_score: score,
    decision: decision,
    top_signal: top_signal,
    timestamp: timeStr,
    isNew: true // helper for animation trigger
  };
};

// Generate 50 initial fake events
const initialFakeEvents = Array.from({ length: 50 }, () => {
  const evt = generateFakeEvent();
  evt.isNew = false;
  return evt;
});

export default function Dashboard() {
  const [events, setEvents] = useState(initialFakeEvents);
  const [stats, setStats] = useState({
    total_events_today: 147,
    high_risk_blocked: 12,
    human_review_pending: 8,
    avg_trust_score: 31.4,
    clear_percentage: 62
  });
  const [signalScores, setSignalScores] = useState({
    behavioral: 65,
    location: 35,
    device: 55,
    time: 20,
    transaction: 10,
    recovery: 50
  });

  const [systemTime, setSystemTime] = useState(new Date().toTimeString().split(' ')[0]);

  // Live time ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date().toTimeString().split(' ')[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch backend data if running
  const fetchData = async () => {
    try {
      // Fetch live feed
      const feedRes = await fetch(`${API_BASE}/live-feed`);
      if (feedRes.ok) {
        const feedData = await feedRes.json();
        if (feedData && feedData.length > 0) {
          setEvents(feedData);
        }
      }
      
      // Fetch stats
      const statsRes = await fetch(`${API_BASE}/dashboard/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (e) {
      console.log("Backend API not reachable. Operating with fallback simulation data.");
    }
  };

  useEffect(() => {
    fetchData();
    // Poll backend every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Auto-simulate a new threat event every 4 seconds
  useEffect(() => {
    const simulationTimer = setInterval(() => {
      const newEvt = generateFakeEvent();
      setEvents(prev => [newEvt, ...prev.slice(0, 49)]);
      
      // Update stats and signal analysis dynamically
      setStats(prev => ({
        ...prev,
        total_events_today: prev.total_events_today + 1,
        high_risk_blocked: newEvt.decision === 'BLOCK' ? prev.high_risk_blocked + 1 : prev.high_risk_blocked,
        human_review_pending: newEvt.decision === 'HUMAN_REVIEW' ? prev.human_review_pending + 1 : prev.human_review_pending,
      }));

      // Adjust signal scores slightly
      const signalKey = newEvt.top_signal.replace('_risk_score', '');
      setSignalScores(prev => ({
        ...prev,
        [signalKey]: Math.min(100, Math.max(5, prev[signalKey] + (newEvt.final_risk_score > 50 ? 5 : -5)))
      }));

    }, 4000);

    return () => clearInterval(simulationTimer);
  }, []);

  // Simulator Triggers
  const handleSimulate = async (type) => {
    let payload;
    if (type === 'NORMAL') {
      payload = {
        user_id: `USR-${Math.floor(Math.random() * 8765) + 1234}`,
        ip_address: "49.23.44.12",
        city: CITIES[Math.floor(Math.random() * CITIES.length)],
        login_hour: new Date().getHours(),
        is_new_device: false,
        keystroke_variance_ms: 85.0 + Math.random() * 10,
        last_login_city: "Mumbai",
        is_recovery_attempt: false,
        records_accessed: 5,
        transaction_amount: 1500
      };
    } else if (type === 'ATTACKER') {
      payload = {
        user_id: `USR-${Math.floor(Math.random() * 8765) + 1234}`,
        ip_address: "203.45.112.9", // foreign IP
        city: "Pune",
        login_hour: 2, // night hours
        is_new_device: true,
        keystroke_variance_ms: 280.0,
        last_login_city: "Kolkata",
        is_recovery_attempt: true,
        records_accessed: 12,
        transaction_amount: 85000 // high amount
      };
    } else { // INSIDER
      payload = {
        user_id: `USR-${Math.floor(Math.random() * 8765) + 1234}`,
        ip_address: "117.20.12.3",
        city: "Mumbai",
        login_hour: 4, // night
        is_new_device: true,
        keystroke_variance_ms: 150.0,
        last_login_city: "Mumbai",
        is_recovery_attempt: true,
        records_accessed: 120, // abnormal records
        transaction_amount: 45000
      };
    }

    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const analyzed = await res.json();
        // Insert backend analyzed event
        const backendEvt = {
          event_id: analyzed.event_id,
          user_id: analyzed.user_id,
          city: payload.city,
          final_risk_score: analyzed.final_risk_score,
          decision: analyzed.decision,
          top_signal: analyzed.decision === 'CLEAR' ? 'keystroke_variance_ms' : 'location_risk_score',
          timestamp: analyzed.timestamp.replace('T', ' ').substring(0, 19),
          isNew: true
        };
        setEvents(prev => [backendEvt, ...prev.slice(0, 49)]);
        fetchData(); // reload stats
      } else {
        throw new Error();
      }
    } catch (e) {
      // Fallback local simulation if backend fails
      const forcedDecision = type === 'NORMAL' ? 'CLEAR' : type === 'ATTACKER' ? 'BLOCK' : 'HUMAN_REVIEW';
      const localEvt = generateFakeEvent(forcedDecision);
      setEvents(prev => [localEvt, ...prev.slice(0, 49)]);
      
      setStats(prev => ({
        ...prev,
        total_events_today: prev.total_events_today + 1,
        high_risk_blocked: localEvt.decision === 'BLOCK' ? prev.high_risk_blocked + 1 : prev.high_risk_blocked,
        human_review_pending: localEvt.decision === 'HUMAN_REVIEW' ? prev.human_review_pending + 1 : prev.human_review_pending,
      }));
    }
  };

  // Helper for decision border color
  const getDecisionBorder = (decision) => {
    switch (decision) {
      case 'CLEAR': return '3px solid var(--clear)';
      case 'STEP_UP': return '3px solid var(--amber)';
      case 'HUMAN_REVIEW': return '3px solid var(--orange-mid)';
      case 'BLOCK': return '3px solid var(--red-threat)';
      default: return '3px solid var(--border)';
    }
  };

  // Helper for score color
  const getScoreColor = (score) => {
    if (score <= 30) return 'var(--clear)';
    if (score <= 60) return 'var(--amber)';
    if (score <= 85) return 'var(--orange-mid)';
    return 'var(--red-threat)';
  };

  // Helper for trust score color
  const getTrustScoreColor = (score) => {
    if (score < 40) return 'var(--clear)';
    if (score <= 70) return 'var(--amber)';
    return 'var(--red-threat)';
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-void)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      
      {/* 1. TOP BAR */}
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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="pulse-amber-dot"></span>
          <span className="display" style={{
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--amber)',
            letterSpacing: '0.05em'
          }}>
            CONTEXTGUARD
          </span>
        </div>
        
        <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px' }}>
          <span style={{ color: 'var(--clear)', letterSpacing: '0.1em' }}>● SYSTEM OPERATIONAL</span>
          <span style={{ color: 'var(--text-mono)' }}>|</span>
          <span style={{ color: 'var(--text-primary)', letterSpacing: '0.05em' }}>{systemTime}</span>
        </div>
      </header>

      {/* 2. HERO METRICS */}
      <section style={{
        display: 'flex',
        gap: '20px',
        padding: '20px',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        {/* Metric 1 */}
        <div style={{
          flex: 1,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          padding: '16px 20px',
          borderRadius: 0
        }}>
          <div className="mono" style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--amber)', lineHeight: '1.1' }}>
            {stats.total_events_today}
          </div>
          <div className="mono" style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px', letterSpacing: '0.05em' }}>
            EVENTS TODAY
          </div>
        </div>

        {/* Metric 2 */}
        <div style={{
          flex: 1,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          padding: '16px 20px',
          borderRadius: 0
        }}>
          <div className="mono" style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--red-threat)', lineHeight: '1.1' }}>
            {stats.high_risk_blocked}
          </div>
          <div className="mono" style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px', letterSpacing: '0.05em' }}>
            HIGH RISK BLOCKED
          </div>
        </div>

        {/* Metric 3 */}
        <div style={{
          flex: 1,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          padding: '16px 20px',
          borderRadius: 0
        }}>
          <div className="mono" style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--orange-mid)', lineHeight: '1.1' }}>
            {stats.human_review_pending}
          </div>
          <div className="mono" style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px', letterSpacing: '0.05em' }}>
            UNDER REVIEW
          </div>
        </div>

        {/* Metric 4 */}
        <div style={{
          flex: 1,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          padding: '16px 20px',
          borderRadius: 0
        }}>
          <div className="mono" style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: getTrustScoreColor(stats.avg_trust_score),
            lineHeight: '1.1'
          }}>
            {stats.avg_trust_score}
          </div>
          <div className="mono" style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px', letterSpacing: '0.05em' }}>
            AVG TRUST SCORE
          </div>
        </div>
      </section>

      {/* 3. MAIN CONTENT AREA */}
      <section style={{
        flex: 1,
        display: 'flex',
        gap: '20px',
        padding: '0 20px 20px 20px',
        minHeight: 0
      }}>
        {/* LEFT COLUMN: LIVE THREAT STREAM */}
        <div style={{
          width: '65%',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="pulse-red-dot"></span>
              <span className="mono" style={{ fontSize: '12px', color: 'var(--red-threat)', fontWeight: 'bold', marginRight: '10px' }}>LIVE</span>
              <span className="mono" style={{ fontSize: '12px', color: 'var(--amber)', fontWeight: 'bold', letterSpacing: '0.1em' }}>
                THREAT STREAM
              </span>
            </div>
            <div style={{ width: '100px', height: '1px', backgroundColor: 'var(--border-amber)', marginLeft: '12px', flex: 1 }}></div>
          </div>

          {/* Table Container */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-surface)'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left'
            }}>
              <thead style={{
                position: 'sticky',
                top: 0,
                backgroundColor: 'var(--bg-elevated)',
                borderBottom: '1px solid var(--border)',
                zIndex: 10
              }}>
                <tr>
                  <th className="mono" style={{ padding: '12px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold' }}>EVENT_ID</th>
                  <th className="mono" style={{ padding: '12px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold' }}>USER</th>
                  <th className="mono" style={{ padding: '12px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold' }}>CITY</th>
                  <th className="mono" style={{ padding: '12px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold', textAlign: 'center' }}>SCORE</th>
                  <th className="mono" style={{ padding: '12px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold' }}>DECISION</th>
                  <th className="mono" style={{ padding: '12px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold' }}>SIGNAL</th>
                  <th className="mono" style={{ padding: '12px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold', textAlign: 'right' }}>TIME</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt, idx) => (
                  <tr 
                    key={evt.event_id + idx}
                    className={evt.isNew ? 'flash-row' : ''}
                    style={{
                      backgroundColor: idx % 2 === 0 ? '#080A0E' : '#0D0F14',
                      borderBottom: '1px solid var(--border)',
                      borderLeft: getDecisionBorder(evt.decision),
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <td className="mono" style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-primary)' }}>
                      {evt.event_id}
                    </td>
                    <td className="mono" style={{ padding: '10px 12px', fontSize: '12px' }}>
                      <Link to={`/user/${evt.user_id}`} style={{ color: 'var(--amber)', textDecoration: 'none', fontWeight: '500' }}>
                        {evt.user_id}
                      </Link>
                    </td>
                    <td className="mono" style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-mono)' }}>
                      {evt.city || 'N/A'}
                    </td>
                    <td className="mono" style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center', color: getScoreColor(evt.final_risk_score) }}>
                      {evt.final_risk_score}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className={`badge ${
                        evt.decision === 'CLEAR' ? 'badge-clear' :
                        evt.decision === 'STEP_UP' ? 'badge-step' :
                        evt.decision === 'HUMAN_REVIEW' ? 'badge-review' : 'badge-block'
                      }`}>
                        {evt.decision}
                      </span>
                    </td>
                    <td className="mono" style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--text-dim)' }}>
                      {evt.top_signal ? evt.top_signal.replace('_risk_score', '').toUpperCase() : 'N/A'}
                    </td>
                    <td className="mono" style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-dim)', textAlign: 'right' }}>
                      {evt.timestamp ? evt.timestamp.split(' ')[1] || evt.timestamp : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: STACKED PANELS */}
        <div style={{
          width: '35%',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          minHeight: 0
        }}>
          {/* PANEL 1: SIGNAL ANALYSIS */}
          <div style={{
            flex: 1,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            padding: '16px 20px',
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
              SIGNAL ANALYSIS
            </h3>

            {/* Progress Bars */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              justifyContent: 'space-between'
            }}>
              {Object.entries(signalScores).map(([name, score]) => (
                <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: '10px', color: 'var(--text-mono)', letterSpacing: '0.05em' }}>
                      {name.toUpperCase()}
                    </span>
                    <span className="mono" style={{ fontSize: '11px', color: 'var(--amber)', fontWeight: 'bold' }}>
                      {score}
                    </span>
                  </div>
                  {/* Progress bar line */}
                  <div style={{
                    height: '6px',
                    backgroundColor: 'var(--bg-void)',
                    border: '1px solid var(--border)',
                    width: '100%',
                    position: 'relative'
                  }}>
                    <div style={{
                      height: '100%',
                      backgroundColor: 'var(--amber)',
                      width: `${score}%`,
                      transition: 'width 0.8s cubic-bezier(0.1, 0.8, 0.2, 1)'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PANEL 2: QUICK ACTIONS */}
          <div style={{
            flex: 1,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            padding: '16px 20px',
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
              QUICK ACTIONS
            </h3>

            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '14px'
            }}>
              <button 
                onClick={() => handleSimulate('NORMAL')}
                className="mono"
                style={{
                  width: '100%',
                  height: '40px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--clear)',
                  color: 'var(--clear)',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s, color 0.2s',
                  borderRadius: 0
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--clear-dim)'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                SIMULATE NORMAL LOGIN
              </button>

              <button 
                onClick={() => handleSimulate('ATTACKER')}
                className="mono"
                style={{
                  width: '100%',
                  height: '40px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--amber)',
                  color: 'var(--amber)',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s, color 0.2s',
                  borderRadius: 0
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--amber-dim)'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                SIMULATE ATTACKER
              </button>

              <button 
                onClick={() => handleSimulate('INSIDER')}
                className="mono"
                style={{
                  width: '100%',
                  height: '40px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--red-threat)',
                  color: 'var(--red-threat)',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s, color 0.2s',
                  borderRadius: 0
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--red-dim)'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                SIMULATE INSIDER THREAT
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BOTTOM BAR */}
      <footer style={{
        height: '36px',
        borderTop: '1px solid var(--border)',
        backgroundColor: '#05070A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0
      }}>
        <span className="mono" style={{ fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.02em' }}>
          ContextGuard v1.0 — Bank of Baroda PSB Hackathon 2026 — Cybersecurity & Fraud Domain
        </span>
        <span className="mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
          © 2026 Team Antigravity
        </span>
      </footer>

    </div>
  );
}
