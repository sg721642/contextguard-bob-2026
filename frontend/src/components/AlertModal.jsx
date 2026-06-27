import React, { useState, useEffect } from 'react';

const ACTIONS = [
  {
    id: 'GRANT_ONE_TIME',
    label: 'GRANT ONE-TIME ACCESS',
    description: 'Allow this session only. Next login re-evaluated.',
    selectedBorder: 'var(--clear)',
    selectedBg: 'var(--clear-dim)',
    selectedColor: 'var(--clear)'
  },
  {
    id: 'REQUIRE_KYC',
    label: 'REQUIRE VIDEO KYC',
    description: 'User must complete live video verification.',
    selectedBorder: 'var(--amber)',
    selectedBg: 'var(--amber-dim)',
    selectedColor: 'var(--amber)'
  },
  {
    id: 'BLOCK_ALERT',
    label: 'BLOCK & ALERT USER',
    description: 'Deny access and send SMS alert to registered mobile.',
    selectedBorder: 'var(--red-threat)',
    selectedBg: 'var(--red-dim)',
    selectedColor: 'var(--red-threat)'
  },
  {
    id: 'ESCALATE',
    label: 'ESCALATE TO SECURITY TEAM',
    description: 'Assign to Tier-2 SOC analyst for manual investigation.',
    selectedBorder: 'var(--orange-mid)',
    selectedBg: 'rgba(255,107,53,0.1)',
    selectedColor: 'var(--orange-mid)'
  }
];

// Default event data used when no eventData prop is provided
const DEFAULT_EVENT = {
  eventId: 'EVT-9f2a3b',
  userId: 'USR-4721',
  riskScore: 73,
  signals: [
    { name: 'DEVICE TRUST',   points: 28.4, color: 'var(--red-threat)',  label: 'Unrecognized device from Jaipur',   width: 88 },
    { name: 'LOCATION RISK',  points: 22.1, color: 'var(--orange-mid)',  label: '847km from home city',              width: 68 },
    { name: 'BEHAVIORAL',     points: 14.7, color: 'var(--amber)',       label: 'Keystroke similarity: 41%',         width: 46 }
  ]
};

