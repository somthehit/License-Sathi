import React from 'react';
import { useAuth } from '@/context/AuthContext';

interface TopbarProps {
  title: string;
  right?: React.ReactNode;
}

export default function Topbar({ title, right }: TopbarProps) {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 220,
        right: 0,
        height: 56,
        backgroundColor: '#fcf9f8',
        borderBottom: '1px solid #e6bdbc',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 24,
        paddingRight: 24,
      }}
    >
      {/* Page Title */}
      <h2
        style={{
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontWeight: 700,
          fontSize: 16,
          color: '#b1002c',
          margin: 0,
        }}
      >
        {title}
      </h2>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Slot for page-level actions (e.g. Add buttons) */}
        {right && <div style={{ display: 'flex', alignItems: 'center' }}>{right}</div>}
        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#f0eded',
            border: '1px solid #e6bdbc',
            borderRadius: 999,
            padding: '6px 14px',
            width: 220,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: '#5c3f3f', lineHeight: 1 }}
          >
            search
          </span>
          <input
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 14,
              color: '#1c1b1b',
              width: '100%',
            }}
            placeholder="Search..."
          />
        </div>

        {/* Notification bell */}
        <button
          style={{
            position: 'relative',
            width: 34,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 22, color: '#5c3f3f' }}
          >
            notifications
          </span>
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#b1002c',
              border: '1.5px solid #fcf9f8',
            }}
          />
        </button>

        {/* Help */}
        <button
          style={{
            width: 34,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 22, color: '#5c3f3f' }}
          >
            help_outline
          </span>
        </button>

        {/* User info + Avatar + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1c1b1b', margin: 0, lineHeight: 1.2 }}>
              {user?.name ?? 'Admin'}
            </p>
            <p style={{ fontSize: 10, color: '#5c3f3f', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              SYSTEM SUPERUSER
            </p>
          </div>
          {/* Avatar with initials */}
          <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#ffdad9', border: '2px solid #e6bdbc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#b1002c' }}>{initials}</span>
          </div>
          {/* Logout */}
          <button
            onClick={logout}
            title="Sign out"
            style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 999, background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#5c3f3f' }}>logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
