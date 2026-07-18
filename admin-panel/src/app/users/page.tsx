"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';

const P = '#b1002c';
const S = '#335ab4';

interface User {
  id: string;
  // Fields written by admin panel (POST /api/users)
  fullName?: string;
  // Fields written by mobile app (name instead of fullName)
  name?: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  vehicleCategory?: string;
  preferredCategory?: string;
  categoryPreferences?: string[];
  readinessScore?: number;
  status?: 'Active' | 'Suspended';
  examsTaken?: number;
  passRate?: number;
  lastActive?: { _seconds: number } | null;
  lastActiveDate?: string;
  points?: number;
  streakCount?: number;
}

interface Stats { active: number; suspended: number; }

const PAGE_SIZE = 10;
const CAT_COLOR: Record<string, string> = { 'A - Motorcycle/Bike': P, 'B - Car / Jeep / Van': S, 'K - Scooter / Moped': '#705d00', 'G - Tractor': '#16a34a' };
const CAT_BG:    Record<string, string> = { 'A - Motorcycle/Bike': '#ffdad9', 'B - Car / Jeep / Van': '#dae1ff', 'K - Scooter / Moped': '#ffe16d', 'G - Tractor': '#dcfce7' };
const SHORT_CAT: Record<string, string> = { 'A - Motorcycle/Bike': 'Cat A', 'B - Car / Jeep / Van': 'Cat B', 'K - Scooter / Moped': 'Cat K', 'G - Tractor': 'Cat G' };

// Normalise fields that differ between admin-created and app-signup users
function displayName(user: User)     { return user.fullName || user.name || '—'; }
function displayPhone(user: User)    { return user.phone || user.phoneNumber || '—'; }
function displayCategory(user: User) {
  // Admin panel stores full string like "A - Motorcycle/Bike"
  // App stores short code like "A" in preferredCategory
  if (user.vehicleCategory) return user.vehicleCategory;
  const cat = user.preferredCategory ?? (user.categoryPreferences?.[0] ?? '');
  const MAP: Record<string, string> = { A: 'A - Motorcycle/Bike', B: 'B - Car / Jeep / Van', K: 'K - Scooter / Moped', G: 'G - Tractor' };
  return MAP[cat] ?? cat ?? '—';
}
function displayStatus(user: User): 'Active' | 'Suspended' { return user.status ?? 'Active'; }

function readinessColor(score: number) {
  if (score >= 75) return { color: '#16a34a', bg: '#dcfce7', label: 'High' };
  if (score >= 50) return { color: '#a16207', bg: '#fef9c3', label: 'Moderate' };
  return { color: '#dc2626', bg: '#fee2e2', label: 'Critical' };
}

function timeAgo(seconds?: number) {
  if (!seconds) return 'Never';
  const diff = Math.floor(Date.now() / 1000 - seconds);
  if (diff < 60)   return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fmt(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);
}

