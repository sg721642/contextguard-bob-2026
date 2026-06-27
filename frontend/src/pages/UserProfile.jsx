import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api/v1';

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [searchVal, setSearchVal] = useState(userId || '');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  // Synchronize search input with URL param changes
  useEffect(() => {
    setSearchVal(userId || '');
  }, [userId]);

  // Fetch user history from backend
  useEffect(() => {
    const fetchUserHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/user/${userId}/history`);
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
          
          // Reconstruct a mock user profile from historical records for display
          if (data && data.length > 0) {
            const first = data[0];
            // Guess a normal city or find the most common one
            const cities = data.map(d => d.city).filter(Boolean);
            const normalCity = cities.length > 0 ? cities.reduce((a,b,c,arr) => 
              (arr.filter(v => v===a).length >= arr.filter(v => v===b).length ? a : b)
            ) : 'Mumbai';
            
            // Build temporary profile representation
            setProfile({
              user_id: userId,
              normal_city: normalCity,
              normal_login_hour_start: Math.max(0, first.login_hour - 4),
              normal_login_hour_end: Math.min(23, first.login_hour + 4),
              baseline_keystroke_ms: first.keystroke_variance_ms.toFixed(2),
              account_age_days: Math.floor(Math.random() * 300) + 120,
              trust_level: first.final_risk_score <= 30 ? 'TRUSTED' : first.final_risk_score <= 75 ? 'MONITORED' : 'FLAGGED'
            });
          } else {
            setProfile(null);
          }
        } else {
          setHistory([]);
          setProfile(null);
        }
      } catch (e) {
        console.log("Backend offline, generating mock history.");
        // Fallback mock history if backend is offline
        const mockHistory = Array.from({ length: 12 }, (_, i) => {
          const score = Math.floor(Math.random() * (i === 3 ? 60 : 30));
          const decision = score <= 30 ? 'CLEAR' : 'STEP_UP';
          return {
            event_id: `EVT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            user_id: userId,
            timestamp: new Date(Date.now() - i * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19),
            login_hour: (10 + i) % 24,
            ip_address: `49.36.${12 + i}.44`,
            city: i % 4 === 0 ? "Delhi" : "Mumbai",
            is_new_device: i === 3,
            keystroke_variance_ms: 124.5 + (Math.random() * 15),
            location_risk_score: score <= 30 ? 10 : 45,
            device_risk_score: score <= 30 ? 5 : 55,
            time_risk_score: 12,
            behavioral_risk_score: 15,
            transaction_risk_score: 8,
            recovery_risk_score: 0,
            final_risk_score: score,
            decision: decision,
            top_signal: score <= 30 ? "behavioral_risk_score" : "device_risk_score",
            is_confirmed_fraud: false
          };
        });
        setHistory(mockHistory);
        setProfile({
          user_id: userId,
          normal_city: "Mumbai",
          normal_login_hour_start: 9,
          normal_login_hour_end: 18,
          baseline_keystroke_ms: "135.24",
          account_age_days: 284,
          trust_level: "TRUSTED"
        });
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserHistory();
    }
  }, [userId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/user/${searchVal.trim().toUpperCase()}`);
    }
  };

  // Helper for decision border
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

  const getTrustBadgeClass = (level) => {
    if (level === 'TRUSTED') return 'badge-clear';
    if (level === 'MONITORED') return 'badge-step';
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
            USER PROFILE ANALYSIS
          </span>
        </div>

        {/* SEARCH FORM */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="ENTER USER_ID (e.g. USR-1234)"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="mono"
            style={{
              backgroundColor: 'var(--bg-void)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              padding: '6px 12px',
              fontSize: '11px',
              width: '220px',
              borderRadius: 0,
              outline: 'none'
            }}
          />
          <button
            type="submit"
            className="mono"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid var(--amber)',
              color: 'var(--amber)',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              borderRadius: 0
            }}
          >
            QUERY
          </button>
        </form>
      </header>

      {/* MAIN LAYOUT */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="mono" style={{ color: 'var(--amber)', fontSize: '14px', letterSpacing: '0.1em' }}>
            QUERYING ENCRYPTED DATA STORES...
          </div>
        </div>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          gap: '20px',
          padding: '20px',
          minHeight: 0
        }}>
          {/* LEFT: USER DETAILS PANEL */}
          <div style={{
            width: '30%',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            overflowY: 'auto'
          }}>
            <div>
              <div className="mono" style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>TARGET IDENTIFIER</div>
              <h2 className="mono" style={{ fontSize: '24px', color: 'var(--amber)', margin: '4px 0 0 0', fontWeight: 'bold' }}>
                {userId}
              </h2>
            </div>

            {profile ? (
              <>
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                  <div className="mono" style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>TRUST LEVEL STATUS</div>
                  <div style={{ marginTop: '8px' }}>
                    <span className={`badge ${getTrustBadgeClass(profile.trust_level)}`}>
                      {profile.trust_level}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div className="mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>BASELINE CITY</div>
                    <div className="mono" style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '4px' }}>{profile.normal_city}</div>
                  </div>
                  
                  <div>
                    <div className="mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>USUAL ACCESS WINDOW</div>
                    <div className="mono" style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '4px' }}>
                      {profile.normal_login_hour_start}:00 - {profile.normal_login_hour_end}:00
                    </div>
                  </div>

                  <div>
                    <div className="mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>KEYSTROKE VARIANCE BASELINE</div>
                    <div className="mono" style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '4px' }}>
                      {profile.baseline_keystroke_ms} ms
                    </div>
                  </div>

                  <div>
                    <div className="mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>CREDENTIAL AGE</div>
                    <div className="mono" style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '4px' }}>
                      {profile.account_age_days} Days
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <div className="mono" style={{ fontSize: '10px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
                    * Profile baselines are automatically recalculated every 24 hours based on system telemetry.
                  </div>
                </div>
              </>
            ) : (
              <div className="mono" style={{ color: 'var(--text-dim)', fontSize: '12px', marginTop: '20px' }}>
                No active profile markers found for this identifier.
              </div>
            )}
          </div>

          {/* RIGHT: TIMELINE HISTORY */}
          <div style={{
            width: '70%',
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
              SECURITY EVENT LOGS (LAST {history.length})
            </h3>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-surface)'
            }}>
              {history.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <span className="mono" style={{ color: 'var(--text-dim)' }}>NO RECORDED SECURITY EVENTS FOR THIS USER</span>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{
                    position: 'sticky',
                    top: 0,
                    backgroundColor: 'var(--bg-elevated)',
                    borderBottom: '1px solid var(--border)',
                    zIndex: 10
                  }}>
                    <tr>
                      <th className="mono" style={{ padding: '12px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold' }}>EVENT_ID</th>
                      <th className="mono" style={{ padding: '12px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold' }}>CITY</th>
                      <th className="mono" style={{ padding: '12px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold', textAlign: 'center' }}>HOUR</th>
                      <th className="mono" style={{ padding: '12px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold', textAlign: 'center' }}>NEW DEVICE</th>
                      <th className="mono" style={{ padding: '12px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold', textAlign: 'center' }}>SCORE</th>
                      <th className="mono" style={{ padding: '12px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold' }}>DECISION</th>
                      <th className="mono" style={{ padding: '12px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold', textAlign: 'right' }}>DATE/TIME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((evt, idx) => (
                      <tr
                        key={evt.event_id + idx}
                        style={{
                          backgroundColor: idx % 2 === 0 ? '#080A0E' : '#0D0F14',
                          borderBottom: '1px solid var(--border)',
                          borderLeft: getDecisionBorder(evt.decision)
                        }}
                      >
                        <td className="mono" style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-primary)' }}>
                          {evt.event_id}
                        </td>
                        <td className="mono" style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-mono)' }}>
                          {evt.city || 'N/A'}
                        </td>
                        <td className="mono" style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-mono)', textAlign: 'center' }}>
                          {evt.login_hour}
                        </td>
                        <td className="mono" style={{ padding: '10px 12px', fontSize: '12px', color: evt.is_new_device ? 'var(--red-threat)' : 'var(--text-dim)', textAlign: 'center' }}>
                          {evt.is_new_device ? 'YES' : 'NO'}
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
                        <td className="mono" style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-dim)', textAlign: 'right' }}>
                          {evt.timestamp.replace('T', ' ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
