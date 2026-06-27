import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import UserProfile from './pages/UserProfile';
import InsiderMonitor from './pages/InsiderMonitor';

/* ── NAV ITEMS ─────────────────────────────────────────────── */
const NAV_ITEMS = [
  {
    path: '/',
    exact: true,
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="8" rx="1.5"/>
        <rect x="14" y="3" width="7" height="4" rx="1.5"/>
        <rect x="14" y="11" width="7" height="10" rx="1.5"/>
        <rect x="3" y="15" width="7" height="6" rx="1.5"/>
      </svg>
    )
  },
  {
    path: '/user/USR-1234',
    match: '/user',
    label: 'User Profiles',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="4"/>
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
        <path d="M19 8v6M22 11h-6"/>
      </svg>
    )
  },
  {
    path: '/insider',
    match: '/insider',
    label: 'Insider Monitor',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    )
  },
];

/* ── SIDEBAR ────────────────────────────────────────────────── */
const Sidebar = () => {
  const location = useLocation();

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    if (item.match) return location.pathname.startsWith(item.match);
    return false;
  };

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      position: 'fixed',
      top: 0, left: 0,
      background: 'var(--bg-sidebar)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      flexShrink: 0,
    }}>

      {/* Brand */}
      <div style={{
        padding: '20px 18px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        {/* BOB Logo + ContextGuard */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          {/* BOB "B" mark — orange geometric icon */}
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #FF6A13 0%, #FF8A40 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: '0 2px 8px rgba(255,106,19,0.35)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z"/>
            </svg>
          </div>
          <div>
            <div style={{
              fontSize: '14px', fontWeight: '700', color: '#F1F5F9',
              fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}>ContextGuard</div>
            <div style={{
              fontSize: '10px', color: 'rgba(255,255,255,0.38)',
              fontFamily: "'Inter', sans-serif", letterSpacing: '0.03em',
              lineHeight: 1,
            }}>Identity Trust Engine</div>
          </div>
        </div>
        {/* Bank of Baroda label */}
        <div style={{
          marginTop: '10px',
          padding: '6px 10px',
          borderRadius: '6px',
          background: 'rgba(255,106,19,0.10)',
          border: '1px solid rgba(255,106,19,0.18)',
          display: 'flex', alignItems: 'center', gap: '7px',
        }}>
          <img
            src="/bob-logo.png"
            alt="Bank of Baroda"
            style={{ width: '18px', height: '18px', objectFit: 'contain', filter: 'brightness(0) saturate(100%) invert(48%) sepia(89%) saturate(742%) hue-rotate(359deg) brightness(101%) contrast(103%)' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span style={{
            fontSize: '10px', color: 'rgba(255,255,255,0.55)',
            fontFamily: "'Inter', sans-serif", fontWeight: '500',
          }}>Bank of Baroda</span>
        </div>
      </div>

      {/* Nav Section */}
      <div style={{ padding: '12px 10px', flex: 1 }}>
        <div style={{
          fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.25)',
          letterSpacing: '0.08em', padding: '4px 8px 8px', textTransform: 'uppercase',
          fontFamily: "'Inter', sans-serif",
        }}>Navigation</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 10px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: active ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                  background: active ? 'rgba(255,106,19,0.14)' : 'transparent',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  fontWeight: active ? '600' : '400',
                  borderLeft: active ? '3px solid #FF6A13' : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                  }
                }}
              >
                <span style={{ color: active ? '#FF6A13' : 'inherit', transition: 'color 0.15s', flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {active && (
                  <span style={{
                    marginLeft: 'auto',
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: '#FF6A13',
                    boxShadow: '0 0 6px rgba(255,106,19,0.6)',
                  }} />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom — System Status */}
      <div style={{
        padding: '14px 18px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: '#10B981', boxShadow: '0 0 6px rgba(16,185,129,0.5)',
            animation: 'pulse-green 2s infinite ease-in-out',
            display: 'inline-block',
          }} />
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: "'Inter', sans-serif" }}>
            System Operational
          </span>
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.20)', fontFamily: "'Inter', sans-serif" }}>
          ContextGuard v2.0.0
        </div>
      </div>
    </aside>
  );
};

/* ── APP ────────────────────────────────────────────────────── */
function App() {
  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
        <Sidebar />
        <div style={{
          marginLeft: 'var(--sidebar-width)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          position: 'relative',
          zIndex: 1,
        }}>
          <Routes>
            <Route path="/"              element={<Dashboard />} />
            <Route path="/user/:userId"  element={<UserProfile />} />
            <Route path="/insider"       element={<InsiderMonitor />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
