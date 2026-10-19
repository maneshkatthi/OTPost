import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

function getInitial(email) {
  return (email?.[0] ?? '?').toUpperCase();
}

function getSessionExpiry() {
  const d = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DashboardPage() {
  const { user, logout, logoutAll } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  const handleLogoutAll = async () => {
    setLoggingOut(true);
    await logoutAll();
  };

  return (
    <div className="page">
      <div className="card dashboard-card">
        {/* Brand */}
        <div className="brand">
          <div className="brand-logo">📬</div>
          <span className="brand-name">OTPost</span>
        </div>

        {/* User avatar + info */}
        <div className="user-avatar">{getInitial(user?.email)}</div>

        <div className="status-badge">
          <span className="status-dot" />
          Authenticated
        </div>

        <p className="user-email">{user?.email}</p>
        <p className="user-id">uid: {user?.id}</p>

        {/* Session info rows */}
        <div className="info-row">
          <span className="info-row-label">Auth method</span>
          <span className="info-row-value">Email OTP</span>
        </div>
        <div className="info-row">
          <span className="info-row-label">Session expires</span>
          <span className="info-row-value">{getSessionExpiry()}</span>
        </div>
        <div className="info-row">
          <span className="info-row-label">Cookie</span>
          <span className="info-row-value">HttpOnly · SameSite=Lax</span>
        </div>

        {/* Actions */}
        <div className="btn-row">
          <button
            id="logout-btn"
            className="btn btn-ghost"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? <><div className="spinner" /> Signing out…</> : 'Sign out'}
          </button>
          <button
            id="logout-all-btn"
            className="btn btn-danger"
            onClick={handleLogoutAll}
            disabled={loggingOut}
          >
            Sign out everywhere
          </button>
        </div>

        <div className="security-row" style={{ marginTop: '20px' }}>
          <span>🔒</span>
          <span>Session invalidated server-side on logout</span>
        </div>
      </div>
    </div>
  );
}
