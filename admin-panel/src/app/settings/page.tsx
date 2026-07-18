"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';

const P = '#b1002c';
const S = '#335ab4';

type Section = 'General Settings' | 'Security & Auth' | 'Notifications' | 'Localization' | 'Database & Backups' | 'Admin Users';

const SECTIONS: Section[] = ['General Settings', 'Security & Auth', 'Notifications', 'Localization', 'Database & Backups', 'Admin Users'];
const SECTION_ICONS: Record<Section, string> = {
  'General Settings': 'tune',
  'Security & Auth': 'shield',
  'Notifications': 'notifications',
  'Localization': 'language',
  'Database & Backups': 'database',
  'Admin Users': 'manage_accounts',
};

interface Settings {
  appName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  version: string;
  passingScore: number;
  examDuration: number;
  questionsPerExam: number;
  twoFaEnforced: boolean;
  ipWhitelistEnabled: boolean;
  ipWhitelist: string;
  maxLoginAttempts: number;
  notifyCriticalAlerts: boolean;
  notifyNewUsers: boolean;
  notifyExamCompletion: boolean;
  notifyAdminEmail: string;
  defaultLanguage: string;
  timezone: string;
  dateFormat: string;
  // About section
  aboutDeveloperName: string;
  aboutDeveloperRole: string;
  aboutDeveloperEmail: string;
  aboutAppVersion: string;
  aboutAppPlatform: string;
  aboutAppRegion: string;
  officialLinks: OfficialLink[];
}

interface OfficialLink {
  id: string;
  label: string;
  url: string;
  icon: string;
}

const DEFAULT_LINKS: OfficialLink[] = [
  { id: '1', label: 'Dept. of Transport Management (DOTM)', url: 'https://www.dotm.gov.np', icon: 'directions_bus' },
  { id: '2', label: 'DOTM Driving Licence Info', url: 'https://www.dotm.gov.np/en/driving-license/', icon: 'badge' },
  { id: '3', label: 'Nepal Road Safety Council', url: 'https://www.nrsc.gov.np', icon: 'health_and_safety' },
  { id: '4', label: 'Vehicle Registration & Renewal', url: 'https://www.dotm.gov.np/en/vehicle-registration/', icon: 'car_rental' },
  { id: '5', label: 'Nepal Traffic Police', url: 'https://www.nepalpolice.gov.np/traffic-police', icon: 'local_police' },
  { id: '6', label: 'Nepal Police Official Portal', url: 'https://www.nepalpolice.gov.np', icon: 'shield' },
];

const DEFAULTS: Settings = {
  appName: 'License Sathi', supportEmail: 'support@licensesathi.com.np',
  maintenanceMode: false, version: '2.4.1',
  passingScore: 60, examDuration: 1800, questionsPerExam: 50,
  twoFaEnforced: false, ipWhitelistEnabled: false, ipWhitelist: '', maxLoginAttempts: 5,
  notifyCriticalAlerts: true, notifyNewUsers: false, notifyExamCompletion: true,
  notifyAdminEmail: 'support@licensesathi.com.np',
  defaultLanguage: 'en', timezone: 'Asia/Kathmandu', dateFormat: 'DD/MM/YYYY',
  aboutDeveloperName: 'Som The',
  aboutDeveloperRole: 'Full-Stack Developer',
  aboutDeveloperEmail: 'hitsomthehit@gmail.com',
  aboutAppVersion: 'v1.0.0',
  aboutAppPlatform: 'Android + Web Admin',
  aboutAppRegion: 'Nepal 🇳🇵',
  officialLinks: DEFAULT_LINKS,
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!checked)}
      style={{ width: 44, height: 24, borderRadius: 99, backgroundColor: checked ? P : '#e6bdbc', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: checked ? 23 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  );
}

