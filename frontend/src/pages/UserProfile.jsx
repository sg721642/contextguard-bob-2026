import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ReferenceLine
} from 'recharts';

// 30 days of data telling a story: mostly green/amber (0-55) with 2-3 recent red spikes (85-98)
const dnaData = [
  { date: "2026-05-29", score: 12 },
  { date: "2026-05-30", score: 18 },
  { date: "2026-05-31", score: 25 },
  { date: "2026-06-01", score: 14 },
  { date: "2026-06-02", score: 9 },
  { date: "2026-06-03", score: 11 },
  { date: "2026-06-04", score: 32 },
  { date: "2026-06-05", score: 28 },
  { date: "2026-06-06", score: 15 },
  { date: "2026-06-07", score: 19 },
  { date: "2026-06-08", score: 45 },
  { date: "2026-06-09", score: 22 },
  { date: "2026-06-10", score: 16 },
  { date: "2026-06-11", score: 13 },
  { date: "2026-06-12", score: 38 },
  { date: "2026-06-13", score: 24 },
  { date: "2026-06-14", score: 15 },
  { date: "2026-06-15", score: 21 },
  { date: "2026-06-16", score: 30 },
  { date: "2026-06-17", score: 11 },
  { date: "2026-06-18", score: 42 },
  { date: "2026-06-19", score: 29 },
  { date: "2026-06-20", score: 17 },
  { date: "2026-06-21", score: 20 },
  { date: "2026-06-22", score: 35 },
  { date: "2026-06-23", score: 92 }, // Spike
  { date: "2026-06-24", score: 15 },
  { date: "2026-06-25", score: 88 }, // Spike
  { date: "2026-06-26", score: 42 },
  { date: "2026-06-27", score: 95 }  // Spike (today)
];

// 15 event log rows matching the story
const initialEventLogs = [
  { date: "2026-06-27 02:34:17", city: "Jaipur", device: "New Device", score: 95, decision: "BLOCK", action: "ACCOUNT_FROZEN" },
  { date: "2026-06-26 14:12:05", city: "Mumbai", device: "Trusted Device", score: 42, decision: "STEP_UP", action: "MFA_PROMPTED" },
  { date: "2026-06-25 23:44:12", city: "Jaipur", device: "New Device", score: 88, decision: "HUMAN_REVIEW", action: "QUEUE_PENDING" },
  { date: "2026-06-24 10:30:19", city: "Mumbai", device: "Trusted Device", score: 15, decision: "CLEAR", action: "BYPASSED" },
  { date: "2026-06-23 03:15:22", city: "Kolkata", device: "New Device", score: 92, decision: "BLOCK", action: "REQUIRE_KYC" },
  { date: "2026-06-22 17:40:11", city: "Mumbai", device: "Trusted Device", score: 35, decision: "CLEAR", action: "BYPASSED" },
  { date: "2026-06-21 09:12:33", city: "Mumbai", device: "Trusted Device", score: 20, decision: "CLEAR", action: "BYPASSED" },
  { date: "2026-06-20 12:45:00", city: "Mumbai", device: "Trusted Device", score: 17, decision: "CLEAR", action: "BYPASSED" },
  { date: "2026-06-19 14:02:18", city: "Mumbai", device: "Trusted Device", score: 29, decision: "CLEAR", action: "BYPASSED" },
  { date: "2026-06-18 20:30:55", city: "Mumbai", device: "Trusted Device", score: 42, decision: "STEP_UP", action: "MFA_PROMPTED" },
  { date: "2026-06-17 11:22:40", city: "Mumbai", device: "Trusted Device", score: 11, decision: "CLEAR", action: "BYPASSED" },
  { date: "2026-06-16 16:55:04", city: "Mumbai", device: "Trusted Device", score: 30, decision: "CLEAR", action: "BYPASSED" },
  { date: "2026-06-15 08:04:12", city: "Mumbai", device: "Trusted Device", score: 21, decision: "CLEAR", action: "BYPASSED" },
  { date: "2026-06-14 13:40:22", city: "Mumbai", device: "Trusted Device", score: 15, decision: "CLEAR", action: "BYPASSED" },
  { date: "2026-06-13 10:11:59", city: "Mumbai", device: "Trusted Device", score: 24, decision: "CLEAR", action: "BYPASSED" }
];

