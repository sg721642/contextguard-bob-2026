import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip as ChartTooltip, ReferenceLine
} from 'recharts';

const API_BASE = 'https://contextguard-backend.onrender.com/api/v1';

const dnaData = [
  { date: "2026-05-29", score: 12 }, { date: "2026-05-30", score: 18 },
  { date: "2026-05-31", score: 25 }, { date: "2026-06-01", score: 14 },
  { date: "2026-06-02", score: 9  }, { date: "2026-06-03", score: 11 },
  { date: "2026-06-04", score: 32 }, { date: "2026-06-05", score: 28 },
  { date: "2026-06-06", score: 15 }, { date: "2026-06-07", score: 19 },
  { date: "2026-06-08", score: 45 }, { date: "2026-06-09", score: 22 },
  { date: "2026-06-10", score: 16 }, { date: "2026-06-11", score: 13 },
  { date: "2026-06-12", score: 38 }, { date: "2026-06-13", score: 24 },
  { date: "2026-06-14", score: 15 }, { date: "2026-06-15", score: 21 },
  { date: "2026-06-16", score: 30 }, { date: "2026-06-17", score: 11 },
  { date: "2026-06-18", score: 42 }, { date: "2026-06-19", score: 29 },
  { date: "2026-06-20", score: 17 }, { date: "2026-06-21", score: 20 },
  { date: "2026-06-22", score: 35 }, { date: "2026-06-23", score: 92 },
  { date: "2026-06-24", score: 15 }, { date: "2026-06-25", score: 88 },
  { date: "2026-06-26", score: 42 }, { date: "2026-06-27", score: 95 },
];

const initialEventLogs = [
  { date: "2026-06-27 02:34:17", city: "Jaipur",  device: "New Device",     score: 95, decision: "BLOCK",        action: "ACCOUNT_FROZEN"    },
  { date: "2026-06-26 14:12:05", city: "Mumbai",  device: "Trusted Device",  score: 42, decision: "STEP_UP",      action: "MFA_PROMPTED"       },
  { date: "2026-06-25 23:44:12", city: "Jaipur",  device: "New Device",     score: 88, decision: "HUMAN_REVIEW",  action: "QUEUE_PENDING"      },
  { date: "2026-06-24 10:30:19", city: "Mumbai",  device: "Trusted Device",  score: 15, decision: "CLEAR",        action: "BYPASSED"           },
  { date: "2026-06-23 03:15:22", city: "Kolkata", device: "New Device",     score: 92, decision: "BLOCK",        action: "REQUIRE_KYC"        },
  { date: "2026-06-22 17:40:11", city: "Mumbai",  device: "Trusted Device",  score: 35, decision: "CLEAR",        action: "BYPASSED"           },
  { date: "2026-06-21 09:12:33", city: "Mumbai",  device: "Trusted Device",  score: 20, decision: "CLEAR",        action: "BYPASSED"           },
  { date: "2026-06-20 12:45:00", city: "Mumbai",  device: "Trusted Device",  score: 17, decision: "CLEAR",        action: "BYPASSED"           },
  { date: "2026-06-19 14:02:18", city: "Mumbai",  device: "Trusted Device",  score: 29, decision: "CLEAR",        action: "BYPASSED"           },
  { date: "2026-06-18 20:30:55", city: "Mumbai",  device: "Trusted Device",  score: 42, decision: "STEP_UP",      action: "MFA_PROMPTED"       },
  { date: "2026-06-17 11:22:40", city: "Mumbai",  device: "Trusted Device",  score: 11, decision: "CLEAR",        action: "BYPASSED"           },
  { date: "2026-06-16 16:55:04", city: "Mumbai",  device: "Trusted Device",  score: 30, decision: "CLEAR",        action: "BYPASSED"           },
  { date: "2026-06-15 08:04:12", city: "Mumbai",  device: "Trusted Device",  score: 21, decision: "CLEAR",        action: "BYPASSED"           },
  { date: "2026-06-14 13:40:22", city: "Mumbai",  device: "Trusted Device",  score: 15, decision: "CLEAR",        action: "BYPASSED"           },
  { date: "2026-06-13 10:11:59", city: "Mumbai",  device: "Trusted Device",  score: 24, decision: "CLEAR",        action: "BYPASSED"           },
];

