import React, { useState, useEffect } from 'react';

const ACTIONS = [
  {
    id: 'GRANT_ONE_TIME',
    label: 'Grant One-Time Access',
    description: 'Allow this session only. Next login re-evaluated.',
    color: 'var(--status-green)',
    bg: 'var(--status-green-bg)',
    border: 'var(--status-green-border)',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
  },
  {
    id: 'REQUIRE_KYC',
    label: 'Require Video KYC',
    description: 'User must complete live video verification.',
    color: 'var(--status-amber)',
    bg: 'var(--status-amber-bg)',
    border: 'var(--status-amber-border)',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.845v6.31a1 1 0 0 1-1.447.914L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
  },
  {
    id: 'BLOCK_ALERT',
    label: 'Block & Alert User',
    description: 'Deny access and send SMS alert to registered mobile.',
    color: 'var(--status-red)',
    bg: 'var(--status-red-bg)',
    border: 'var(--status-red-border)',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
  },
  {
    id: 'ESCALATE',
    label: 'Escalate to Security Team',
    description: 'Assign to Tier-2 SOC analyst for manual investigation.',
    color: 'var(--status-orange)',
    bg: 'var(--status-orange-bg)',
    border: 'var(--status-orange-border)',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
  },
];

const DEFAULT_EVENT = {
  eventId: 'EVT-9f2a3b',
  userId: 'USR-4721',
  riskScore: 73,
  signals: [
    { name: 'Device Trust',  points: 28.4, color: 'var(--status-red)',    label: 'Unrecognized device from Jaipur', width: 88 },
    { name: 'Location Risk', points: 22.1, color: 'var(--accent)',         label: '847km from home city',            width: 68 },
    { name: 'Behavioral',    points: 14.7, color: 'var(--status-amber)',   label: 'Keystroke similarity: 41%',       width: 46 },
  ]
};

