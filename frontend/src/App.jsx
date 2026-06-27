import React from 'react';
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    )
  },
  {
    path: '/user/USR-1234',
    match: '/user',
    label: 'User Profiles',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  },
  {
    path: '/insider',
    match: '/insider',
    label: 'Insider Monitor',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
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
        padding: '24px 20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          {/* Official Bank of Baroda "B" logo asset (48px tall, transparent background, aspect ratio preserved) */}
          <img 
            src="/bob-logo.png" 
            alt="Bank of Baroda" 
            style={{ height: '48px', objectFit: 'contain', flexShrink: 0 }} 
          />
          <div>
            <div style={{
              fontSize: '15px', fontWeight: '700', color: '#FFFFFF',
              fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}>ContextGuard</div>
            <div style={{
              fontSize: '10px', color: 'rgba(255,255,255,0.4)',
              fontFamily: "'Inter', sans-serif", letterSpacing: '0.04em',
              lineHeight: 1,
            }}>Identity Trust Engine</div>
          </div>
        </div>
        
        {/* Navigation / Brand sub-label logo (18px tall, matching brand asset consistently) */}
        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          borderRadius: '8px',
          background: 'rgba(255,106,19,0.08)',
          border: '1px solid rgba(255,106,19,0.15)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <img 
            src="/bob-logo.png" 
            alt="Bank of Baroda" 
            style={{ height: '18px', objectFit: 'contain', flexShrink: 0 }} 
          />
          <span style={{
            fontSize: '10px', color: 'rgba(255,255,255,0.6)',
            fontFamily: "'Inter', sans-serif", fontWeight: '600',
            letterSpacing: '0.02em',
          }}>Bank of Baroda</span>
        </div>
      </div>

      {/* Nav Section */}
      <div style={{ padding: '16px 14px', flex: 1 }}>
        <div style={{
          fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.1em', padding: '0 8px 10px', textTransform: 'uppercase',
          fontFamily: "'Inter', sans-serif",
        }}>Platform Navigation</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: active ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                  background: active ? 'rgba(255,106,19,0.15)' : 'transparent',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  fontWeight: active ? '600' : '500',
                  borderLeft: active ? '3px solid #FF6A13' : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'var(--bg-sidebar-hover)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                  }
                }}
              >
                <span style={{ 
                  color: active ? '#FF6A13' : 'inherit', 
                  transition: 'color 0.2s', 
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {active && (
                  <span style={{
                    marginLeft: 'auto',
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: '#FF6A13',
                    boxShadow: '0 0 8px #FF6A13',
                  }} />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.5)',
            display: 'inline-block',
          }} />
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', sans-serif", fontWeight: '500' }}>
            SOC Status: Normal
          </span>
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', fontFamily: "'Inter', sans-serif" }}>
          ContextGuard Security Suite
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
