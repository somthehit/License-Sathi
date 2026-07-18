import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';

export function Navbar() {
  const { user, loginWithGoogle, logout } = useAuth();

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)'
    }}>
      <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
        License <span className="text-gradient">Sathi</span>
      </Link>

      <div>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
              ) : (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {user.email?.[0].toUpperCase()}
                </div>
              )}
              <span className="text-muted">{user.displayName || user.email}</span>
            </div>
            <Button variant="secondary" onClick={logout} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              Logout
            </Button>
          </div>
        ) : (
          <Button onClick={loginWithGoogle}>
            Login with Google
          </Button>
        )}
      </div>
    </nav>
  );
}