const iStyle: React.CSSProperties = { border: '1px solid #e6bdbc', borderRadius: 8, backgroundColor: '#f6f3f2', padding: '8px 12px', fontSize: 14, color: '#1c1b1b', outline: 'none', width: '100%' };
const lStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#5c3f3f', marginBottom: 6 };

// ── Admin Users Section ───────────────────────────────────────────────────────
interface AdminUser { id: string; name: string; email: string; role: string; status: string; createdAt?: string; }

function AdminUsersSection({ currentUserId }: { currentUserId?: string }) {
  const [admins,       setAdmins]       = useState<AdminUser[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [removing,     setRemoving]     = useState<string | null>(null);
  const [toast,        setToast]        = useState<{ msg: string; ok: boolean } | null>(null);
  const [form,         setForm]         = useState({ name: '', email: '', password: '', role: 'admin' });
  const [showPassword, setShowPassword] = useState(false);

  const showMsg = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin-users');
      if (res.ok) { const d = await res.json(); setAdmins(d.items ?? []); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { showMsg('All fields are required', false); return; }
    if (form.password.length < 6) { showMsg('Password must be at least 6 characters', false); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { showMsg(data.error ?? 'Failed to create admin', false); return; }
      showMsg('Admin user created successfully');
      setForm({ name: '', email: '', password: '', role: 'admin' });
      setShowForm(false);
      load();
    } finally { setSaving(false); }
  }

  async function removeAdmin(id: string) {
    if (!confirm('Remove this admin? They will lose all access immediately.')) return;
    setRemoving(id);
    try {
      const res = await fetch(`/api/admin-users/${id}`, { method: 'DELETE' });
      if (res.ok) { showMsg('Admin access removed'); load(); }
      else showMsg('Failed to remove admin', false);
    } finally { setRemoving(null); }
  }

  async function toggleStatus(admin: AdminUser) {
    const newStatus = admin.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/admin-users/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) { showMsg(`Admin ${newStatus === 'active' ? 'activated' : 'deactivated'}`); load(); }
      else showMsg('Failed to update status', false);
    } catch { showMsg('Network error', false); }
  }

  const fi: React.CSSProperties = { width: '100%', border: '1px solid #e6bdbc', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#1c1b1b', backgroundColor: '#f6f3f2', outline: 'none', boxSizing: 'border-box' };
  const ll: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#5c3f3f', marginBottom: 5 };

  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 16 }} className="p-6 shadow-sm">
      {/* Toast */}
      {toast && (
        <div style={{ backgroundColor: toast.ok ? '#dcfce7' : '#ffdad9', border: `1px solid ${toast.ok ? '#16a34a' : P}40`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined text-sm" style={{ color: toast.ok ? '#16a34a' : P, fontVariationSettings: "'FILL' 1" }}>{toast.ok ? 'check_circle' : 'error'}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: toast.ok ? '#16a34a' : P }}>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-5" style={{ borderBottom: '1px solid #e6bdbc30', paddingBottom: 16 }}>
        <span className="material-symbols-outlined text-xl" style={{ color: P, fontVariationSettings: "'FILL' 1" }}>manage_accounts</span>
        <div className="flex-1">
          <h3 className="font-display font-bold text-base text-[#1c1b1b]">Admin Users</h3>
          <p className="text-xs text-[#5c3f3f] mt-0.5">Manage who can access this admin panel.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          style={{ backgroundColor: P, color: '#fff', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined text-base">{showForm ? 'close' : 'person_add'}</span>
          {showForm ? 'Cancel' : 'Add Admin'}
        </button>
      </div>

      {/* Add Admin form */}
      {showForm && (
        <form onSubmit={createAdmin} style={{ backgroundColor: '#fdf5f5', border: '1px solid #e6bdbc', borderRadius: 12, padding: '20px', marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: P, marginBottom: 14 }}>New Admin Account</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label style={ll}>Full Name</label>
              <input style={fi} placeholder="e.g. Rajesh Sharma" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <label style={ll}>Email Address</label>
              <input type="email" style={fi} placeholder="admin@licensesathi.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div>
              <label style={ll}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} style={{ ...fi, paddingRight: 40 }} placeholder="Min. 6 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined text-sm" style={{ color: '#5c3f3f' }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
            <div>
              <label style={ll}>Role</label>
              <select style={fi} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving}
            style={{ backgroundColor: P, color: '#fff', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
            {saving && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
            {saving ? 'Creating...' : 'Create Admin Account'}
          </button>
        </form>
      )}

      {/* Admin list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} style={{ backgroundColor: '#f6f3f2', borderRadius: 10, height: 56 }} className="animate-pulse" />)}
        </div>
      ) : admins.length === 0 ? (
        <p className="text-sm text-[#5c3f3f] text-center py-6">No admin users found.</p>
      ) : (
        <div className="space-y-2">
          {admins.map(admin => {
            const isSelf = admin.id === currentUserId;
            const isActive = admin.status === 'active';
            return (
              <div key={admin.id} style={{ border: '1px solid #e6bdbc', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, backgroundColor: isSelf ? '#fdf5f5' : '#fff' }}>
                {/* Avatar */}
                <div style={{ width: 38, height: 38, borderRadius: '50%', backgroundColor: '#ffdad9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: P }}>
                    {admin.name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() ?? '?'}
                  </span>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1c1b1b', margin: 0 }}>{admin.name}</p>
                    {isSelf && <span style={{ backgroundColor: '#dae1ff', color: S, fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '1px 7px' }}>YOU</span>}
                    <span style={{ backgroundColor: admin.role === 'super_admin' ? '#ffe16d' : '#f6f3f2', color: admin.role === 'super_admin' ? '#705d00' : '#5c3f3f', fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '1px 7px' }}>
                      {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: '#5c3f3f', margin: '1px 0 0' }}>{admin.email}</p>
                </div>
                {/* Status badge */}
                <span style={{ backgroundColor: isActive ? '#dcfce7' : '#fee2e2', color: isActive ? '#16a34a' : '#dc2626', borderRadius: 99, fontSize: 11, fontWeight: 700, padding: '2px 10px', flexShrink: 0 }}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
                {/* Actions */}
                {!isSelf && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => toggleStatus(admin)} title={isActive ? 'Deactivate' : 'Activate'}
                      style={{ border: '1px solid #e6bdbc', borderRadius: 7, padding: '5px 8px', backgroundColor: '#f6f3f2', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <span className="material-symbols-outlined text-sm" style={{ color: isActive ? '#a16207' : '#16a34a' }}>{isActive ? 'block' : 'check_circle'}</span>
                    </button>
                    <button onClick={() => removeAdmin(admin.id)} disabled={removing === admin.id} title="Remove access"
                      style={{ border: '1px solid #e6bdbc', borderRadius: 7, padding: '5px 8px', backgroundColor: '#ffdad9', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: removing === admin.id ? 0.5 : 1 }}>
                      <span className="material-symbols-outlined text-sm" style={{ color: P }}>{removing === admin.id ? 'progress_activity' : 'person_remove'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Note */}
      <div style={{ backgroundColor: '#f6f3f2', border: '1px solid #e6bdbc', borderRadius: 8, padding: '10px 14px', marginTop: 16, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span className="material-symbols-outlined text-sm" style={{ color: S, marginTop: 1, flexShrink: 0 }}>info</span>
        <p style={{ fontSize: 11, color: '#5c3f3f', margin: 0 }}>
          Removing an admin revokes their panel access immediately but keeps their Firebase account. You cannot remove or deactivate your own account.
        </p>
      </div>
    </div>
  );
}

function SectionCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 16 }} className="p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5" style={{ borderBottom: '1px solid #e6bdbc30', paddingBottom: 16 }}>
        <span className="material-symbols-outlined text-xl" style={{ color: P, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        <h3 className="font-display font-bold text-base text-[#1c1b1b]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ── About / Developer Section ─────────────────────────────────────────────────
function AboutSection({
  settings,
  set,
  P,
  S,
}: {
  settings: Settings;
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  P: string;
  S: string;
}) {
  const fi: React.CSSProperties = {
    width: '100%', border: '1px solid #e6bdbc', borderRadius: 8,
    padding: '8px 12px', fontSize: 13, color: '#1c1b1b',
    backgroundColor: '#f6f3f2', outline: 'none', boxSizing: 'border-box',
  };
  const ll: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.05em',
    color: '#5c3f3f', marginBottom: 5,
  };

  const links = settings.officialLinks ?? DEFAULT_LINKS;

  function updateLink(id: string, field: keyof OfficialLink, value: string) {
    set('officialLinks', links.map(l => l.id === id ? { ...l, [field]: value } : l));
  }

  function addLink() {
    const newId = Date.now().toString();
    set('officialLinks', [...links, { id: newId, label: '', url: 'https://', icon: 'link' }]);
  }

  function removeLink(id: string) {
    set('officialLinks', links.filter(l => l.id !== id));
  }

  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 16, padding: 24 }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #e6bdbc30', paddingBottom: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="material-symbols-outlined text-xl" style={{ color: P, fontVariationSettings: "'FILL' 1" }}>info</span>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: 15, color: '#1c1b1b', margin: 0 }}>About License Sathi</h3>
          <p style={{ fontSize: 12, color: '#5c3f3f', margin: '2px 0 0' }}>Edit app info, developer contact &amp; official links</p>
        </div>
      </div>

      {/* Developer + App Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Developer */}
        <div style={{ backgroundColor: '#fdf5f5', border: '1px solid #e6bdbc', borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: P, marginBottom: 12 }}>Developer</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <label style={ll}>Name</label>
              <input style={fi} value={settings.aboutDeveloperName} onChange={e => set('aboutDeveloperName', e.target.value)} placeholder="e.g. Som The" />
            </div>
            <div>
              <label style={ll}>Role</label>
              <input style={fi} value={settings.aboutDeveloperRole} onChange={e => set('aboutDeveloperRole', e.target.value)} placeholder="e.g. Full-Stack Developer" />
            </div>
            <div>
              <label style={ll}>Email</label>
              <input type="email" style={fi} value={settings.aboutDeveloperEmail} onChange={e => set('aboutDeveloperEmail', e.target.value)} placeholder="e.g. dev@example.com" />
            </div>
          </div>
        </div>

        {/* App Info */}
        <div style={{ backgroundColor: '#f5f8ff', border: '1px solid #c7d3f5', borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: S, marginBottom: 12 }}>App Info</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <label style={{ ...ll, color: S }}>Version</label>
              <input style={fi} value={settings.aboutAppVersion} onChange={e => set('aboutAppVersion', e.target.value)} placeholder="e.g. v1.0.0" />
            </div>
            <div>
              <label style={{ ...ll, color: S }}>Platform</label>
              <input style={fi} value={settings.aboutAppPlatform} onChange={e => set('aboutAppPlatform', e.target.value)} placeholder="e.g. Android + Web Admin" />
            </div>
            <div>
              <label style={{ ...ll, color: S }}>Region</label>
              <input style={fi} value={settings.aboutAppRegion} onChange={e => set('aboutAppRegion', e.target.value)} placeholder="e.g. Nepal 🇳🇵" />
            </div>
          </div>
        </div>
      </div>

      {/* Official Links */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5c3f3f', margin: 0 }}>Official Links</p>
          <button onClick={addLink}
            style={{ backgroundColor: P, color: '#fff', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span className="material-symbols-outlined text-sm">add</span>Add Link
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {links.map((link) => (
            <div key={link.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 8, alignItems: 'center', padding: '10px 12px', border: '1px solid #e6bdbc', borderRadius: 10, backgroundColor: '#f6f3f2' }}>
              <input
                style={{ ...fi, backgroundColor: '#fff' }}
                placeholder="Label (e.g. DOTM)"
                value={link.label}
                onChange={e => updateLink(link.id, 'label', e.target.value)}
              />
              <input
                style={{ ...fi, backgroundColor: '#fff' }}
                placeholder="https://..."
                value={link.url}
                onChange={e => updateLink(link.id, 'url', e.target.value)}
              />
              <input
                style={{ ...fi, width: 120, backgroundColor: '#fff' }}
                placeholder="icon name"
                value={link.icon}
                onChange={e => updateLink(link.id, 'icon', e.target.value)}
                title="Material Symbols icon name (e.g. directions_bus)"
              />
              <button onClick={() => removeLink(link.id)}
                style={{ border: 'none', background: '#ffdad9', borderRadius: 7, padding: '7px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined text-sm" style={{ color: P }}>delete</span>
              </button>
            </div>
          ))}
          {links.length === 0 && (
            <p style={{ fontSize: 12, color: '#5c3f3f', textAlign: 'center', padding: '16px 0' }}>No links yet. Click &quot;Add Link&quot; to add one.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>('General Settings');
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [original, setOriginal] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [backupStatus, setBackupStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [logs] = useState([
    { icon: 'check_circle', color: '#16a34a', title: 'Daily Backup Successful', date: 'Today 02:00 AM' },
    { icon: 'sync', color: S, title: 'Question Bank Re-indexed', date: 'Yesterday 06:45 PM' },
    { icon: 'check_circle', color: '#16a34a', title: 'Database Migration Completed', date: '2 days ago' },
  ]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        const merged = { ...DEFAULTS, ...data };
        setSettings(merged);
        setOriginal(merged);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const data = await res.json();
        const merged = { ...DEFAULTS, ...data };
        setSettings(merged); setOriginal(merged);
        showToast('Settings saved successfully');
      } else {
        const err = await res.json();
        showToast(err.error ?? 'Failed to save', false);
      }
    } catch { showToast('Network error', false); }
    finally { setSaving(false); }
  }

  function discard() { setSettings(original); showToast('Changes discarded'); }

  const isDirty = JSON.stringify(settings) !== JSON.stringify(original);

  async function triggerBackup() {
    setBackupStatus('running');
    await new Promise(r => setTimeout(r, 2200));
    setBackupStatus('done');
    showToast('Backup completed successfully');
    setTimeout(() => setBackupStatus('idle'), 4000);
  }

  if (loading) {
    return (
      <Layout title="Settings">
        <div className="p-6 flex items-center justify-center h-64">
          <span className="material-symbols-outlined animate-spin text-3xl" style={{ color: P }}>progress_activity</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Settings">
      <div className="p-6">
        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', top: 72, right: 24, zIndex: 999, backgroundColor: toast.ok ? '#dcfce7' : '#ffdad9', border: `1px solid ${toast.ok ? '#16a34a' : P}`, borderRadius: 10, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
            <span className="material-symbols-outlined text-base" style={{ color: toast.ok ? '#16a34a' : P, fontVariationSettings: "'FILL' 1" }}>{toast.ok ? 'check_circle' : 'error'}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: toast.ok ? '#16a34a' : P }}>{toast.msg}</span>
          </div>
        )}

        <div className="mb-6">
          <h1 className="font-display font-bold text-[24px] text-[#1c1b1b]">System Settings</h1>
          <p className="text-sm text-[#5c3f3f] mt-1">Configure global application parameters and security protocols.</p>
        </div>

        <div className="flex gap-6">
          {/* Left nav */}
          <div style={{ width: 210, flexShrink: 0 }}>
            <div className="space-y-1">
              {SECTIONS.map(s => (
                <button key={s} onClick={() => setActiveSection(s)}
                  style={{ backgroundColor: activeSection === s ? '#ffdad9' : 'transparent', color: activeSection === s ? P : '#5c3f3f', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-semibold text-left transition-colors hover:bg-[#f0eded]">
                  <span className="material-symbols-outlined text-base">{SECTION_ICONS[s]}</span>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Content panels */}
          <div className="flex-1 space-y-5">

            {/* ── General Settings ── */}
            {activeSection === 'General Settings' && (
              <SectionCard icon="tune" title="General Settings">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label style={lStyle}>Application Name</label>
                    <input style={iStyle} value={settings.appName} onChange={e => set('appName', e.target.value)} />
                  </div>
                  <div>
                    <label style={lStyle}>Support Email</label>
                    <input type="email" style={iStyle} value={settings.supportEmail} onChange={e => set('supportEmail', e.target.value)} />
                  </div>
                </div>
                <div style={{ border: '1px solid #e6bdbc', borderRadius: 10, padding: '14px 16px' }} className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-bold text-[#1c1b1b]">Maintenance Mode</p>
                    <p className="text-xs text-[#5c3f3f]">Disables app access for regular users during updates.</p>
                  </div>
                  <Toggle checked={settings.maintenanceMode} onChange={v => set('maintenanceMode', v)} />
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label style={lStyle}>Passing Score (%)</label>
                    <input type="number" min={0} max={100} style={iStyle} value={settings.passingScore} onChange={e => set('passingScore', Number(e.target.value))} />
                  </div>
                  <div>
                    <label style={lStyle}>Exam Duration (secs)</label>
                    <input type="number" style={iStyle} value={settings.examDuration} onChange={e => set('examDuration', Number(e.target.value))} />
                  </div>
                  <div>
                    <label style={lStyle}>Questions Per Exam</label>
                    <input type="number" style={iStyle} value={settings.questionsPerExam} onChange={e => set('questionsPerExam', Number(e.target.value))} />
                  </div>
                </div>
                <div>
                  <label style={lStyle}>App Version</label>
                  <div className="flex gap-2">
                    <input style={{ ...iStyle, flex: 1, color: '#5c3f3f' }} value={settings.version} readOnly />
                    <button style={{ backgroundColor: S, color: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>Check Updates</button>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* ── Security & Auth ── */}
            {activeSection === 'Security & Auth' && (
              <SectionCard icon="shield" title="Security & Authentication">
                <div style={{ border: '1px solid #e6bdbc', borderRadius: 10, padding: '14px 16px' }} className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-bold text-[#1c1b1b]">2FA Enforcement</p>
                    <p className="text-xs text-[#5c3f3f]">Require all admin accounts to use Two-Factor Authentication.</p>
                  </div>
                  <Toggle checked={settings.twoFaEnforced} onChange={v => set('twoFaEnforced', v)} />
                </div>
                <p style={{ color: P, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Login Security</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label style={lStyle}>IP Whitelisting</label>
                      <Toggle checked={settings.ipWhitelistEnabled} onChange={v => set('ipWhitelistEnabled', v)} />
                    </div>
                    <textarea rows={3} placeholder="Enter IP addresses (one per line)"
                      style={{ ...iStyle, resize: 'none' }}
                      value={settings.ipWhitelist}
                      disabled={!settings.ipWhitelistEnabled}
                      onChange={e => set('ipWhitelist', e.target.value)} />
                  </div>
                  <div>
                    <label style={lStyle}>Max Login Attempts</label>
                    <input type="number" min={1} max={20} style={iStyle}
                      value={settings.maxLoginAttempts}
                      onChange={e => set('maxLoginAttempts', Number(e.target.value))} />
                    <p style={{ fontSize: 10, color: '#5c3f3f', marginTop: 4 }}>Account locks after this many consecutive failures.</p>
                  </div>
                </div>
                <div style={{ border: '1px solid #e6bdbc', borderRadius: 10, padding: '10px 16px' }} className="flex items-center justify-between">
                  <button style={{ border: '1px solid #e6bdbc', borderRadius: 8, padding: '6px 14px', fontSize: 13, color: '#1c1b1b', backgroundColor: '#f6f3f2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="material-symbols-outlined text-sm">history</span>Security Audit Log
                  </button>
                  <div className="text-right">
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#5c3f3f' }}>Last Security Scan</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#1c1b1b' }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* ── Notifications ── */}
            {activeSection === 'Notifications' && (
              <SectionCard icon="notifications" title="Notification Settings">
                <div>
                  <label style={lStyle}>Admin Notification Email</label>
                  <input type="email" style={{ ...iStyle, marginBottom: 16 }}
                    value={settings.notifyAdminEmail}
                    onChange={e => set('notifyAdminEmail', e.target.value)} />
                </div>
                {[
                  { key: 'notifyCriticalAlerts' as const, title: 'Critical System Alerts', desc: 'Email for server issues or security breaches.' },
                  { key: 'notifyNewUsers' as const, title: 'New User Registrations', desc: 'Daily digest of new signups and verifications.' },
                  { key: 'notifyExamCompletion' as const, title: 'Exam Completion Reports', desc: 'Summary when a learner completes an exam.' },
                ].map(({ key, title, desc }) => (
                  <div key={key} style={{ borderBottom: '1px solid #e6bdbc20' }} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-bold text-[#1c1b1b]">{title}</p>
                      <p className="text-xs text-[#5c3f3f]">{desc}</p>
                    </div>
                    <Toggle checked={settings[key]} onChange={v => set(key, v)} />
                  </div>
                ))}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-bold text-[#1c1b1b]">Push Notification API (FCM)</p>
                    <p className="text-xs text-[#5c3f3f]">Firebase Cloud Messaging integration status.</p>
                  </div>
                  <span style={{ backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: 99, fontSize: 11, fontWeight: 700, padding: '3px 10px' }}>ACTIVE</span>
                </div>
              </SectionCard>
            )}

            {/* ── Localization ── */}
            {activeSection === 'Localization' && (
              <SectionCard icon="language" title="Localization & Region">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label style={lStyle}>Default Language</label>
                    <select style={{ ...iStyle, cursor: 'pointer' }} value={settings.defaultLanguage} onChange={e => set('defaultLanguage', e.target.value)}>
                      <option value="en">English</option>
                      <option value="np">Nepali (नेपाली)</option>
                    </select>
                  </div>
                  <div>
                    <label style={lStyle}>Timezone</label>
                    <select style={{ ...iStyle, cursor: 'pointer' }} value={settings.timezone} onChange={e => set('timezone', e.target.value)}>
                      <option value="Asia/Kathmandu">Asia/Kathmandu (NPT +5:45)</option>
                      <option value="UTC">UTC</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                    </select>
                  </div>
                  <div>
                    <label style={lStyle}>Date Format</label>
                    <select style={{ ...iStyle, cursor: 'pointer' }} value={settings.dateFormat} onChange={e => set('dateFormat', e.target.value)}>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
                <div style={{ backgroundColor: '#f6f3f2', border: '1px solid #e6bdbc', borderRadius: 10, padding: '14px 16px' }}>
                  <p className="text-xs font-bold text-[#5c3f3f] mb-2">Supported Languages</p>
                  <div className="flex gap-2 flex-wrap">
                    {['English', 'Nepali (नेपाली)'].map(lang => (
                      <span key={lang} style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 99, padding: '3px 12px', fontSize: 12, fontWeight: 600, color: '#1c1b1b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-outlined text-sm" style={{ color: '#16a34a' }}>check_circle</span>{lang}
                      </span>
                    ))}
                  </div>
                </div>
              </SectionCard>
            )}

            {/* ── Database & Backups ── */}
            {activeSection === 'Database & Backups' && (
              <SectionCard icon="database" title="Database & Backups">
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div style={{ backgroundColor: '#f6f3f2', border: '1px solid #e6bdbc', borderRadius: 12 }} className="p-4">
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#5c3f3f', marginBottom: 4 }}>Automated Backups</p>
                    <div className="flex items-center justify-between">
                      <p style={{ fontWeight: 700, fontSize: 15, color: '#1c1b1b' }}>Daily at 02:00 AM</p>
                      <span className="material-symbols-outlined text-[#5c3f3f]">schedule</span>
                    </div>
                    <button style={{ border: '1px solid #e6bdbc', borderRadius: 8, backgroundColor: '#fff', width: '100%', marginTop: 12, padding: '7px', fontSize: 13, fontWeight: 600, color: '#1c1b1b', cursor: 'pointer' }}>
                      Adjust Frequency
                    </button>
                  </div>
                  <div style={{ backgroundColor: P, borderRadius: 12, color: '#fff' }} className="p-4">
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', opacity: 0.8, marginBottom: 4 }}>Manual Backup</p>
                    <p style={{ fontSize: 13, opacity: 0.9, marginBottom: 12 }}>Trigger a full backup now to secure current data.</p>
                    <button
                      onClick={triggerBackup}
                      disabled={backupStatus === 'running'}
                      style={{ border: '2px solid rgba(255,255,255,0.6)', borderRadius: 8, width: '100%', padding: '7px', fontSize: 13, fontWeight: 700, color: '#fff', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      className="hover:bg-white/10 transition-colors disabled:opacity-60"
                    >
                      {backupStatus === 'running' && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
                      {backupStatus === 'running' ? 'Backing up...' : backupStatus === 'done' ? '✔ Done' : 'Backup Now'}
                    </button>
                  </div>
                </div>
                <div style={{ border: '1px solid #e6bdbc', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ backgroundColor: '#f6f3f2', borderBottom: '1px solid #e6bdbc', padding: '10px 16px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1c1b1b' }}>System Health Logs</span>
                    <span style={{ fontSize: 11, color: '#5c3f3f' }}>Last activities</span>
                  </div>
                  {logs.map((log, i) => (
                    <div key={i} style={{ borderBottom: '1px solid #e6bdbc20', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="material-symbols-outlined text-base" style={{ color: log.color, fontVariationSettings: "'FILL' 1" }}>{log.icon}</span>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#1c1b1b', margin: 0 }}>{log.title}</p>
                          <p style={{ fontSize: 10, color: '#5c3f3f', margin: 0 }}>{log.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* ── Admin Users ── */}
            {activeSection === 'Admin Users' && (
              <AdminUsersSection currentUserId={user?.uid} />
            )}

            {/* ── About / Developer ── (editable, always visible at bottom) */}
            <AboutSection settings={settings} set={set} P={P} S={S} />

            {/* ── Sticky footer ── */}
            <div style={{ position: 'sticky', bottom: 0, backgroundColor: '#fcf9f8', borderTop: '1px solid #e6bdbc', padding: '12px 0', display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <button
                onClick={discard}
                disabled={!isDirty || saving}
                style={{ border: '1px solid #e6bdbc', borderRadius: 8, padding: '8px 20px', fontSize: 14, fontWeight: 600, color: '#5c3f3f', backgroundColor: '#f6f3f2', cursor: isDirty ? 'pointer' : 'default', opacity: isDirty ? 1 : 0.5 }}
              >
                Discard Changes
              </button>
              <button
                onClick={save}
                disabled={!isDirty || saving}
                style={{ backgroundColor: P, color: '#fff', borderRadius: 8, padding: '8px 24px', fontSize: 14, fontWeight: 700, border: 'none', cursor: isDirty ? 'pointer' : 'default', opacity: isDirty ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: 8 }}
                className="hover:opacity-90 transition-opacity disabled:cursor-not-allowed"
              >
                {saving && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
                {saving ? 'Saving...' : 'Save All Settings'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
