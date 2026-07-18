"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';

const P = '#b1002c';
const S = '#335ab4';

const TYPE_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  info:    { label: 'Info',    color: S,        bg: '#dae1ff', icon: 'info'    },
  warning: { label: 'Warning', color: '#a16207', bg: '#fef9c3', icon: 'warning' },
  urgent:  { label: 'Urgent',  color: P,        bg: '#ffdad9', icon: 'emergency' },
  update:  { label: 'Update',  color: '#16a34a', bg: '#dcfce7', icon: 'system_update' },
};

const STATUS_META: Record<string, { color: string; bg: string }> = {
  Published: { color: '#16a34a', bg: '#dcfce7' },
  Draft:     { color: '#a16207', bg: '#fef9c3' },
  Archived:  { color: '#5c3f3f', bg: '#f0eded' },
};

interface Notice {
  id: string;
  titleEn: string;
  titleNp?: string;
  contentEn?: string;
  contentNp?: string;
  type: string;
  targetCategory?: string[];
  status: string;
  publishedAt?: { _seconds: number } | null;
  expiresAt?: string | null;
  createdAt?: { _seconds: number };
}

interface Stats { published: number; draft: number; }

const EMPTY_FORM = {
  titleEn: '', titleNp: '', contentEn: '', contentNp: '',
  type: 'info', targetCategory: ['all'], status: 'Draft', expiresAt: '',
};

