import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import UserProfile from './pages/UserProfile';
import InsiderMonitor from './pages/InsiderMonitor';

// Custom Sidebar Component
const Sidebar = () => {
  const location = useLocation();

  // Helper to check if a route is active
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{
      width: '60px',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      backgroundColor: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: '20px',
      zIndex: 1000
    }}>
      {/* Brand logo */}
      <div className="display" style={{
        fontSize: '20px',
        fontWeight: 'bold',
        color: 'var(--amber)',
        marginBottom: '40px',
        userSelect: 'none',
        letterSpacing: '-1px'
      }}>
        CG
      </div>

      {/* Nav Links */}
      <nav style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%',
        alignItems: 'center'
      }}>
        {/* Dashboard link */}
        <Link to="/" title="Dashboard" style={{
          textDecoration: 'none',
          color: isActive('/') ? 'var(--amber)' : 'var(--text-dim)',
          transition: 'color 0.2s',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '40px',
          borderLeft: isActive('/') ? '2px solid var(--amber)' : '2px solid transparent'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
          </svg>
        </Link>

        {/* User profile link (links to a search/directory entry or default user) */}
        <Link to="/user/USR-1234" title="User Profile Analysis" style={{
          textDecoration: 'none',
          color: isActive('/user') ? 'var(--amber)' : 'var(--text-dim)',
          transition: 'color 0.2s',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '40px',
          borderLeft: isActive('/user') ? '2px solid var(--amber)' : '2px solid transparent'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </Link>

        {/* Insider monitor link */}
        <Link to="/insider" title="Insider Threat Monitor" style={{
          textDecoration: 'none',
          color: isActive('/insider') ? 'var(--amber)' : 'var(--text-dim)',
          transition: 'color 0.2s',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '40px',
          borderLeft: isActive('/insider') ? '2px solid var(--amber)' : '2px solid transparent'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </Link>
      </nav>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-void)' }}>
        {/* Sidebar */}
        <Sidebar />

        {/* Page Area */}
        <div style={{
          marginLeft: '60px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0 // prevent layout overflow
        }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            <Route path="/insider" element={<InsiderMonitor />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
