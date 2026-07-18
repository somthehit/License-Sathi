"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';

const P = '#b1002c';
const S = '#335ab4';

const fi: React.CSSProperties = {
  width: '100%', border: '1px solid #e6bdbc', borderRadius: 8,
  padding: '9px 12px', fontSize: 13, color: '#1c1b1b',
  backgroundColor: '#f6f3f2', outline: 'none', boxSizing: 'border-box',
};
const ll: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.05em',
  color: '#5c3f3f', marginBottom: 5,
};

interface Stats {
  totalQuestions: number;
  totalMaterials: number;
  totalUsers: number;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();

  // ── Profile form ──────────────────────────────────────────────────────────
  const [name, setName]   = useState('');
  const [savingName, setSavingName] = useState(false);

  // ── Password form ─────────────────────────────────────────────────────────
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<Stats | null>(null);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // Pre-fill name from auth context
  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  // Fetch quick stats from dashboard API
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalQuestions: data.totalQuestions ?? 0,
          totalMaterials: data.totalMaterials ?? 0,
          totalUsers:     data.totalUsers     ?? 0,
        });
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // ── Save display name ─────────────────────────────────────────────────────
  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { showToast('Name cannot be empty', false); return; }
    setSavingName(true);
    try {
      const res = await fetch('/api/admin-users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) showToast('Display name updated successfully');
      else {
        const err = await res.json();
        showToast(err.error ?? 'Failed to update name', false);
      }
    } catch { showToast('Network error', false); }
    finally { setSavingName(false); }
  }

  // ── Change password ───────────────────────────────────────────────────────
  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPw) { showToast('Enter your current password', false); return; }
    if (newPw.length < 6) { showToast('New password must be at least 6 characters', false); return; }
    if (newPw !== confirmPw) { showToast('Passwords do not match', false); return; }
    setSavingPw(true);
    try {
      const res = await fetch('/api/admin-users/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      if (res.ok) {
        showToast('Password changed successfully');
        setCurrentPw(''); setNewPw(''); setConfirmPw('');
      } else {
        const err = await res.json();
        showToast(err.error ?? 'Failed to change password', false);
      }
    } catch { showToast('Network error', false); }
    finally { setSavingPw(false); }
  }

  const initials = (user?.name ?? user?.email ?? 'A')
    .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  const roleLabel = user?.role === 'super_admin' ? 'Super Admin' : 'Admin';
  const roleColor = user?.role === 'super_admin' ? '#a16207' : S;
  const roleBg    = user?.role === 'super_admin' ? '#ffe16d' : '#dae1ff';

  return (
    <Layout title="My Profile">
      <div className="p-6 max-w-4xl mx-auto">

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', top: 72, right: 24, zIndex: 999, backgroundColor: toast.ok ? '#dcfce7' : '#ffdad9', border: `1px solid ${toast.ok ? '#16a34a' : P}`, borderRadius: 10, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
            <span className="material-symbols-outlined text-base" style={{ color: toast.ok ? '#16a34a' : P, fontVariationSettings: "'FILL' 1" }}>{toast.ok ? 'check_circle' : 'error'}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: toast.ok ? '#16a34a' : P }}>{toast.msg}</span>
          </div>
        )}

        {/* Page header */}
        <div className="mb-6">
          <h1 className="font-display font-bold text-[24px] text-[#1c1b1b]">My Profile</h1>
          <p className="text-sm text-[#5c3f3f] mt-1">Manage your account details and security settings.</p>
        </div>

        <div className="flex gap-6 items-start">

          {/* ── Left column ─────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Identity card */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 16 }} className="p-6 shadow-sm">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #e6bdbc30' }}>
                {/* Avatar */}
                <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#ffdad9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: P }}>{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <p style={{ fontWeight: 800, fontSize: 18, color: '#1c1b1b', margin: 0 }}>{user?.name ?? '—'}</p>
                    <span style={{ backgroundColor: roleBg, color: roleColor, fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '2px 8px' }}>{roleLabel}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#5c3f3f', margin: '3px 0 0' }}>{user?.email ?? '—'}</p>
                </div>
              </div>

              {/* Update name form */}
              <form onSubmit={saveName}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: P, marginBottom: 14 }}>Update Display Name</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label style={ll}>Full Name</label>
                    <input style={fi} value={name} onChange={e => setName(e.target.value)} placeholder="Your display name" required />
                  </div>
                  <div>
                    <label style={ll}>Email Address</label>
                    <input style={{ ...fi, color: '#5c3f3f', cursor: 'not-allowed' }} value={user?.email ?? ''} readOnly title="Email cannot be changed here" />
                  </div>
                </div>
                <div style={{ backgroundColor: '#f6f3f2', border: '1px solid #e6bdbc', borderRadius: 8, padding: '8px 12px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined text-sm" style={{ color: '#a16207' }}>info</span>
                  <span style={{ fontSize: 11, color: '#5c3f3f' }}>Email changes require a Firebase Admin Console update. Contact your super admin.</span>
                </div>
                <button type="submit" disabled={savingName}
                  style={{ backgroundColor: P, color: '#fff', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: savingName ? 0.7 : 1 }}>
                  {savingName && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
                  {savingName ? 'Saving...' : 'Save Name'}
                </button>
              </form>
            </div>

            {/* Change password */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 16 }} className="p-6 shadow-sm">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #e6bdbc30' }}>
                <span className="material-symbols-outlined text-xl" style={{ color: P, fontVariationSettings: "'FILL' 1" }}>lock</span>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 15, color: '#1c1b1b', margin: 0 }}>Change Password</h3>
                  <p style={{ fontSize: 12, color: '#5c3f3f', margin: '2px 0 0' }}>Keep your account secure with a strong password.</p>
                </div>
              </div>
              <form onSubmit={changePassword} className="space-y-3">
                <div>
                  <label style={ll}>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showCurrent ? 'text' : 'password'} style={{ ...fi, paddingRight: 40 }} value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Your current password" autoComplete="current-password" required />
                    <button type="button" onClick={() => setShowCurrent(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <span className="material-symbols-outlined text-sm" style={{ color: '#5c3f3f' }}>{showCurrent ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label style={ll}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showNew ? 'text' : 'password'} style={{ ...fi, paddingRight: 40 }} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="At least 6 characters" autoComplete="new-password" required />
                    <button type="button" onClick={() => setShowNew(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <span className="material-symbols-outlined text-sm" style={{ color: '#5c3f3f' }}>{showNew ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  {/* Password strength indicator */}
                  {newPw.length > 0 && (
                    <div style={{ marginTop: 6, display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[1, 2, 3, 4].map(i => {
                        const strength = newPw.length >= 12 ? 4 : newPw.length >= 8 ? 3 : newPw.length >= 6 ? 2 : 1;
                        return <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= strength ? (strength >= 3 ? '#16a34a' : strength === 2 ? '#a16207' : P) : '#e6bdbc' }} />;
                      })}
                      <span style={{ fontSize: 10, color: newPw.length >= 12 ? '#16a34a' : newPw.length >= 8 ? '#a16207' : P, fontWeight: 700, marginLeft: 4, whiteSpace: 'nowrap' }}>
                        {newPw.length >= 12 ? 'Strong' : newPw.length >= 8 ? 'Good' : newPw.length >= 6 ? 'Fair' : 'Weak'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label style={ll}>Confirm New Password</label>
                  <input type="password" style={{ ...fi, borderColor: confirmPw && confirmPw !== newPw ? P : '#e6bdbc' }} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password" autoComplete="new-password" required />
                  {confirmPw && confirmPw !== newPw && (
                    <p style={{ fontSize: 10, color: P, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                      Passwords do not match
                    </p>
                  )}
                </div>
                <button type="submit" disabled={savingPw || (!!confirmPw && confirmPw !== newPw)}
                  style={{ marginTop: 4, backgroundColor: S, color: '#fff', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: savingPw ? 0.7 : 1 }}>
                  {savingPw && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>lock_reset</span>
                  {savingPw ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>

          {/* ── Right column ─────────────────────────────────────────────── */}
          <div style={{ width: 280, flexShrink: 0 }} className="space-y-5">

            {/* Account info */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 16 }} className="p-5 shadow-sm">
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5c3f3f', marginBottom: 14 }}>Account Details</p>
              {[
                { label: 'Role', value: roleLabel, valueColor: roleColor },
                { label: 'Admin UID', value: user?.uid ? user.uid.slice(0, 16) + '…' : '—', valueColor: '#1c1b1b' },
                { label: 'Account Type', value: 'Firebase Auth', valueColor: '#1c1b1b' },
                { label: 'Status', value: 'Active', valueColor: '#16a34a' },
              ].map(({ label, value, valueColor }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #e6bdbc15' }}>
                  <span style={{ fontSize: 11, color: '#5c3f3f', fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: valueColor }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Quick stats */}
            {stats && (
              <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 16 }} className="p-5 shadow-sm">
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5c3f3f', marginBottom: 14 }}>Platform Stats</p>
                <div className="space-y-3">
                  {[
                    { icon: 'quiz', label: 'Questions', value: stats.totalQuestions, color: P },
                    { icon: 'menu_book', label: 'Study Materials', value: stats.totalMaterials, color: S },
                    { icon: 'group', label: 'App Users', value: stats.totalUsers, color: '#16a34a' },
                  ].map(({ icon, label, value, color }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', backgroundColor: '#f6f3f2', borderRadius: 8 }}>
                      <span className="material-symbols-outlined text-base" style={{ color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                      <span style={{ flex: 1, fontSize: 12, color: '#1c1b1b', fontWeight: 600 }}>{label}</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color }}>{value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Danger zone */}
            <div style={{ backgroundColor: '#fff', border: `1px solid ${P}30`, borderRadius: 16 }} className="p-5 shadow-sm">
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: P, marginBottom: 12 }}>Session</p>
              <p style={{ fontSize: 12, color: '#5c3f3f', marginBottom: 12 }}>
                Signing out will end your current admin session and redirect you to the login page.
              </p>
              <button onClick={logout}
                style={{ width: '100%', backgroundColor: '#ffdad9', color: P, border: `1px solid ${P}40`, borderRadius: 8, padding: '9px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                className="hover:bg-[#ffb4ab] transition-colors">
                <span className="material-symbols-outlined text-base">logout</span>
                Sign Out
              </button>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