export default function AlertModal({ isOpen, onClose, onDecision, eventData }) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const evt = eventData ? { ...DEFAULT_EVENT, ...eventData } : DEFAULT_EVENT;

  useEffect(() => {
    if (isOpen) { setSelectedAction(null); setReason(''); setSubmitted(false); }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!selectedAction || !reason.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      onDecision && onDecision({ action: selectedAction, reason: reason.trim(), eventId: evt.eventId });
      onClose();
    }, 600);
  };

  const getScoreColor = (s) => s <= 60 ? 'var(--status-amber)' : s <= 85 ? 'var(--status-orange)' : 'var(--status-red)';
  const getScoreBg = (s) => s <= 60 ? 'var(--status-amber-bg)' : s <= 85 ? 'var(--status-orange-bg)' : 'var(--status-red-bg)';

  return (
    <>
      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.97) translateY(-12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .action-card { transition: all 0.15s ease; }
        .action-card:hover { transform: translateY(-1px); }
      `}</style>

      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}>
        {/* Modal */}
        <div onClick={e => e.stopPropagation()} style={{
          width: '100%', maxWidth: '580px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 60px rgba(15,23,42,0.18), 0 8px 20px rgba(15,23,42,0.10)',
          animation: 'modal-in 0.22s ease-out',
          overflow: 'hidden', maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
        }}>

          {/* ── Header */}
          <div style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--status-red-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '8px',
                background: 'var(--status-red-bg)', border: '1px solid var(--status-red-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--status-red)',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--status-red)', fontFamily: "'Space Grotesk', sans-serif" }}>
                  Identity Review Required
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Manager action needed · Event {evt.eventId}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{
              width: '30px', height: '30px', borderRadius: '8px', border: '1px solid var(--border)',
              background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-alt)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* ── Body (scrollable) */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '22px' }}>

              {/* Risk Score Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{
                  width: '90px', height: '90px', borderRadius: '50%',
                  border: `3px solid ${getScoreColor(evt.riskScore)}`,
                  background: getScoreBg(evt.riskScore),
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: '32px', fontWeight: '800', color: getScoreColor(evt.riskScore), fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>
                    {evt.riskScore}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '500' }}>/100</span>
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '4px' }}>
                    Elevated Risk Score
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Automatic access has been denied.<br/>Manager review and approval required.
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: '#fff' }}>
                      {evt.userId?.replace('USR-','').substring(0,2)}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)' }}>{evt.userId}</span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--border)' }} />

              {/* Contributing Signals */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Contributing Risk Signals
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {evt.signals.map((sig, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{sig.name}</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: sig.color, fontFamily: "'Space Grotesk', sans-serif" }}>+{sig.points} pts</span>
                      </div>
                      <div style={{ height: '7px', background: 'var(--bg-page)', borderRadius: '99px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <div style={{ width: `${sig.width}%`, height: '100%', background: `linear-gradient(90deg, ${sig.color}88, ${sig.color})`, borderRadius: '99px', transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)' }} />
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '3px' }}>{sig.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--border)' }} />

              {/* Context */}
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1, padding: '12px', background: 'var(--bg-card-alt)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>Normal Pattern</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                    Location: Mumbai<br/>Hours: 9AM – 7PM<br/>Device: Trusted
                  </div>
                </div>
                <div style={{ flex: 1, padding: '12px', background: 'var(--bg-card-alt)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>Last 5 Decisions</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {['CLEAR','CLEAR','CLEAR','CLEAR','STEP_UP'].map((d,i) => (
                      <span key={i} className={`badge ${d==='CLEAR'?'badge-clear':d==='STEP_UP'?'badge-step':d==='HUMAN_REVIEW'?'badge-review':'badge-block'}`} style={{ fontSize: '9px', padding: '2px 7px' }}>{d}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--border)' }} />

              {/* Action Selection */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Select Action
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ACTIONS.map(action => {
                    const selected = selectedAction === action.id;
                    return (
                      <div key={action.id} className="action-card" onClick={() => setSelectedAction(action.id)} style={{
                        padding: '12px 14px', borderRadius: '8px', cursor: 'pointer',
                        border: `1px solid ${selected ? action.border : 'var(--border)'}`,
                        background: selected ? action.bg : 'var(--bg-card-alt)',
                        display: 'flex', alignItems: 'center', gap: '12px',
                      }}>
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '50%',
                          border: `2px solid ${selected ? action.color : 'var(--border-strong)'}`,
                          background: selected ? action.color : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, color: '#fff', transition: 'all 0.15s',
                        }}>
                          {selected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: selected ? action.color : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: selected ? action.color : 'var(--text-tertiary)' }}>{action.icon}</span>
                            {action.label}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{action.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reason textarea */}
                <textarea
                  rows={3}
                  placeholder="Enter reason for this decision (required)…"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  style={{
                    width: '100%', marginTop: '12px', padding: '10px 12px',
                    background: 'var(--bg-card-alt)', border: '1px solid var(--border)',
                    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px',
                    fontFamily: "'Inter', sans-serif", resize: 'none', outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
                />
              </div>
            </div>
          </div>

          {/* ── Footer */}
          <div style={{
            padding: '14px 22px', borderTop: '1px solid var(--border)',
            background: 'var(--bg-card-alt)', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexShrink: 0,
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
              Decision logged to audit trail · <span style={{ color: 'var(--accent)', fontWeight: '600' }}>EMP-007</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={onClose} style={{
                padding: '9px 18px', borderRadius: '7px', border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-secondary)', fontSize: '13px',
                fontWeight: '500', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-page)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >Cancel</button>
              <button onClick={handleSubmit} disabled={!selectedAction || !reason.trim() || submitted} style={{
                padding: '9px 22px', borderRadius: '7px', border: 'none',
                background: selectedAction && reason.trim() ? 'var(--accent)' : 'var(--border)',
                color: selectedAction && reason.trim() ? '#fff' : 'var(--text-tertiary)',
                fontSize: '13px', fontWeight: '600', cursor: selectedAction && reason.trim() ? 'pointer' : 'not-allowed',
                fontFamily: "'Inter', sans-serif", transition: 'all 0.18s',
                boxShadow: selectedAction && reason.trim() ? '0 2px 8px rgba(255,106,19,0.30)' : 'none',
              }}
                onMouseEnter={e => { if (selectedAction && reason.trim()) { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
                onMouseLeave={e => { e.currentTarget.style.background = selectedAction && reason.trim() ? 'var(--accent)' : 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {submitted ? 'Submitting…' : 'Submit Decision'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
