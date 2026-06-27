import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AlertModal from '../components/AlertModal';

const API_BASE = 'https://contextguard-backend.onrender.com/api/v1';

const CITIES = ["Mumbai", "Delhi", "Chennai", "Bangalore", "Jaipur", "Kolkata", "Hyderabad", "Pune"];
const SIGNALS = [
  "location_risk_score",
  "device_risk_score",
  "time_risk_score",
  "behavioral_risk_score",
  "transaction_risk_score",
  "recovery_risk_score"
];

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
    isNew: true
  };
};

const initialFakeEvents = Array.from({ length: 50 }, () => {
  const evt = generateFakeEvent();
  evt.isNew = false;
  return evt;
});

const getShapSignals = (evtData) => {
  const shapList = [];
  if (evtData.device_risk_score > 0) {
    shapList.push({ name: 'DEVICE TRUST', points: evtData.device_risk_score, color: 'var(--status-red)', label: evtData.is_new_device ? 'Unrecognized device detected' : 'Device risk elevated', width: Math.round(evtData.device_risk_score) });
  }
  if (evtData.location_risk_score > 0) {
    shapList.push({ name: 'LOCATION RISK', points: evtData.location_risk_score, color: 'var(--accent)', label: `Login from ${evtData.city || 'unknown location'}`, width: Math.round(evtData.location_risk_score) });
  }
  if (evtData.behavioral_risk_score > 0) {
    shapList.push({ name: 'BEHAVIORAL', points: evtData.behavioral_risk_score, color: 'var(--status-amber)', label: `Keystroke variance: ${evtData.keystroke_variance_ms}ms`, width: Math.round(evtData.behavioral_risk_score) });
  }
  if (evtData.time_risk_score > 0) {
    shapList.push({ name: 'TIME RISK', points: evtData.time_risk_score, color: 'var(--status-amber)', label: `Suspicious login hour: ${evtData.login_hour}:00`, width: Math.round(evtData.time_risk_score) });
  }
  if (evtData.transaction_risk_score > 0) {
    shapList.push({ name: 'TRANSACTION', points: evtData.transaction_risk_score, color: 'var(--status-blue)', label: `Transaction amount risk`, width: Math.round(evtData.transaction_risk_score) });
  }
  if (evtData.recovery_risk_score > 0) {
    shapList.push({ name: 'RECOVERY RISK', points: evtData.recovery_risk_score, color: 'var(--status-red)', label: `Recovery attempt risk`, width: Math.round(evtData.recovery_risk_score) });
  }
  return shapList.sort((a, b) => b.points - a.points);
};

/* ── HELPERS ─────────────────────────────────────────────────── */
const getDecisionConfig = (decision) => {
  switch (decision) {
    case 'CLEAR':       return { cls: 'badge-clear',  strip: 'var(--status-green)', label: 'Clear' };
    case 'STEP_UP':     return { cls: 'badge-step',   strip: 'var(--status-amber)', label: 'Step-Up' };
    case 'HUMAN_REVIEW':return { cls: 'badge-review', strip: 'var(--status-orange)',label: 'Review' };
    case 'BLOCK':       return { cls: 'badge-block',  strip: 'var(--status-red)',   label: 'Block' };
    default:            return { cls: 'badge-step',   strip: 'var(--border)',        label: decision };
  }
};

const getScoreColor = (score) => {
  if (score <= 30) return 'var(--status-green)';
  if (score <= 60) return 'var(--status-amber)';
  if (score <= 85) return 'var(--status-orange)';
  return 'var(--status-red)';
};

const getScoreBg = (score) => {
  if (score <= 30) return 'var(--status-green-bg)';
  if (score <= 60) return 'var(--status-amber-bg)';
  if (score <= 85) return 'var(--status-orange-bg)';
  return 'var(--status-red-bg)';
};

const getScoreBorder = (score) => {
  if (score <= 30) return 'var(--status-green-border)';
  if (score <= 60) return 'var(--status-amber-border)';
  if (score <= 85) return 'var(--status-orange-border)';
  return 'var(--status-red-border)';
};

const getInitials = (userId) => userId ? userId.replace('USR-', '').substring(0, 2) : 'XX';

const getSignalLabel = (signal) => {
  if (!signal) return '—';
  return signal.replace('_risk_score', '').replace(/_/g, ' ');
};

