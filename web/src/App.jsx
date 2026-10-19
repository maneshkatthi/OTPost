import './index.css';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

/* Loading skeleton while checking existing session */
function BootSplash() {
  return (
    <div className="page">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 52, height: 52,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #5b6bf0, #a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
          boxShadow: '0 0 40px rgba(91,107,240,0.4)',
          animation: 'logoPulse 1.5s ease-in-out infinite',
        }}>📬</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0.1, 0.2, 0.3].map((d, i) => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--brand-400)',
              animation: `pulse 1.2s ease-in-out ${d}s infinite`,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) return <BootSplash />;
  return user ? <DashboardPage /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app">
        {/* Animated mesh background */}
        <div className="bg-mesh">
          <div className="bg-orb" />
        </div>
        <div className="bg-grid" />

        <AppRouter />
      </div>
    </AuthProvider>
  );
}
