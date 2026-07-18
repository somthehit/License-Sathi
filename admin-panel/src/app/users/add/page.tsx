"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';

const P = '#b1002c';
const S = '#335ab4';

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 44, height: 24, borderRadius: 99,
        backgroundColor: on ? P : '#e6bdbc',
        cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: on ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        backgroundColor: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

// ── Section card ─────────────────────────────────────────────────────────────
function Section({
  icon, iconBg, iconColor, title, subtitle, children,
}: {
  icon: string; iconBg: string; iconColor: string;
  title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 16 }} className="p-6 shadow-sm">
      <div className="flex items-start gap-4 mb-5" style={{ borderBottom: '1px solid #e6bdbc30', paddingBottom: 16 }}>
        <div style={{ backgroundColor: iconBg, borderRadius: 12, width: 44, height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined text-xl" style={{ color: iconColor, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: '#1c1b1b', margin: 0 }}>{title}</h3>
          <p style={{ fontSize: 12, color: '#5c3f3f', margin: '2px 0 0' }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AddUserPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [vehicleCategory, setVehicleCategory] = useState('');
  const [citizenshipId, setCitizenshipId] = useState('');
  const [readinessScore, setReadinessScore] = useState(0);
  const [accountActive, setAccountActive] = useState(true);
  const [sendWelcome, setSendWelcome] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!fullName.trim() || !email.trim()) {
      setError('Full name and email are required.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName, email, password, phone, dob,
          vehicleCategory: vehicleCategory || 'A - Motorcycle/Bike',
          citizenshipId,
          readinessScore,
          status: accountActive ? 'Active' : 'Suspended',
          sendWelcome,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? 'Failed to create user');
        return;
      }
      router.push('/users');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1px solid #e6bdbc', borderRadius: 8,
    padding: '10px 14px', fontSize: 14, color: '#1c1b1b',
    backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600, color: '#5c3f3f', marginBottom: 6,
  };

  return (
    <Layout title="Users">
      <div className="p-6 max-w-3xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-2 text-sm">
          <Link href="/" style={{ color: '#5c3f3f', textDecoration: 'none', fontWeight: 500 }} className="hover:text-[#b1002c] transition-colors">Dashboard</Link>
          <span className="material-symbols-outlined text-base text-[#5c3f3f]">chevron_right</span>
          <Link href="/users" style={{ color: '#5c3f3f', textDecoration: 'none', fontWeight: 500 }} className="hover:text-[#b1002c] transition-colors">Users</Link>
          <span className="material-symbols-outlined text-base text-[#5c3f3f]">chevron_right</span>
          <span style={{ color: P, fontWeight: 700 }}>Add New User</span>
        </div>

        {/* Page heading */}
        <div className="mb-6">
          <h1 className="font-display font-bold text-[28px] text-[#1c1b1b]">Add New User</h1>
          <p className="text-sm text-[#5c3f3f] mt-1">Register a new learner and set initial progress parameters to track their preparation journey.</p>
        </div>

        <div className="space-y-5">

          {/* ── 1. Personal Information ── */}
          <Section
            icon="person_add"
            iconBg="#ffdad9"
            iconColor={P}
            title="Personal Information"
            subtitle="Essential identification details for the learner profile."
          >
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Biraj Maharjan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  style={inputStyle}
                  placeholder="learner@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="mb-4">
              <label style={labelStyle}>
                Password <span style={{ color: P }}>*</span>
                <span style={{ fontSize: 10, fontWeight: 400, color: '#5c3f3f', marginLeft: 6 }}>— used to log into the mobile app</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  style={{ ...inputStyle, paddingRight: 44 }}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <span className="material-symbols-outlined text-base" style={{ color: '#5c3f3f' }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <p style={{ fontSize: 10, color: '#5c3f3f', marginTop: 4 }}>
                Share this password with the learner so they can log in to the License Sathi mobile app.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Phone Number</label>
                <div className="flex gap-2">
                  <div style={{ border: '1px solid #e6bdbc', borderRadius: 8, padding: '10px 12px', backgroundColor: '#f6f3f2', fontSize: 13, fontWeight: 700, color: '#5c3f3f', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    +977
                  </div>
                  <input
                    type="tel"
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="98XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Date of Birth</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>
            </div>
          </Section>

          {/* ── 2. License Details ── */}
          <Section
            icon="directions_car"
            iconBg="#dae1ff"
            iconColor={S}
            title="License Details"
            subtitle="Select the target vehicle category and provide official ID."
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Vehicle Category</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={vehicleCategory}
                  onChange={(e) => setVehicleCategory(e.target.value)}
                >
                  <option value="">Select category</option>
                  <option value="A">A — Motorcycle / Bike</option>
                  <option value="B">B — Car / Jeep / Van</option>
                  <option value="K">K — Scooter / Moped</option>
                  <option value="G">G — Tractor</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Citizenship / ID Number</label>
                <input
                  style={inputStyle}
                  placeholder="Enter registration or ID number"
                  value={citizenshipId}
                  onChange={(e) => setCitizenshipId(e.target.value)}
                />
              </div>
            </div>
          </Section>

          {/* ── 3. Initial Progress & Account ── */}
          <Section
            icon="task_alt"
            iconBg="#ffe16d"
            iconColor="#705d00"
            title="Initial Progress & Account"
            subtitle="Configure start parameters and account activation."
          >
            {/* Readiness score slider */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label style={labelStyle}>Initial Readiness Score (%)</label>
                <span style={{ fontSize: 13, fontWeight: 700, color: P }}>{readinessScore}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={readinessScore}
                onChange={(e) => setReadinessScore(Number(e.target.value))}
                style={{ width: '100%', accentColor: P, cursor: 'pointer' }}
              />
              <div className="flex justify-between mt-1">
                <span style={{ fontSize: 10, color: '#5c3f3f' }}>0%</span>
                <span style={{ fontSize: 10, color: '#5c3f3f' }}>100%</span>
              </div>
            </div>

            {/* Account Status + Send Welcome Email */}
            <div className="grid grid-cols-2 gap-4">
              <div style={{ border: '1px solid #e6bdbc', borderRadius: 10, padding: '14px 16px' }} className="flex items-center justify-between">
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1c1b1b', margin: 0 }}>Account Status</p>
                  <p style={{ fontSize: 11, color: '#5c3f3f', margin: '2px 0 0' }}>Toggle active access immediately.</p>
                </div>
                <Toggle on={accountActive} onChange={setAccountActive} />
              </div>
              <div style={{ border: '1px solid #e6bdbc', borderRadius: 10, padding: '14px 16px' }} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="welcome"
                  checked={sendWelcome}
                  onChange={(e) => setSendWelcome(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: P, flexShrink: 0, cursor: 'pointer' }}
                />
                <label htmlFor="welcome" style={{ cursor: 'pointer' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1c1b1b', margin: 0 }}>Send Welcome Email</p>
                  <p style={{ fontSize: 11, color: '#5c3f3f', margin: '2px 0 0' }}>Sends credentials and start guide.</p>
                </label>
              </div>
            </div>
          </Section>

        </div>

        {/* ── Sticky footer ── */}
        <div
          style={{
            position: 'sticky', bottom: 0,
            backgroundColor: '#fcf9f8',
            borderTop: '1px solid #e6bdbc',
            padding: '14px 0',
            display: 'flex', justifyContent: 'flex-end', gap: 12,
            marginTop: 24,
          }}
        >
          <Link
            href="/users"
            style={{ border: '1px solid #e6bdbc', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, color: '#5c3f3f', backgroundColor: '#f6f3f2', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            className="hover:border-[#b1002c] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            style={{ backgroundColor: P, color: '#fff', borderRadius: 8, padding: '10px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, border: 'none' }}
            className="hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
            Create User
          </button>
        </div>

      </div>
    </Layout>
  );
}