/* ── KPI CARD ────────────────────────────────────────────────── */
const KpiCard = ({ icon, value, label, color, bgColor, trend, trendUp }) => (
  <div className="card" style={{
    padding: '24px',
    borderTop: `4px solid ${color}`,
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
      <div style={{
        width: '46px', height: '46px', borderRadius: '12px',
        background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: color, flexShrink: 0,
      }}>
        {icon}
      </div>
      {trend && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '3px',
          fontSize: '11px', fontWeight: '700',
          color: trendUp ? 'var(--status-red)' : 'var(--status-green)',
          background: trendUp ? 'var(--status-red-bg)' : 'var(--status-green-bg)',
          border: `1px solid ${trendUp ? 'var(--status-red-border)' : 'var(--status-green-border)'}`,
          padding: '3px 8px', borderRadius: '99px',
        }}>
          {trendUp ? '↑' : '↓'} {trend}
        </div>
      )}
    </div>
    <div>
      <div style={{ fontSize: '36px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1.1', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
        {value}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: '500' }}>
        {label}
      </div>
    </div>
  </div>
);

/* ── SIGNAL BAR ──────────────────────────────────────────────── */
const SignalBar = ({ name, score, color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
        {name}
      </span>
      <span style={{ fontSize: '13px', fontWeight: '700', color, fontFamily: "'Space Grotesk', sans-serif" }}>
        {score}%
      </span>
    </div>
    <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${score}%`,
        background: `linear-gradient(90deg, ${color}cc, ${color})`,
        borderRadius: '99px',
        transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }} />
    </div>
  </div>
);

/* ── MAIN DASHBOARD ──────────────────────────────────────────── */
export default function Dashboard() {
  const [events, setEvents] = useState(initialFakeEvents);
  const [stats, setStats] = useState({
    total_events_today: 147,
    high_risk_blocked: 12,
    human_review_pending: 8,
    avg_trust_score: 31.4,
    clear_percentage: 62
  });
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [signalScores, setSignalScores] = useState({
    behavioral: 65, location: 35, device: 55, time: 20, transaction: 10, recovery: 50
  });
  const [systemTime, setSystemTime] = useState(new Date().toLocaleTimeString('en-IN', { hour12: false }));
  const [modalEvent, setModalEvent] = useState(null);

  /* live clock */
  useEffect(() => {
    const t = setInterval(() => setSystemTime(new Date().toLocaleTimeString('en-IN', { hour12: false })), 1000);
    return () => clearInterval(t);
  }, []);

  /* fetch backend */
  const fetchData = async () => {
    try {
      const feedRes = await fetch(`${API_BASE}/live-feed`);
      if (!feedRes.ok) throw new Error();
      const feedData = await feedRes.json();
      if (feedData && feedData.length > 0) setEvents(feedData);
      const statsRes = await fetch(`${API_BASE}/dashboard/stats`);
      if (!statsRes.ok) throw new Error();
      setStats(await statsRes.json());
      setIsDemoMode(false);
    } catch {
      setIsDemoMode(true);
    }
  };

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 5000);
    return () => clearInterval(iv);
  }, []);

  /* demo simulation */
  useEffect(() => {
    if (!isDemoMode) return;
    const t = setInterval(() => {
      const newEvt = generateFakeEvent();
      setEvents(prev => [newEvt, ...prev.slice(0, 49)]);
      setStats(prev => ({
        ...prev,
        total_events_today: prev.total_events_today + 1,
        high_risk_blocked: newEvt.decision === 'BLOCK' ? prev.high_risk_blocked + 1 : prev.high_risk_blocked,
        human_review_pending: newEvt.decision === 'HUMAN_REVIEW' ? prev.human_review_pending + 1 : prev.human_review_pending,
      }));
      const signalKey = newEvt.top_signal.replace('_risk_score', '');
      setSignalScores(prev => ({
        ...prev,
        [signalKey]: Math.min(100, Math.max(5, (prev[signalKey] || 50) + (newEvt.final_risk_score > 50 ? 5 : -5)))
      }));
    }, 4000);
    return () => clearInterval(t);
  }, [isDemoMode]);

  /* simulate attacks */
  const handleSimulate = async (type) => {
    const payloads = {
      NORMAL: { user_id: "USR-1234", ip_address: "49.36.12.44", city: "Mumbai", login_hour: 12, is_new_device: false, keystroke_variance_ms: 85.2, last_login_city: "Mumbai", is_recovery_attempt: false, records_accessed: 5, transaction_amount: 1500 },
      ATTACKER: { user_id: "USR-9999", ip_address: "185.220.101.5", city: "Unknown", login_hour: 3, is_new_device: true, keystroke_variance_ms: 287, last_login_city: "Mumbai", is_recovery_attempt: true, records_accessed: 200, transaction_amount: 95000 },
      INSIDER: { user_id: `USR-${Math.floor(Math.random() * 8765) + 1234}`, ip_address: "117.20.12.3", city: "Mumbai", login_hour: 4, is_new_device: true, keystroke_variance_ms: 150.0, last_login_city: "Mumbai", is_recovery_attempt: true, records_accessed: 120, transaction_amount: 45000 },
    };
    const flashColors = { NORMAL: 'green', ATTACKER: 'red', INSIDER: 'amber' };
    const flashColor = flashColors[type];
    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloads[type]),
      });
      if (res.ok) {
        const analyzed = await res.json();
        setEvents(prev => [{
          event_id: analyzed.event_id, user_id: analyzed.user_id,
          city: payloads[type].city, final_risk_score: analyzed.final_risk_score,
          decision: analyzed.decision, top_signal: 'location_risk_score',
          timestamp: analyzed.timestamp.replace('T', ' ').substring(0, 19),
          isNew: true, flashColor,
        }, ...prev.slice(0, 49)]);
        fetchData();
      } else throw new Error();
    } catch {
      const forced = { NORMAL: 'CLEAR', ATTACKER: 'BLOCK', INSIDER: 'HUMAN_REVIEW' }[type];
      const local = generateFakeEvent(forced);
      local.flashColor = flashColor; local.isNew = true;
      setEvents(prev => [local, ...prev.slice(0, 49)]);
      setStats(prev => ({
        ...prev, total_events_today: prev.total_events_today + 1,
        high_risk_blocked: local.decision === 'BLOCK' ? prev.high_risk_blocked + 1 : prev.high_risk_blocked,
        human_review_pending: local.decision === 'HUMAN_REVIEW' ? prev.human_review_pending + 1 : prev.human_review_pending,
      }));
    }
  };

  const getFlashClass = (evt) => {
    if (!evt.isNew) return '';
    if (evt.flashColor === 'green') return 'flash-green';
    if (evt.flashColor === 'red') return 'flash-red';
    return 'flash-amber';
  };

  const signalColorMap = {
    behavioral: 'var(--status-amber)', location: 'var(--accent)',
    device: 'var(--status-red)', time: 'var(--status-blue)',
    transaction: 'var(--status-blue)', recovery: 'var(--status-red)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-page)' }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="glass" style={{
        height: 'var(--header-height)', position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', flexShrink: 0,
        boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
      }}>
        {/* Left: Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="/bob-logo.png" alt="Bank of Baroda" style={{ height: '32px', objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }} />
          <div style={{ width: '1px', height: '24px', background: 'var(--border-strong)' }} />
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.2 }}>
              ContextGuard
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: 1, fontWeight: '500' }}>
              Identity Trust Engine
            </div>
          </div>
        </div>

        {/* Right: Status chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* API status */}
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

          <div style={{ width: '1px', height: '20px', background: 'var(--border-strong)' }} />

          {/* Clock */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px', borderRadius: '8px',
            background: 'var(--bg-card-alt)', border: '1px solid var(--border-strong)',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
              {systemTime}
            </span>
          </div>

          {/* User chip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '4px 10px 4px 4px', borderRadius: '99px',
            background: 'var(--bg-card-alt)', border: '1px solid var(--border-strong)',
          }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent) 0%, #E05206 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '700', color: '#fff',
            }}>SO</div>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>SOC Analyst</span>
          </div>
        </div>
      </header>

      {/* ── PAGE BODY ──────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '24px', minHeight: 0 }}>

        {/* Page title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif", margin: 0, letterSpacing: '-0.01em' }}>
              Security Operations Center
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0', fontWeight: '500' }}>
              Real-time threat monitoring &amp; session validation — Bank of Baroda Identity Protection
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '99px', background: 'var(--status-red-bg)', border: '1px solid var(--status-red-border)' }}>
            <span className="pulse-red-dot" />
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--status-red)', letterSpacing: '0.04em' }}>LIVE MONITOR</span>
          </div>
        </div>

        {/* ── KPI CARDS ─────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '20px' }}>
          <KpiCard
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            }
            value={stats.total_events_today}
            label="Total Events Today"
            color="var(--status-blue)"
            bgColor="var(--status-blue-bg)"
            trend="14%"
            trendUp={true}
          />
          <KpiCard
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            }
            value={stats.high_risk_blocked}
            label="Threats Blocked"
            color="var(--status-red)"
            bgColor="var(--status-red-bg)"
            trend="3 new"
            trendUp={true}
          />
          <KpiCard
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            }
            value={stats.human_review_pending}
            label="Awaiting Analyst Action"
            color="var(--status-orange)"
            bgColor="var(--status-orange-bg)"
          />
          <KpiCard
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            }
            value={`${stats.clear_percentage ?? 62}%`}
            label="Clear Login Rate"
            color="var(--status-green)"
            bgColor="var(--status-green-bg)"
            trend="2.4%"
            trendUp={false}
          />
        </div>

        {/* ── MAIN GRID ─────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>

          {/* LEFT — LIVE THREAT TABLE */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div className="card-elevated" style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', flexDirection: 'column',
              flex: 1, minHeight: 0, overflow: 'hidden',
            }}>
              {/* Table Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                    Live Threat Feed
                  </h2>
                  <span style={{
                    fontSize: '11px', padding: '2px 10px', borderRadius: '99px',
                    background: 'var(--status-blue-bg)', color: 'var(--status-blue)',
                    border: '1px solid var(--status-blue-border)', fontWeight: '700',
                  }}>
                    {events.length} events
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '500' }}>
                  Click REVIEW rows to initiate investigation
                </span>
              </div>

              {/* Table */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '14%' }}/>
                    <col style={{ width: '15%' }}/>
                    <col style={{ width: '13%' }}/>
                    <col style={{ width: '10%' }}/>
                    <col style={{ width: '15%' }}/>
                    <col style={{ width: '18%' }}/>
                    <col style={{ width: '10%' }}/>
                    <col style={{ width: '5%' }}/>
                  </colgroup>
                  <thead>
                    <tr style={{
                      position: 'sticky', top: 0, zIndex: 10,
                      background: 'var(--bg-card-alt)',
                      borderBottom: '1px solid var(--border)',
                    }}>
                      {['Event ID','User','City','Risk Score','Decision','Top Signal','Time',''].map((h, i) => (
                        <th key={i} style={{
                          padding: '12px 16px', textAlign: i === 3 ? 'center' : 'left',
                          fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)',
                          letterSpacing: '0.04em', textTransform: 'uppercase',
                          whiteSpace: 'nowrap', overflow: 'hidden',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((evt, idx) => {
                      const cfg = getDecisionConfig(evt.decision);
                      const isReview = evt.decision === 'HUMAN_REVIEW';
                      return (
                        <tr
                          key={evt.event_id + idx}
                          className={getFlashClass(evt)}
                          onClick={async () => {
                            if (!isReview) return;
                            try {
                              const res = await fetch(`${API_BASE}/event/${evt.event_id}`);
                              if (res.ok) {
                                const fullEvt = await res.json();
                                setModalEvent({ eventId: fullEvt.event_id, userId: fullEvt.user_id, riskScore: fullEvt.final_risk_score, signals: getShapSignals(fullEvt) });
                              } else throw new Error();
                            } catch {
                              setModalEvent({ eventId: evt.event_id, userId: evt.user_id, riskScore: evt.final_risk_score, signals: [
                                { name: 'DEVICE TRUST', points: 28.4, color: 'var(--status-red)', label: 'Unrecognized device detected', width: 88 },
                                { name: 'LOCATION RISK', points: 22.1, color: 'var(--accent)', label: `Login from ${evt.city || 'unknown'}`, width: 68 },
                                { name: 'BEHAVIORAL', points: 14.7, color: 'var(--status-amber)', label: 'Keystroke similarity degraded', width: 46 },
                              ]});
                            }
                          }}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            cursor: isReview ? 'pointer' : 'default',
                            transition: 'background 0.15s ease',
                            background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'; }}
                        >
                          {/* Risk strip + event id */}
                          <td style={{ padding: '0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', height: '52px' }}>
                              <div style={{ width: '4px', height: '100%', background: cfg.strip, borderRadius: '0 2px 2px 0', flexShrink: 0 }} />
                              <span className="font-mono" style={{ padding: '0 16px', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {evt.event_id}
                              </span>
                            </div>
                          </td>
                          {/* User avatar */}
                          <td style={{ padding: '0 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '30px', height: '30px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '11px', fontWeight: '700', color: '#fff', flexShrink: 0,
                                boxShadow: '0 2px 4px rgba(79,70,229,0.15)',
                              }}>
                                {getInitials(evt.user_id)}
                              </div>
                              <Link to={`/user/${evt.user_id}`} style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                onClick={e => e.stopPropagation()}>
                                {evt.user_id}
                              </Link>
                            </div>
                          </td>
                          <td style={{ padding: '0 16px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {evt.city || '—'}
                          </td>
                          {/* Score */}
                          <td style={{ padding: '0 16px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: '38px', height: '26px', borderRadius: '6px',
                              background: getScoreBg(evt.final_risk_score),
                              border: `1px solid ${getScoreBorder(evt.final_risk_score)}`,
                              fontSize: '12px', fontWeight: '700',
                              color: getScoreColor(evt.final_risk_score),
                              fontFamily: "'Space Grotesk', sans-serif",
                            }}>
                              {evt.final_risk_score}
                            </span>
                          </td>
                          <td style={{ padding: '0 16px' }}>
                            <span className={`badge ${cfg.cls}`}>
                              {cfg.label}
                            </span>
                          </td>
                          <td style={{ padding: '0 16px', fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                            {getSignalLabel(evt.top_signal)}
                          </td>
                          <td style={{ padding: '0 16px', fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '500', whiteSpace: 'nowrap' }}>
                            {evt.timestamp ? (evt.timestamp.split(' ')[1] || evt.timestamp).substring(0, 8) : '—'}
                          </td>
                          <td style={{ padding: '0 12px' }}>
                            {isReview && (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: '26px', height: '26px', borderRadius: '8px',
                                background: 'var(--status-orange-bg)', color: 'var(--status-orange)',
                                border: '1px solid var(--status-orange-border)',
                                animation: 'pulse-green 1.8s infinite ease-in-out',
                              }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ width: '340px', display: 'flex', flexDirection: 'column', gap: '20px', flexShrink: 0 }}>

            {/* SIGNAL ANALYSIS CARD */}
            <div className="card" style={{
              padding: '24px',
              flex: 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                  Signal Analysis
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--status-blue)', padding: '2px 8px', background: 'var(--status-blue-bg)', borderRadius: '6px', border: '1px solid var(--status-blue-border)', fontWeight: '600' }}>
                  Live metrics
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Object.entries(signalScores).map(([name, score]) => (
                  <SignalBar
                    key={name}
                    name={name}
                    score={score}
                    color={signalColorMap[name] || 'var(--accent)'}
                  />
                ))}
              </div>
            </div>

            {/* QUICK ACTIONS CARD */}
            <div className="card" style={{
              padding: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                  Scenario Simulator
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: '1.6', fontWeight: '500' }}>
                Inject synthetic mock events to test risk-rules and detection pathways.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => handleSimulate('NORMAL')} style={{
                  width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#fff', border: 'none',
                  fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.2)',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1.5px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,185,129,0.3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.2)'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                  Simulate Normal Login
                </button>
                <button onClick={() => handleSimulate('ATTACKER')} style={{
                  width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, #FF6A13 0%, #EA580C 100%)', color: '#fff', border: 'none',
                  fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: '0 4px 12px rgba(255,106,19,0.2)',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1.5px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,106,19,0.3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,106,19,0.2)'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Simulate Attacker
                </button>
                <button onClick={() => handleSimulate('INSIDER')} style={{
                  width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', color: '#fff', border: 'none',
                  fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.2)',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1.5px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(239,68,68,0.3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.2)'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="8" y1="11" x2="16" y2="11"/></svg>
                  Simulate Insider Threat
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer style={{
        padding: '14px 28px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-card)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '500' }}>
          ContextGuard v2.0.0 · Bank of Baroda PSB Hackathon 2026 · Cybersecurity &amp; Fraud Domain
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '500' }}>© 2026 Team Sentinel</span>
      </footer>

      {/* ALERT MODAL */}
      <AlertModal
        isOpen={!!modalEvent}
        onClose={() => setModalEvent(null)}
        onDecision={async ({ action, reason, eventId }) => {
          try {
            await fetch(`${API_BASE}/event/${eventId}/decision`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action, reason }),
            });
          } catch (err) { console.error('Error logging decision:', err); }
          setModalEvent(null);
        }}
        eventData={modalEvent}
      />
    </div>
  );
}