const getScoreColor = (s) => {
  if (s <= 30) return 'var(--status-green)';
  if (s <= 60) return 'var(--status-amber)';
  if (s <= 85) return 'var(--status-orange)';
  return 'var(--status-red)';
};

const getDecisionBadgeClass = (d) => {
  if (d === 'CLEAR') return 'badge-clear';
  if (d === 'STEP_UP') return 'badge-step';
  if (d === 'HUMAN_REVIEW') return 'badge-review';
  return 'badge-block';
};

const getTrustConfig = (level) => {
  if (level === 'TRUSTED')   return { cls: 'badge-clear',  label: 'Trusted Account',   color: 'var(--status-green)' };
  if (level === 'MONITORED') return { cls: 'badge-step',   label: 'Under Monitoring', color: 'var(--status-amber)' };
  return                             { cls: 'badge-block', label: 'Flagged / Restricted',   color: 'var(--status-red)' };
};

export default function UserProfile() {
  const { userId: routeUserId } = useParams();
  const currentUserId = routeUserId || 'USR-4721';

  const [trustLevel, setTrustLevel] = useState('FLAGGED');
  const [logs, setLogs] = useState(initialEventLogs);
  const [dynamicDna, setDynamicDna] = useState(dnaData);
  const [confidence, setConfidence] = useState(0.87);
  const [sourceModel, setSourceModel] = useState('Gemini 2.5 Flash');

  const staticNarrative = `ANALYSIS TIMESTAMP: 2026-06-27 02:34:17 IST
SUBJECT: ${currentUserId} | RISK LEVEL: ELEVATED

Behavioral pattern deviation detected over last 72 hours. User accessed account
from Jaipur (847km from registered city Mumbai) using an unrecognized device at
02:34 AM — outside normal activity window of 09:00-19:00. Keystroke biometric
similarity score dropped to 41% against stored baseline. Combined with a ₹85,000
IMPS transfer (8.5x average transaction size), this pattern is consistent with
account takeover post-credential compromise.`;

  const [analysisText, setAnalysisText] = useState(staticNarrative);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const historyRes = await fetch(`${API_BASE}/user/${currentUserId}/history`);
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          if (historyData.length > 0) {
            const mappedLogs = historyData.map(e => ({
              date: e.timestamp.replace('T', ' '),
              city: e.city || 'Unknown',
              device: e.is_new_device ? 'New Device' : 'Trusted Device',
              score: e.final_risk_score,
              decision: e.decision,
              action: e.decision === 'BLOCK' ? 'ACCOUNT_FROZEN' : e.decision === 'HUMAN_REVIEW' ? 'QUEUE_PENDING' : e.decision === 'STEP_UP' ? 'MFA_PROMPTED' : 'BYPASSED'
            }));
            setLogs(mappedLogs);
            const sortedHistory = [...historyData].reverse();
            const mappedDna = sortedHistory.map(e => ({ date: e.timestamp.split('T')[0], score: e.final_risk_score }));
            if (mappedDna.length < 10) {
              setDynamicDna([...dnaData.slice(0, 10 - mappedDna.length), ...mappedDna]);
            } else {
              setDynamicDna(mappedDna);
            }
            const latest = historyData[0];
            if (latest.final_risk_score >= 86) setTrustLevel('FLAGGED');
            else if (latest.final_risk_score >= 61) setTrustLevel('MONITORED');
            else setTrustLevel('TRUSTED');
          }
        }
        const analyzeRes = await fetch(`${API_BASE}/user/${currentUserId}/analyze`);
        if (analyzeRes.ok) {
          const analyzeData = await analyzeRes.json();
          setAnalysisText(analyzeData.narrative);
          setConfidence(analyzeData.confidence);
          setSourceModel(analyzeData.source === 'gemini-2.0-flash' ? 'Gemini 2.5 Flash' : 'Rule-Based Engine');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };
    loadUserData();
  }, [currentUserId]);

  const getMaskedId = (uid) => {
    const rawNum = uid.replace('USR-', '');
    return rawNum.length > 4 ? `USR-****${rawNum.substring(rawNum.length - 4)}` : `USR-****${rawNum}`;
  };

  const handleAction = (actionType) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    if (actionType === 'CLEAR') {
      setTrustLevel('TRUSTED');
      setLogs(prev => [{ date: nowStr, city: 'Mumbai', device: 'Trusted Device', score: 10, decision: 'CLEAR', action: 'ADMIN_OVERRIDE_CLEAR' }, ...prev]);
    } else if (actionType === 'KYC') {
      setTrustLevel('MONITORED');
      setLogs(prev => [{ date: nowStr, city: 'Mumbai', device: 'Trusted Device', score: 45, decision: 'STEP_UP', action: 'REQUIRED_VIDEO_KYC' }, ...prev]);
    } else if (actionType === 'FREEZE') {
      setTrustLevel('FLAGGED');
      setLogs(prev => [{ date: nowStr, city: 'Jaipur', device: 'New Device', score: 98, decision: 'BLOCK', action: 'FORCE_ACCOUNT_FREEZE' }, ...prev]);
    }
  };

  const trustCfg = getTrustConfig(trustLevel);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .dna-cell { position: relative; display: inline-block; }
        .dna-tip {
          position: absolute; bottom: calc(100% + 6px); left: 50%;
          transform: translateX(-50%);
          background: var(--bg-card); border: 1px solid var(--border-strong);
          border-radius: 8px; padding: 6px 10px;
          font-size: 11px; color: var(--text-primary); white-space: nowrap;
          pointer-events: none; opacity: 0; transition: opacity 0.15s;
          box-shadow: var(--shadow-md); z-index: 100;
          font-weight: 600;
        }
        .dna-cell:hover .dna-tip { opacity: 1; }
        @keyframes blink-cursor { 0%,100%{opacity:1} 50%{opacity:0} }
        .blink { animation: blink-cursor 0.9s step-start infinite; color: var(--accent); }
      `}</style>

      {/* ── HEADER ────────────────────────────────────────────── */}
      <header className="glass" style={{
        height: 'var(--header-height)', position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', flexShrink: 0, boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Dashboard
          </Link>
          <span style={{ color: 'var(--border-strong)' }}>/</span>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
            User Profiles
          </span>
        </div>
        {/* Consistent official BoB logo image (24px height) */}
        <img 
          src="/bob-logo.png" 
          alt="Bank of Baroda" 
          style={{ height: '24px', objectFit: 'contain', flexShrink: 0 }} 
        />
      </header>

      {/* ── BODY ──────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* User Title Row Card */}
        <div className="card" style={{
          padding: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', fontWeight: '700', color: '#fff',
              boxShadow: '0 4px 10px rgba(79,70,229,0.2)',
            }}>
              {currentUserId.replace('USR-', '').substring(0, 2)}
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                {getMaskedId(currentUserId)}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: '500' }}>
                Account History: 847 days active · Branch: Mumbai H.O. · Logged shift: 9AM–7PM
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className={`badge ${trustCfg.cls}`} style={{ fontSize: '11px', padding: '6px 14px' }}>
              {trustCfg.label}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => handleAction('CLEAR')} style={{
                padding: '10px 18px', borderRadius: 'var(--radius-sm)', border: 'none',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#fff', fontSize: '12px',
                fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: '0 4px 12px rgba(16,185,129,0.2)',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1.5px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,185,129,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.2)'; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                Clear User
              </button>
              <button onClick={() => handleAction('KYC')} style={{
                padding: '10px 18px', borderRadius: 'var(--radius-sm)', border: 'none',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: '#fff', fontSize: '12px',
                fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(245,158,11,0.2)',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1.5px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(245,158,11,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,158,11,0.2)'; }}
              >Require KYC</button>
              <button onClick={() => handleAction('FREEZE')} style={{
                padding: '10px 18px', borderRadius: 'var(--radius-sm)', border: 'none',
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', color: '#fff', fontSize: '12px',
                fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(239,68,68,0.2)',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1.5px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(239,68,68,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.2)'; }}
              >Freeze Account</button>
            </div>
          </div>
        </div>

        {/* 30-Day Trust History (DNA) */}
        <div className="card" style={{
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>30-Day Trust History</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {[['≤30', 'var(--status-green)', 'Safe'], ['31–60', 'var(--status-amber)', 'Moderate'], ['61–85', 'var(--status-orange)', 'Elevated'], ['>85', 'var(--status-red)', 'Critical']].map(([range, color, label]) => (
                <div key={range} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: color }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {dynamicDna.map((item, idx) => (
              <div key={idx} className="dna-cell">
                <div style={{
                  width: '21px', height: '38px', borderRadius: '4px',
                  background: getScoreColor(item.score),
                  opacity: 0.85,
                  transition: 'all 0.15s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scaleY(1.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'scaleY(1)'; }}
                />
                <div className="dna-tip">{item.date} · Score: {item.score}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart + Event Log Grid */}
        <div style={{ display: 'flex', gap: '24px' }}>
          {/* Chart Card */}
          <div className="card" style={{
            flex: 1, padding: '24px',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 16px', fontFamily: "'Space Grotesk', sans-serif" }}>
              Trust Score Trend — Last 30 Days
            </h3>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dynamicDna} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={v => v.substring(8, 10)}
                    stroke="var(--text-tertiary)" style={{ fontSize: '10px', fontFamily: "'Inter', sans-serif", fontWeight: '500' }} />
                  <YAxis domain={[0, 100]} stroke="var(--text-tertiary)"
                    style={{ fontSize: '10px', fontFamily: "'Inter', sans-serif", fontWeight: '500' }} />
                  <ChartTooltip contentStyle={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
                    borderRadius: '8px', fontSize: '12px', fontFamily: "'Inter', sans-serif",
                    boxShadow: 'var(--shadow-md)',
                  }} itemStyle={{ color: 'var(--text-primary)' }} labelStyle={{ color: 'var(--text-secondary)' }} />
                  <ReferenceLine y={60} stroke="var(--status-red)" strokeDasharray="4 4"
                    label={{ value: 'Risky', fill: 'var(--status-red)', fontSize: 10, position: 'right', fontWeight: '600' }} />
                  <ReferenceLine y={30} stroke="var(--status-green)" strokeDasharray="4 4"
                    label={{ value: 'Safe', fill: 'var(--status-green)', fontSize: 10, position: 'right', fontWeight: '600' }} />
                  <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2.5}
                    dot={{ r: 2, stroke: 'var(--accent)', fill: 'var(--bg-card)' }}
                    activeDot={{ r: 5, stroke: 'var(--accent)', fill: 'var(--bg-card)', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Event Log Table Card */}
          <div className="card-elevated" style={{
            flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>Event Log History</h3>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card-alt)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 5 }}>
                    {['Date', 'City', 'Device Status', 'Score', 'Decision', 'Action'].map((h, i) => (
                      <th key={i} style={{ padding: '10px 16px', textAlign: i >= 3 ? 'center' : 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.12s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500', whiteSpace: 'nowrap' }}>{log.date.split(' ')[0]}</td>
                      <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>{log.city}</td>
                      <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: log.device === 'New Device' ? 'var(--status-red)' : 'var(--status-green)', display: 'inline-block' }} />
                          {log.device}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: getScoreColor(log.score), fontFamily: "'Space Grotesk', sans-serif" }}>{log.score}</span>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <span className={`badge ${getDecisionBadgeClass(log.decision)}`} style={{ fontSize: '10px' }}>{log.decision}</span>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600', textAlign: 'center', whiteSpace: 'nowrap' }}>{log.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* AI Threat Assessment */}
        <div className="card" style={{
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>Cognitive Threat Assessment</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '500' }}>Powered by {sourceModel} · Confidence: {confidence}</div>
            </div>
            <span style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: '99px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', fontSize: '11px', fontWeight: '700', color: 'var(--accent)' }}>
              Gemini AI Engine
            </span>
          </div>
          <div style={{
            background: '#0F172A', border: '1px solid rgba(255,106,19,0.15)',
            borderRadius: '10px', padding: '18px 20px',
          }}>
            <pre style={{
              margin: 0, fontSize: '12.5px', color: '#E2E8F0',
              lineHeight: '1.9', whiteSpace: 'pre-wrap',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}>
              <span style={{ color: '#F1F5F9' }}>{analysisText}</span>
              <span className="blink">█</span>
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