export default function UserProfile({ userId }) {
  const { userId: routeUserId } = useParams();
  const currentUserId = routeUserId || userId || "USR-4721";

  // State to simulate UI reactions
  const [trustLevel, setTrustLevel] = useState("FLAGGED");
  const [logs, setLogs] = useState(initialEventLogs);

  // Masked User ID representation: e.g. "USR-****4721"
  const getMaskedId = (uid) => {
    const rawNum = uid.replace("USR-", "");
    if (rawNum.length > 4) {
      return `USR-****${rawNum.substring(rawNum.length - 4)}`;
    }
    return `USR-****${rawNum}`;
  };

  // Helper colors for DNA boxes
  const getColorForScore = (score) => {
    if (score <= 30) return 'var(--clear)';       // Green
    if (score <= 60) return 'var(--amber)';       // Amber
    if (score <= 85) return 'var(--orange-mid)';   // Orange
    return 'var(--red-threat)';                  // Red
  };

  const getDecisionBorder = (decision) => {
    switch (decision) {
      case 'CLEAR': return '3px solid var(--clear)';
      case 'STEP_UP': return '3px solid var(--amber)';
      case 'HUMAN_REVIEW': return '3px solid var(--orange-mid)';
      case 'BLOCK': return '3px solid var(--red-threat)';
      default: return '3px solid var(--border)';
    }
  };

  const handleAction = (actionType) => {
    if (actionType === 'CLEAR') {
      setTrustLevel("TRUSTED");
      // Add simulated clear action at top of event logs
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newLog = {
        date: nowStr,
        city: "Mumbai",
        device: "Trusted Device",
        score: 10,
        decision: "CLEAR",
        action: "ADMIN_OVERRIDE_CLEAR"
      };
      setLogs(prev => [newLog, ...prev]);
    } else if (actionType === 'KYC') {
      setTrustLevel("MONITORED");
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newLog = {
        date: nowStr,
        city: "Mumbai",
        device: "Trusted Device",
        score: 45,
        decision: "STEP_UP",
        action: "REQUIRED_VIDEO_KYC"
      };
      setLogs(prev => [newLog, ...prev]);
    } else if (actionType === 'FREEZE') {
      setTrustLevel("FLAGGED");
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newLog = {
        date: nowStr,
        city: "Jaipur",
        device: "New Device",
        score: 98,
        decision: "BLOCK",
        action: "FORCE_ACCOUNT_FREEZE"
      };
      setLogs(prev => [newLog, ...prev]);
    }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-void)',
      overflowY: 'auto',
      padding: '24px',
      gap: '24px'
    }}>
      
      {/* Inline styles for hover tooltips & blinking cursors */}
      <style>{`
        .dna-rect-wrapper {
          position: relative;
          display: inline-block;
        }
        .dna-rect-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 6px;
          padding: 6px 10px;
          background-color: var(--bg-surface);
          border: 1px solid var(--border);
          color: var(--text-primary);
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s ease-in-out;
          z-index: 1000;
        }
        .dna-rect-wrapper:hover .dna-rect-tooltip {
          opacity: 1;
        }
        @keyframes blink-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .blinking-cursor {
          animation: blink-cursor 0.8s step-start infinite;
          color: var(--amber);
        }
      `}</style>

      {/* HEADER SECTION */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/" style={{ color: 'var(--text-dim)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--text-mono)' }}>|</span>
          <span className="display" style={{ fontSize: '24px', fontWeight: '700', color: 'var(--amber)' }}>
            {getMaskedId(currentUserId)}
          </span>
        </div>

        <div>
          {trustLevel === "TRUSTED" && (
            <span className="badge" style={{ fontSize: '14px', padding: '6px 16px', backgroundColor: 'var(--clear-dim)', color: 'var(--clear)', border: '1px solid var(--clear)' }}>
              TRUSTED
            </span>
          )}
          {trustLevel === "MONITORED" && (
            <span className="badge" style={{ fontSize: '14px', padding: '6px 16px', backgroundColor: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid var(--amber)' }}>
              MONITORED
            </span>
          )}
          {trustLevel === "FLAGGED" && (
            <span className="badge" style={{ fontSize: '14px', padding: '6px 16px', backgroundColor: 'var(--red-dim)', color: 'var(--red-threat)', border: '1px solid var(--red-threat)' }}>
              FLAGGED
            </span>
          )}
        </div>
      </div>

      {/* ACCOUNT INFO SUBHEADER */}
      <div className="mono" style={{
        fontSize: '11px',
        color: 'var(--text-dim)',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '14px',
        flexShrink: 0
      }}>
        Account age: 847 days &nbsp;|&nbsp; Home city: Mumbai &nbsp;|&nbsp; Normal hours: 9AM–7PM
      </div>

      {/* DNA STRAND SECTION */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flexShrink: 0
      }}>
        <h4 className="mono" style={{ fontSize: '11px', color: 'var(--amber)', margin: 0, fontWeight: 'bold', letterSpacing: '0.05em' }}>
          30-DAY TRUST HISTORY
        </h4>
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          {dnaData.map((item, idx) => (
            <div key={idx} className="dna-rect-wrapper">
              <div style={{
                width: '18px',
                height: '32px',
                backgroundColor: getColorForScore(item.score)
              }} />
              <div className="dna-rect-tooltip">
                {item.date} | Score: {item.score}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TWO COLUMN GRID FOR SCORE TREND CHART AND EVENT LOG TABLE */}
      <div style={{
        display: 'flex',
        gap: '20px',
        width: '100%',
        minHeight: '320px'
      }}>
        {/* LEFT COLUMN: RISK SCORE CHART */}
        <div style={{
          width: '50%',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <h4 className="mono" style={{ fontSize: '11px', color: 'var(--amber)', margin: 0, fontWeight: 'bold', letterSpacing: '0.05em' }}>
            TRUST SCORE TREND
          </h4>
          <div style={{ flex: 1, width: '100%', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dnaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#1E2533" strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => val.substring(8, 10)} 
                  stroke="#5A6478" 
                  style={{ fontSize: '10px', fontFamily: 'JetBrains Mono' }} 
                />
                <YAxis domain={[0, 100]} stroke="#5A6478" style={{ fontSize: '10px', fontFamily: 'JetBrains Mono' }} />
                <ChartTooltip 
                  contentStyle={{
                    backgroundColor: '#0F1117',
                    border: '1px solid var(--amber)',
                    borderRadius: 0,
                    fontFamily: 'JetBrains Mono',
                    fontSize: '11px'
                  }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  labelStyle={{ color: 'var(--amber)' }}
                />
                <ReferenceLine y={60} stroke="var(--red-threat)" strokeDasharray="3 3" label={{ value: 'RISKY', fill: 'var(--red-threat)', fontSize: 9, position: 'top' }} />
                <ReferenceLine y={30} stroke="var(--clear)" strokeDasharray="3 3" label={{ value: 'SAFE', fill: 'var(--clear)', fontSize: 9, position: 'top' }} />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="var(--amber)" 
                  strokeWidth={2}
                  dot={{ r: 2, stroke: 'var(--amber)', strokeWidth: 1, fill: 'var(--bg-surface)' }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT COLUMN: SIGNAL HISTORY TABLE */}
        <div style={{
          width: '50%',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <h4 className="mono" style={{ fontSize: '11px', color: 'var(--amber)', margin: 0, fontWeight: 'bold', letterSpacing: '0.05em' }}>
            EVENT LOG
          </h4>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{
                position: 'sticky',
                top: 0,
                backgroundColor: 'var(--bg-elevated)',
                borderBottom: '1px solid var(--border)',
                zIndex: 5
              }}>
                <tr>
                  <th className="mono" style={{ padding: '8px', fontSize: '10px', color: 'var(--text-dim)', fontWeight: 'bold' }}>DATE</th>
                  <th className="mono" style={{ padding: '8px', fontSize: '10px', color: 'var(--text-dim)', fontWeight: 'bold' }}>CITY</th>
                  <th className="mono" style={{ padding: '8px', fontSize: '10px', color: 'var(--text-dim)', fontWeight: 'bold' }}>DEVICE</th>
                  <th className="mono" style={{ padding: '8px', fontSize: '10px', color: 'var(--text-dim)', fontWeight: 'bold', textAlign: 'center' }}>SCORE</th>
                  <th className="mono" style={{ padding: '8px', fontSize: '10px', color: 'var(--text-dim)', fontWeight: 'bold' }}>DECISION</th>
                  <th className="mono" style={{ padding: '8px', fontSize: '10px', color: 'var(--text-dim)', fontWeight: 'bold', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr
                    key={idx}
                    style={{
                      backgroundColor: idx % 2 === 0 ? '#080A0E' : '#0D0F14',
                      borderBottom: '1px solid var(--border)',
                      borderLeft: getDecisionBorder(log.decision)
                    }}
                  >
                    <td className="mono" style={{ padding: '8px', fontSize: '11px', color: 'var(--text-primary)' }}>
                      {log.date.split(' ')[0]}
                    </td>
                    <td className="mono" style={{ padding: '8px', fontSize: '11px', color: 'var(--text-mono)' }}>
                      {log.city}
                    </td>
                    <td className="mono" style={{ padding: '8px', fontSize: '11px', color: 'var(--text-mono)' }}>
                      {log.device}
                    </td>
                    <td className="mono" style={{ padding: '8px', fontSize: '11px', fontWeight: 'bold', color: getColorForScore(log.score), textAlign: 'center' }}>
                      {log.score}
                    </td>
                    <td className="mono" style={{ padding: '8px', fontSize: '10px', fontWeight: 'bold', color: getColorForScore(log.score) }}>
                      {log.decision}
                    </td>
                    <td className="mono" style={{ padding: '8px', fontSize: '10px', color: 'var(--text-dim)', textAlign: 'right' }}>
                      {log.action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* GEMINI THREAT ASSESSMENT */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--amber)', fontWeight: 'bold', letterSpacing: '0.05em' }}>
            AI THREAT ASSESSMENT
          </span>
          <span className="badge" style={{ fontSize: '8px', padding: '2px 6px', backgroundColor: 'rgba(255,140,0,0.15)', color: 'var(--amber)', border: '1px solid var(--border-amber)' }}>
            GEMINI 2.5 FLASH
          </span>
        </div>

        <div style={{
          backgroundColor: '#050709',
          border: '1px solid rgba(255,140,0,0.3)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <pre className="mono" style={{
            margin: 0,
            fontSize: '12px',
            color: 'var(--amber)',
            lineHeight: '1.8',
            whiteSpace: 'pre-wrap',
            fontFamily: 'JetBrains Mono, monospace'
          }}>
{`ANALYSIS TIMESTAMP: 2026-06-27 02:34:17 IST
SUBJECT: ${currentUserId} | RISK LEVEL: ELEVATED

Behavioral pattern deviation detected over last 72 hours. User accessed account
from Jaipur (847km from registered city Mumbai) using an unrecognized device at
02:34 AM — outside normal activity window of 09:00-19:00. Keystroke biometric
similarity score dropped to 41% against stored baseline. Combined with a ₹85,000
IMPS transfer (8.5x average transaction size), this pattern is consistent with
account takeover post-credential compromise.

RECOMMENDATION: Freeze account, trigger video KYC, notify registered mobile.`}
            <span className="blinking-cursor">█</span>
          </pre>

          <div className="mono" style={{
            fontSize: '10px',
            color: 'var(--text-dim)',
            borderTop: '1px solid var(--border)',
            paddingTop: '8px',
            marginTop: '6px'
          }}>
            — Generated by Gemini 2.5 Flash | Confidence: 0.87 | Model: contextguard-insider-v1
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS ROW */}
      <div style={{
        display: 'flex',
        gap: '16px',
        flexShrink: 0,
        borderTop: '1px solid var(--border)',
        paddingTop: '20px',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => handleAction('CLEAR')}
          className="mono"
          style={{
            minWidth: '160px',
            height: '42px',
            backgroundColor: 'transparent',
            border: '1px solid var(--clear)',
            color: 'var(--clear)',
            fontWeight: 'bold',
            fontSize: '11px',
            cursor: 'pointer',
            letterSpacing: '0.05em',
            borderRadius: 0,
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--clear-dim)'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          CLEAR USER
        </button>

        <button
          onClick={() => handleAction('KYC')}
          className="mono"
          style={{
            minWidth: '160px',
            height: '42px',
            backgroundColor: 'transparent',
            border: '1px solid var(--amber)',
            color: 'var(--amber)',
            fontWeight: 'bold',
            fontSize: '11px',
            cursor: 'pointer',
            letterSpacing: '0.05em',
            borderRadius: 0,
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--amber-dim)'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          REQUIRE KYC
        </button>

        <button
          onClick={() => handleAction('FREEZE')}
          className="mono"
          style={{
            minWidth: '160px',
            height: '42px',
            backgroundColor: 'var(--red-threat)',
            border: '1px solid var(--red-threat)',
            color: '#FFFFFF',
            fontWeight: 'bold',
            fontSize: '11px',
            cursor: 'pointer',
            letterSpacing: '0.05em',
            borderRadius: 0,
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#E02424'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--red-threat)'; }}
        >
          FREEZE ACCOUNT
        </button>
      </div>

    </div>
  );
}