function fmtDate(ts?: { _seconds: number } | null) {
  if (!ts) return '—';
  return new Date(ts._seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function NoticesPage() {
  const [notices,  setNotices]  = useState<Notice[]>([]);
  const [stats,    setStats]    = useState<Stats>({ published: 0, draft: 0 });
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter,   setTypeFilter]   = useState('All');

  // Modal state
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editNotice,  setEditNotice]  = useState<Notice | null>(null);
  const [form,        setForm]        = useState({ ...EMPTY_FORM });
  const [deleteConfirm, setDeleteConfirm] = useState<Notice | null>(null);

  const PAGE_SIZE = 10;

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter !== 'All') q.set('status', statusFilter);
      if (typeFilter   !== 'All') q.set('type',   typeFilter);
      q.set('page', String(page));
      q.set('pageSize', String(PAGE_SIZE));
      const res = await fetch(`/api/notices?${q}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setNotices(data.items ?? []);
      setTotal(data.total ?? 0);
      setStats(data.stats ?? { published: 0, draft: 0 });
    } catch { showToast('Failed to load notices', false); }
    finally { setLoading(false); }
  }, [statusFilter, typeFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [statusFilter, typeFilter]);

  function openCreate() {
    setEditNotice(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  }

  function openEdit(n: Notice) {
    setEditNotice(n);
    setForm({
      titleEn:        n.titleEn         ?? '',
      titleNp:        n.titleNp         ?? '',
      contentEn:      n.contentEn       ?? '',
      contentNp:      n.contentNp       ?? '',
      type:           n.type            ?? 'info',
      targetCategory: n.targetCategory  ?? ['all'],
      status:         n.status          ?? 'Draft',
      expiresAt:      n.expiresAt       ?? '',
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.titleEn.trim()) { showToast('English title is required', false); return; }
    setSaving(true);
    try {
      const url    = editNotice ? `/api/notices/${editNotice.id}` : '/api/notices';
      const method = editNotice ? 'PATCH' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? 'Failed'); }
      showToast(editNotice ? 'Notice updated' : 'Notice created');
      setModalOpen(false);
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to save', false);
    } finally { setSaving(false); }
  }

  async function handleDelete(n: Notice) {
    setDeleting(n.id);
    try {
      const res = await fetch(`/api/notices/${n.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      showToast('Notice deleted');
      setDeleteConfirm(null);
      load();
    } catch { showToast('Failed to delete', false); }
    finally { setDeleting(null); }
  }

  async function toggleStatus(n: Notice) {
    const next = n.status === 'Published' ? 'Draft' : 'Published';
    try {
      const res = await fetch(`/api/notices/${n.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error('Failed');
      setNotices(prev => prev.map(x => x.id === n.id ? { ...x, status: next } : x));
      showToast(`Marked as ${next}`);
    } catch { showToast('Failed to update', false); }
  }

  function toggleCat(cat: string) {
    setForm(f => {
      if (cat === 'all') return { ...f, targetCategory: ['all'] };
      const without = f.targetCategory.filter(c => c !== 'all');
      const has = without.includes(cat);
      const next = has ? without.filter(c => c !== cat) : [...without, cat];
      return { ...f, targetCategory: next.length ? next : ['all'] };
    });
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Layout title="Notices">
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
            <h1 className="font-display font-bold text-[24px] text-[#1c1b1b]">Notice Management</h1>
            <p className="text-sm text-[#5c3f3f] mt-1">Broadcast announcements to app users in real-time.</p>
          </div>
          <button onClick={openCreate}
            style={{ backgroundColor: P, color: '#fff', borderRadius: 8 }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold hover:opacity-90">
            <span className="material-symbols-outlined text-base">add</span> Create Notice
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: 'campaign',    bg: '#dae1ff', color: S,        label: 'PUBLISHED', value: stats.published },
            { icon: 'draft',       bg: '#fef9c3', color: '#a16207', label: 'DRAFTS',    value: stats.draft    },
            { icon: 'notifications_active', bg: '#ffdad9', color: P, label: 'TOTAL',   value: total          },
          ].map((c, i) => (
            <div key={i} style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 12 }} className="p-5 shadow-sm">
              <div style={{ backgroundColor: c.bg, borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="mb-3">
                <span className="material-symbols-outlined text-xl" style={{ color: c.color, fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#5c3f3f] mb-1">{c.label}</p>
              <h3 className="font-display font-bold text-3xl text-[#1c1b1b]">{c.value}</h3>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 12 }} className="flex items-center gap-3 px-5 py-3 mb-4 shadow-sm flex-wrap">
          <span className="material-symbols-outlined text-[#5c3f3f] text-base">filter_list</span>
          <span className="text-sm font-semibold text-[#5c3f3f]">Filters:</span>
          {(['All', 'Published', 'Draft', 'Archived'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{ borderRadius: 8, padding: '5px 14px', fontSize: 13, fontWeight: 600, border: `1px solid ${statusFilter === s ? P : '#e6bdbc'}`, backgroundColor: statusFilter === s ? '#ffdad9' : '#f6f3f2', color: statusFilter === s ? P : '#5c3f3f', cursor: 'pointer' }}>
              {s}
            </button>
          ))}
          <div style={{ width: 1, height: 20, backgroundColor: '#e6bdbc', margin: '0 4px' }} />
          {(['All', 'info', 'warning', 'urgent', 'update'] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              style={{ borderRadius: 8, padding: '5px 14px', fontSize: 13, fontWeight: 600, border: `1px solid ${typeFilter === t ? S : '#e6bdbc'}`, backgroundColor: typeFilter === t ? '#dae1ff' : '#f6f3f2', color: typeFilter === t ? S : '#5c3f3f', cursor: 'pointer' }}>
              {t === 'All' ? 'All Types' : TYPE_META[t]?.label ?? t}
            </button>
          ))}
          <button onClick={load} style={{ color: S, border: `1px solid ${S}`, borderRadius: 8, backgroundColor: '#f0f4ff', padding: '5px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>
            Refresh
          </button>
        </div>

        {/* Table */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 12 }} className="overflow-hidden shadow-sm mb-6">
          <div style={{ backgroundColor: '#f6f3f2', borderBottom: '1px solid #e6bdbc' }} className="grid grid-cols-12 px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#5c3f3f]">
            <span className="col-span-4">Title</span>
            <span className="col-span-2">Type</span>
            <span className="col-span-2">Target</span>
            <span className="col-span-2">Published</span>
            <span className="col-span-1">Status</span>
            <span className="col-span-1 text-right">Actions</span>
          </div>

          {loading ? (
            [1,2,3,4].map(i => (
              <div key={i} className="grid grid-cols-12 items-center px-5 py-4 animate-pulse" style={{ borderBottom: '1px solid #e6bdbc20' }}>
                <div className="col-span-4"><div style={{ backgroundColor: '#f0eded', borderRadius: 4, height: 12, width: '80%', marginBottom: 6 }} /><div style={{ backgroundColor: '#f0eded', borderRadius: 4, height: 10, width: '60%' }} /></div>
                {[1,2,3,4,5].map(j => <div key={j} style={{ backgroundColor: '#f0eded', borderRadius: 4, height: 12, width: '60%' }} />)}
              </div>
            ))
          ) : notices.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <span className="material-symbols-outlined text-5xl text-[#e6bdbc] mb-3 block" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
              <p className="text-sm font-bold text-[#1c1b1b]">No notices found</p>
              <p className="text-xs text-[#5c3f3f] mt-1">Create a notice to broadcast it to app users.</p>
            </div>
          ) : notices.map(n => {
            const tm = TYPE_META[n.type] ?? TYPE_META.info;
            const sm = STATUS_META[n.status] ?? STATUS_META.Draft;
            const cats = (n.targetCategory ?? ['all']).join(', ');
            return (
              <div key={n.id} style={{ borderBottom: '1px solid #e6bdbc20' }} className="grid grid-cols-12 items-center px-5 py-4 hover:bg-[#fdf5f5] transition-colors">
                <div className="col-span-4 pr-4">
                  <p className="text-sm font-bold text-[#1c1b1b] truncate">{n.titleEn}</p>
                  {n.titleNp && <p className="text-xs text-[#5c3f3f] truncate">{n.titleNp}</p>}
                </div>
                <div className="col-span-2">
                  <span style={{ backgroundColor: tm.bg, color: tm.color, borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>{tm.icon}</span>
                    {tm.label}
                  </span>
                </div>
                <span className="col-span-2 text-xs font-semibold text-[#5c3f3f] uppercase">{cats}</span>
                <span className="col-span-2 text-sm text-[#5c3f3f]">{fmtDate(n.publishedAt)}</span>
                <div className="col-span-1">
                  <span style={{ backgroundColor: sm.bg, color: sm.color, borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{n.status}</span>
                </div>
                <div className="col-span-1 flex items-center justify-end gap-1">
                  <button onClick={() => toggleStatus(n)} title={n.status === 'Published' ? 'Unpublish' : 'Publish'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: n.status === 'Published' ? '#a16207' : '#16a34a' }}
                    className="hover:bg-[#f0eded]">
                    <span className="material-symbols-outlined text-base">{n.status === 'Published' ? 'unpublished' : 'publish'}</span>
                  </button>
                  <button onClick={() => openEdit(n)} title="Edit"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: S }}
                    className="hover:bg-[#dae1ff]">
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                  <button onClick={() => setDeleteConfirm(n)} title="Delete"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: P }}
                    className="hover:bg-[#ffdad9]">
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          <div style={{ borderTop: '1px solid #e6bdbc', backgroundColor: '#f6f3f2' }} className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-[#5c3f3f]">Showing <strong>{Math.min((page-1)*PAGE_SIZE+1,total)}–{Math.min(page*PAGE_SIZE,total)}</strong> of <strong>{total}</strong></span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                style={{ border: '1px solid #e6bdbc', borderRadius: 8 }} className="w-8 h-8 flex items-center justify-center text-[#5c3f3f] hover:bg-[#e6bdbc] disabled:opacity-40">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(5, totalPages || 1) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  style={{ backgroundColor: p === page ? P : 'transparent', color: p === page ? '#fff' : '#5c3f3f', border: `1px solid ${p === page ? P : '#e6bdbc'}`, borderRadius: 8 }}
                  className="w-8 h-8 flex items-center justify-center text-sm font-bold">{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages || totalPages === 0}
                style={{ border: '1px solid #e6bdbc', borderRadius: 8 }} className="w-8 h-8 flex items-center justify-center text-[#5c3f3f] hover:bg-[#e6bdbc] disabled:opacity-40">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Create / Edit Modal */}
        {modalOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e6bdbc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 className="font-display font-bold text-lg text-[#1c1b1b]">{editNotice ? 'Edit Notice' : 'Create Notice'}</h2>
                <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5c3f3f' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div style={{ padding: 24 }} className="space-y-4">
                {/* Title EN */}
                <div>
                  <label className="text-xs font-bold text-[#5c3f3f] uppercase tracking-wider block mb-1">Title (English) <span style={{ color: P }}>*</span></label>
                  <input value={form.titleEn} onChange={e => setForm(f => ({ ...f, titleEn: e.target.value }))}
                    placeholder="Notice title in English"
                    style={{ width: '100%', border: '1px solid #e6bdbc', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', color: '#1c1b1b' }} />
                </div>
                {/* Title NP */}
                <div>
                  <label className="text-xs font-bold text-[#5c3f3f] uppercase tracking-wider block mb-1">Title (Nepali)</label>
                  <input value={form.titleNp} onChange={e => setForm(f => ({ ...f, titleNp: e.target.value }))}
                    placeholder="नेपालीमा शीर्षक"
                    style={{ width: '100%', border: '1px solid #e6bdbc', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', color: '#1c1b1b' }} />
                </div>
                {/* Content EN */}
                <div>
                  <label className="text-xs font-bold text-[#5c3f3f] uppercase tracking-wider block mb-1">Content (English)</label>
                  <textarea value={form.contentEn} onChange={e => setForm(f => ({ ...f, contentEn: e.target.value }))}
                    rows={3} placeholder="Notice body in English"
                    style={{ width: '100%', border: '1px solid #e6bdbc', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', color: '#1c1b1b', resize: 'vertical' }} />
                </div>
                {/* Content NP */}
                <div>
                  <label className="text-xs font-bold text-[#5c3f3f] uppercase tracking-wider block mb-1">Content (Nepali)</label>
                  <textarea value={form.contentNp} onChange={e => setForm(f => ({ ...f, contentNp: e.target.value }))}
                    rows={3} placeholder="नेपालीमा सामग्री"
                    style={{ width: '100%', border: '1px solid #e6bdbc', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', color: '#1c1b1b', resize: 'vertical' }} />
                </div>

                {/* Type + Status row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#5c3f3f] uppercase tracking-wider block mb-1">Type</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                      style={{ width: '100%', border: '1px solid #e6bdbc', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', color: '#1c1b1b', backgroundColor: '#fff' }}>
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="urgent">Urgent</option>
                      <option value="update">Update</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#5c3f3f] uppercase tracking-wider block mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      style={{ width: '100%', border: '1px solid #e6bdbc', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', color: '#1c1b1b', backgroundColor: '#fff' }}>
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>

                {/* Target Category */}
                <div>
                  <label className="text-xs font-bold text-[#5c3f3f] uppercase tracking-wider block mb-2">Target Category</label>
                  <div className="flex gap-2 flex-wrap">
                    {['all', 'A', 'B', 'K', 'G'].map(cat => {
                      const selected = form.targetCategory.includes(cat);
                      return (
                        <button key={cat} type="button" onClick={() => toggleCat(cat)}
                          style={{ borderRadius: 8, padding: '5px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: `1px solid ${selected ? P : '#e6bdbc'}`, backgroundColor: selected ? '#ffdad9' : '#f6f3f2', color: selected ? P : '#5c3f3f' }}>
                          {cat === 'all' ? 'All Users' : `Cat ${cat}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Expires At */}
                <div>
                  <label className="text-xs font-bold text-[#5c3f3f] uppercase tracking-wider block mb-1">Expires At (optional)</label>
                  <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                    style={{ border: '1px solid #e6bdbc', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', color: '#1c1b1b' }} />
                </div>
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid #e6bdbc', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button onClick={() => setModalOpen(false)} style={{ border: '1px solid #e6bdbc', borderRadius: 8, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', backgroundColor: '#f6f3f2', color: '#5c3f3f' }}>Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  style={{ backgroundColor: P, color: '#fff', borderRadius: 8, padding: '9px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : editNotice ? 'Save Changes' : 'Create Notice'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Modal */}
        {deleteConfirm && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, padding: 28, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <span className="material-symbols-outlined text-5xl mb-3 block" style={{ color: P, fontVariationSettings: "'FILL' 1" }}>delete_forever</span>
              <h3 className="font-bold text-lg text-[#1c1b1b] mb-2">Delete Notice?</h3>
              <p className="text-sm text-[#5c3f3f] mb-6">"{deleteConfirm.titleEn}" will be permanently removed.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeleteConfirm(null)} style={{ border: '1px solid #e6bdbc', borderRadius: 8, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', backgroundColor: '#f6f3f2', color: '#5c3f3f' }}>Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} disabled={!!deleting}
                  style={{ backgroundColor: P, color: '#fff', borderRadius: 8, padding: '9px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', opacity: deleting ? 0.7 : 1 }}>
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