export default function AlertModal({ isOpen, onClose, onDecision, eventData }) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [reason, setReason] = useState('');
  const [reasonFocused, setReasonFocused] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Merge provided eventData with defaults
  const evt = eventData
    ? { ...DEFAULT_EVENT, ...eventData }
    : DEFAULT_EVENT;

  // Reset state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedAction(null);
      setReason('');
      setSubmitted(false);
    }
  }, [isOpen]);

  // Close on Escape key
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

  // Score ring colour
  const scoreRingColor = evt.riskScore <= 60 ? 'var(--amber)' : 'var(--orange-mid)';

  return (
    <>
      {/* ─── Keyframes ─────────────────────────────────────────── */}
      <style>{`
        @keyframes pulse-red-modal {
          0%, 100% { opacity: 0.4; transform: scale(0.85); }
          50%       { opacity: 1;   transform: scale(1.15); }
        }
        @keyframes modal-slide-in {
          from { transform: translateY(-24px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        .action-radio:hover { background-color: #0D0F14 !important; }
        .reason-input:focus { outline: none; border-color: var(--amber) !important; }
        .submit-btn:hover:not(:disabled) { background-color: var(--amber-light) !important; }
        .cancel-btn:hover { background-color: #0D0F14 !important; }
      `}</style>

      {/* ─── Backdrop ──────────────────────────────────────────── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.88)',
          zIndex: 9000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* ─── Modal Card ──────────────────────────────────────── */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '560px',
            backgroundColor: '#0F1117',
            border: '1px solid var(--amber)',
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column',
            animation: 'modal-slide-in 0.22s ease-out',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
        >
          {/* ─── Header Strip ──────────────────────────────────── */}
          <div style={{
            height: '48px',
            backgroundColor: 'rgba(255,45,45,0.08)',
            borderBottom: '1px solid rgba(255,45,45,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '8px', height: '8px',
                backgroundColor: 'var(--red-threat)',
                borderRadius: '50%',
                animation: 'pulse-red-modal 1.1s infinite ease-in-out'
              }} />
              <span className="display" style={{
                fontSize: '14px', fontWeight: '700',
                color: 'var(--red-threat)', letterSpacing: '0.04em'
              }}>
                ⚠ IDENTITY REVIEW REQUIRED
              </span>
            </div>
            <span className="mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              EVENT #{evt.eventId}
            </span>
          </div>

          {/* ─── Body ────────────────────────────────────────────── */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* ── Section 1: Risk Score Display ──────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {/* Score Ring */}
              <div style={{
                width: '120px', height: '120px',
                border: `3px solid ${scoreRingColor}`,
                borderRadius: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                position: 'relative'
              }}>
                {/* Corner accents */}
                {[{top:0,left:0},{top:0,right:0},{bottom:0,left:0},{bottom:0,right:0}].map((pos, i) => (
                  <div key={i} style={{
                    position: 'absolute', width: '8px', height: '8px',
                    backgroundColor: scoreRingColor,
                    ...pos
                  }} />
                ))}
                <span className="mono" style={{
                  fontSize: '40px', fontWeight: '700',
                  color: 'var(--amber)', lineHeight: 1
                }}>
                  {evt.riskScore}
                </span>
                <span className="mono" style={{ fontSize: '14px', color: 'var(--text-dim)' }}>
                  / 100
                </span>
              </div>

              {/* Score Label */}
              <div>
                <div className="display" style={{
                  fontSize: '18px', fontWeight: '700',
                  color: 'var(--orange-mid)', marginBottom: '8px'
                }}>
                  ELEVATED RISK
                </div>
                <div style={{
                  fontSize: '12px', color: 'var(--text-dim)',
                  fontFamily: 'Inter, sans-serif', lineHeight: '1.5'
                }}>
                  Automatic access denied.<br />
                  Manager review required.
                </div>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '10px' }}>
                  USER: <span style={{ color: 'var(--amber)' }}>{evt.userId}</span>
                </div>
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />

            {/* ── Section 2: Contributing Signals ────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="mono" style={{
                fontSize: '10px', color: 'var(--amber)',
                fontWeight: 'bold', letterSpacing: '0.08em'
              }}>
                CONTRIBUTING SIGNALS
              </div>

              {evt.signals.map((sig, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span className="mono" style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                      {sig.name}
                    </span>
                    <span className="mono" style={{ fontSize: '11px', color: sig.color, fontWeight: 'bold' }}>
                      +{sig.points} pts
                    </span>
                  </div>
                  {/* Bar track */}
                  <div style={{
                    width: '100%', height: '8px',
                    backgroundColor: 'var(--bg-void)',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{
                      width: `${sig.width}%`, height: '100%',
                      backgroundColor: sig.color,
                      transition: 'width 0.9s cubic-bezier(0.1,0.8,0.2,1)'
                    }} />
                  </div>
                  <div className="mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                    {sig.label}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />

            {/* ── Section 3: User Context ─────────────────────────── */}
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ flex: 1 }}>
                <div className="mono" style={{
                  fontSize: '10px', color: 'var(--amber)',
                  fontWeight: 'bold', letterSpacing: '0.08em', marginBottom: '6px'
                }}>
                  NORMAL PATTERN
                </div>
                <div className="mono" style={{
                  fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.7'
                }}>
                  Normal Login: Mumbai<br />
                  Hours: 9AM – 7PM<br />
                  Device: Trusted device
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="mono" style={{
                  fontSize: '10px', color: 'var(--amber)',
                  fontWeight: 'bold', letterSpacing: '0.08em', marginBottom: '6px'
                }}>
                  LAST 5 DECISIONS
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {['CLEAR', 'CLEAR', 'CLEAR', 'CLEAR', 'STEP_UP'].map((d, i) => (
                    <span key={i} className={`badge ${
                      d === 'CLEAR' ? 'badge-clear' :
                      d === 'STEP_UP' ? 'badge-step' :
                      d === 'HUMAN_REVIEW' ? 'badge-review' : 'badge-block'
                    }`} style={{ fontSize: '9px' }}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />

            {/* ── Section 4: Manager Decision ────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="mono" style={{
                fontSize: '10px', color: 'var(--amber)',
                fontWeight: 'bold', letterSpacing: '0.08em'
              }}>
                SELECT ACTION
              </div>

              {/* Action Radio Buttons */}
              {ACTIONS.map((action) => {
                const isSelected = selectedAction === action.id;
                return (
                  <div
                    key={action.id}
                    className="action-radio"
                    onClick={() => setSelectedAction(action.id)}
                    style={{
                      padding: '10px 14px',
                      backgroundColor: isSelected ? action.selectedBg : '#080A0E',
                      border: `1px solid ${isSelected ? action.selectedBorder : 'var(--border)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Custom Radio Dot */}
                    <div style={{
                      width: '14px', height: '14px',
                      border: `2px solid ${isSelected ? action.selectedBorder : 'var(--border)'}`,
                      borderRadius: 0,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {isSelected && (
                        <div style={{
                          width: '6px', height: '6px',
                          backgroundColor: action.selectedBorder
                        }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="mono" style={{
                        fontSize: '12px', fontWeight: 'bold',
                        color: isSelected ? action.selectedColor : 'var(--text-primary)'
                      }}>
                        {action.label}
                      </div>
                      <div className="mono" style={{
                        fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px'
                      }}>
                        {action.description}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Reason Input */}
              <textarea
                className="reason-input mono"
                rows={3}
                placeholder="Enter reason for decision (required)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                onFocus={() => setReasonFocused(true)}
                onBlur={() => setReasonFocused(false)}
                style={{
                  width: '100%',
                  backgroundColor: '#080A0E',
                  border: `1px solid ${reasonFocused ? 'var(--amber)' : '#1E2533'}`,
                  color: 'var(--text-primary)',
                  padding: '10px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12px',
                  borderRadius: 0,
                  resize: 'none',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                  marginTop: '4px'
                }}
              />
            </div>
          </div>

          {/* ─── Footer ──────────────────────────────────────────── */}
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--bg-elevated)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* Submit */}
              <button
                className="submit-btn display"
                onClick={handleSubmit}
                disabled={!selectedAction || !reason.trim() || submitted}
                style={{
                  minWidth: '180px',
                  height: '42px',
                  backgroundColor: selectedAction && reason.trim() ? 'var(--amber)' : '#2A2A2A',
                  border: 'none',
                  color: selectedAction && reason.trim() ? '#000000' : 'var(--text-dim)',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: selectedAction && reason.trim() ? 'pointer' : 'not-allowed',
                  letterSpacing: '0.04em',
                  borderRadius: 0,
                  transition: 'background-color 0.2s'
                }}
              >
                {submitted ? 'SUBMITTING...' : 'SUBMIT DECISION'}
              </button>

              {/* Cancel */}
              <button
                className="cancel-btn mono"
                onClick={onClose}
                style={{
                  height: '42px',
                  padding: '0 20px',
                  backgroundColor: 'transparent',
                  border: '1px solid #1E2533',
                  color: 'var(--text-dim)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  borderRadius: 0,
                  transition: 'background-color 0.2s'
                }}
              >
                CANCEL
              </button>
            </div>

            {/* Audit trail notice */}
            <div className="mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
              This decision is logged to the audit trail with your Employee ID:&nbsp;
              <span style={{ color: 'var(--amber)' }}>EMP-007</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