export default function UsersPage() {
  const [users,    setUsers]    = useState<User[]>([]);
  const [stats,    setStats]    = useState<Stats>({ active: 0, suspended: 0 });
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null);

  // Filters
  const [search,          setSearch]          = useState('');
  const [categoryFilter,  setCategoryFilter]  = useState('All');
  const [statusFilter,    setStatusFilter]    = useState('All');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async (searchVal = search) => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (searchVal)                           q.set('search', searchVal);
      if (categoryFilter !== 'All')            q.set('vehicleCategory', categoryFilter);
      if (statusFilter   !== 'All')            q.set('status', statusFilter);
      q.set('page', String(page));
      q.set('pageSize', String(PAGE_SIZE));

      const res = await fetch(`/api/users?${q}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setUsers(data.items ?? []);
      setTotal(data.total ?? 0);
      setStats(data.stats ?? { active: 0, suspended: 0 });
    } catch { showToast('Failed to load users', false); }
    finally { setLoading(false); }
  }, [search, categoryFilter, statusFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [categoryFilter, statusFilter]);

  function handleSearchChange(val: string) {
    setSearch(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => { setPage(1); load(val); }, 400);
  }

  async function toggleStatus(user: User) {
    setToggling(user.id);
    try {
      const current  = displayStatus(user);
      const newStatus = current === 'Active' ? 'Suspended' : 'Active';
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus as 'Active' | 'Suspended' } : u));
        setStats(prev => ({
          active:    newStatus === 'Active'    ? prev.active + 1    : prev.active - 1,
          suspended: newStatus === 'Suspended' ? prev.suspended + 1 : prev.suspended - 1,
        }));
        showToast(`User ${newStatus === 'Active' ? 'activated' : 'suspended'}`);
      } else showToast('Failed to update status', false);
    } finally { setToggling(null); }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Layout title="Users">
      <div className="p-6">

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', top: 72, right: 24, zIndex: 999, backgroundColor: toast.ok ? '#dcfce7' : '#ffdad9', border: `1px solid ${toast.ok ? '#16a34a' : P}`, borderRadius: 10, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
            <span className="material-symbols-outlined text-base" style={{ color: toast.ok ? '#16a34a' : P, fontVariationSettings: "'FILL' 1" }}>{toast.ok ? 'check_circle' : 'error'}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: toast.ok ? '#16a34a' : P }}>{toast.msg}</span>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display font-bold text-[24px] text-[#1c1b1b]">User Management</h1>
            <p className="text-sm text-[#5c3f3f] mt-1">Review, monitor, and manage license candidates.</p>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ border: '1px solid #e6bdbc', borderRadius: 8, backgroundColor: '#f6f3f2' }} className="flex items-center gap-2 px-3 py-1.5">
              <span className="material-symbols-outlined text-[#5c3f3f] text-base">search</span>
              <input className="bg-transparent outline-none text-sm text-[#1c1b1b] placeholder:text-[#5c3f3f]/60 w-44"
                placeholder="Search by name or email..."
                value={search}
                onChange={e => handleSearchChange(e.target.value)} />
            </div>
            <Link href="/users/add"
              style={{ backgroundColor: P, color: '#fff', borderRadius: 8, textDecoration: 'none' }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold hover:opacity-90 shrink-0">
              <span className="material-symbols-outlined text-base">person_add</span>
              Add New User
            </Link>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: 'group',       iconBg: '#dae1ff',  iconColor: S,        badge: `${fmt(stats.active)} active`,    badgeColor: '#16a34a', label: 'TOTAL ACTIVE USERS',    value: fmt(stats.active)    },
            { icon: 'person_off',  iconBg: '#ffdad9',  iconColor: P,        badge: `${stats.suspended} suspended`,   badgeColor: '#dc2626', label: 'SUSPENDED USERS',       value: String(stats.suspended) },
            { icon: 'school',      iconBg: '#ffe16d',  iconColor: '#705d00',badge: `${total} total`,                 badgeColor: '#5c3f3f', label: 'TOTAL REGISTERED',      value: fmt(total)           },
          ].map((card, i) => (
            <div key={i} style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 12 }} className="p-5 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div style={{ backgroundColor: card.iconBg, borderRadius: 10 }} className="w-10 h-10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl" style={{ color: card.iconColor, fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
                </div>
                <span className="text-xs font-bold" style={{ color: card.badgeColor }}>{card.badge}</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#5c3f3f] mb-1">{card.label}</p>
              <h3 className="font-display font-bold text-3xl text-[#1c1b1b]">{card.value}</h3>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 12 }} className="flex items-center gap-3 px-5 py-3 mb-4 shadow-sm flex-wrap">
          <span className="material-symbols-outlined text-[#5c3f3f] text-base">filter_list</span>
          <span className="text-sm font-semibold text-[#5c3f3f]">Filters:</span>
          <select style={{ border: '1px solid #e6bdbc', borderRadius: 8, backgroundColor: '#f6f3f2', color: '#1c1b1b', padding: '6px 12px', fontSize: 13, outline: 'none' }}
            value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="All">All Categories</option>
            <option value="A - Motorcycle/Bike">Category A</option>
            <option value="B - Car / Jeep / Van">Category B</option>
            <option value="K - Scooter / Moped">Category K</option>
            <option value="G - Tractor">Category G</option>
          </select>
          <select style={{ border: '1px solid #e6bdbc', borderRadius: 8, backgroundColor: '#f6f3f2', color: '#1c1b1b', padding: '6px 12px', fontSize: 13, outline: 'none' }}
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
          <button onClick={() => load()} style={{ color: S, border: `1px solid ${S}`, borderRadius: 8, backgroundColor: '#f0f4ff', padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Refresh
          </button>
          {(categoryFilter !== 'All' || statusFilter !== 'All' || search) && (
            <button onClick={() => { setSearch(''); setCategoryFilter('All'); setStatusFilter('All'); }} style={{ color: P }} className="ml-auto text-sm font-bold hover:underline">
              Clear all
            </button>
          )}
        </div>

        {/* Table */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 12 }} className="overflow-hidden shadow-sm mb-6">
          {/* Header */}
          <div style={{ backgroundColor: '#f6f3f2', borderBottom: '1px solid #e6bdbc' }} className="grid grid-cols-7 px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#5c3f3f]">
            <span className="col-span-2">User</span>
            <span>Category</span>
            <span>Last Active</span>
            <span>Readiness</span>
            <span>Exams</span>
            <span>Status</span>
          </div>

          {loading ? (
            [1,2,3,4,5].map(i => (
              <div key={i} className="grid grid-cols-7 items-center px-5 py-4 animate-pulse" style={{ borderBottom: '1px solid #e6bdbc20' }}>
                <div className="col-span-2 flex items-center gap-3">
                  <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#f0eded', flexShrink: 0 }} />
                  <div><div style={{ backgroundColor: '#f0eded', borderRadius: 4, height: 12, width: 100, marginBottom: 4 }} /><div style={{ backgroundColor: '#f0eded', borderRadius: 4, height: 10, width: 140 }} /></div>
                </div>
                {[1,2,3,4,5].map(j => <div key={j} style={{ backgroundColor: '#f0eded', borderRadius: 4, height: 12, width: '70%' }} />)}
              </div>
            ))
          ) : users.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <span className="material-symbols-outlined text-5xl text-[#e6bdbc] mb-3 block" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
              <p className="text-sm font-bold text-[#1c1b1b]">No users found</p>
              <p className="text-xs text-[#5c3f3f] mt-1">Try changing filters or add a new user.</p>
            </div>
          ) : (
            users.map(user => {
              const rd       = readinessColor(user.readinessScore ?? 0);
              const cat      = displayCategory(user);
              const catColor = CAT_COLOR[cat] ?? '#5c3f3f';
              const catBg    = CAT_BG[cat]    ?? '#f0eded';
              const catShort = SHORT_CAT[cat] ?? cat;
              const name     = displayName(user);
              const status   = displayStatus(user);
              const initials = name.split(' ').map((w: string) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
              return (
                <div key={user.id} style={{ borderBottom: '1px solid #e6bdbc20' }} className="grid grid-cols-7 items-center px-5 py-4 hover:bg-[#fdf5f5] transition-colors">
                  {/* User */}
                  <div className="col-span-2 flex items-center gap-3">
                    <div style={{ backgroundColor: '#ffdad9', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="text-xs font-bold" style={{ color: P }}>{initials}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1c1b1b]">{name}</p>
                      <p className="text-xs text-[#5c3f3f]">{user.email}</p>
                    </div>
                  </div>

                  {/* Category */}
                  <span style={{ backgroundColor: catBg, color: catColor, borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 700, width: 'fit-content' }}>
                    {catShort}
                  </span>

                  {/* Last Active */}
                  <span className="text-sm text-[#5c3f3f]">{timeAgo(user.lastActive?._seconds)}</span>

                  {/* Readiness */}
                  <span style={{ backgroundColor: rd.bg, color: rd.color, borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 700, width: 'fit-content' }}>
                    {rd.label} ({user.readinessScore ?? 0}%)
                  </span>

                  {/* Exams */}
                  <span className="text-sm text-[#5c3f3f]">{user.examsTaken ?? 0} <span style={{ fontSize: 10, color: '#5c3f3f' }}>({user.passRate ?? 0}% pass)</span></span>

                  {/* Status Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStatus(user)}
                      disabled={toggling === user.id}
                      className="disabled:opacity-50"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 40, height: 22, borderRadius: 99, backgroundColor: status === 'Active' ? P : '#e6bdbc', position: 'relative', transition: 'background 0.2s' }}>
                        <div style={{ position: 'absolute', top: 2, left: status === 'Active' ? 20 : 2, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </div>
                      <span className="text-sm text-[#5c3f3f]">{status}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination */}
          <div style={{ borderTop: '1px solid #e6bdbc', backgroundColor: '#f6f3f2' }} className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-[#5c3f3f]">
              Showing <strong>{Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)}</strong> of <strong>{total}</strong> users
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ border: '1px solid #e6bdbc', borderRadius: 8 }} className="w-8 h-8 flex items-center justify-center text-[#5c3f3f] hover:bg-[#e6bdbc] disabled:opacity-40">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(5, totalPages || 1) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  style={{ backgroundColor: p === page ? P : 'transparent', color: p === page ? '#fff' : '#5c3f3f', border: `1px solid ${p === page ? P : '#e6bdbc'}`, borderRadius: 8 }}
                  className="w-8 h-8 flex items-center justify-center text-sm font-bold">
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || totalPages === 0}
                style={{ border: '1px solid #e6bdbc', borderRadius: 8 }} className="w-8 h-8 flex items-center justify-center text-[#5c3f3f] hover:bg-[#e6bdbc] disabled:opacity-40">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div style={{ backgroundColor: '#fff', border: `2px solid ${S}30`, borderLeft: `4px solid ${S}`, borderRadius: 12 }} className="p-5">
            <div className="flex items-start gap-4">
              <div style={{ backgroundColor: '#dae1ff', borderRadius: 10 }} className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-xl" style={{ color: S, fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-[#1c1b1b] mb-1">Pro-Tip: Status Toggle</h4>
                <p className="text-xs text-[#5c3f3f]">Click the toggle in the Status column to instantly activate or suspend a user account. Changes are saved to Firestore immediately.</p>
              </div>
            </div>
          </div>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 12 }} className="p-5">
            <div className="flex items-start gap-4">
              <div style={{ backgroundColor: '#ffdad9', borderRadius: 10 }} className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-xl" style={{ color: P, fontVariationSettings: "'FILL' 1" }}>security</span>
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-[#1c1b1b] mb-1">Data Note</h4>
                <p className="text-xs text-[#5c3f3f]">App users are stored in the <code className="bg-[#f6f3f2] px-1 rounded text-xs">app_users</code> collection — separate from admin accounts in <code className="bg-[#f6f3f2] px-1 rounded text-xs">admins</code>.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
