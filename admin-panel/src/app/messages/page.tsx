"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';

const P = '#b1002c';
const S = '#335ab4';

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

interface Stats {
  unread: number;
  read: number;
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso?: string) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats>({ unread: 0, read: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selected, setSelected] = useState<Message | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const PAGE_SIZE = 15;

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('status', statusFilter);
      q.set('page', String(page));
      q.set('pageSize', String(PAGE_SIZE));
      const res = await fetch(`/api/contact-messages?${q}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setMessages(data.items ?? []);
      setTotal(data.total ?? 0);
      setStats(data.stats ?? { unread: 0, read: 0 });
    } catch {
      showToast('Failed to load messages', false);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  async function toggleStatus(msg: Message) {
    const next = msg.status === 'unread' ? 'read' : 'unread';
    try {
      const res = await fetch(`/api/contact-messages/${msg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error('Failed');
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: next } : m));
      setStats(prev => ({
        unread: next === 'unread' ? prev.unread + 1 : prev.unread - 1,
        read: next === 'read' ? prev.read + 1 : prev.read - 1,
      }));
      if (selected?.id === msg.id) setSelected({ ...msg, status: next });
      showToast(`Marked as ${next}`);
    } catch {
      showToast('Failed to update', false);
    }
  }

  async function handleDelete(msg: Message) {
    setDeleting(msg.id);
    try {
      const res = await fetch(`/api/contact-messages/${msg.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      showToast('Message deleted');
      setDeleteConfirm(null);
      if (selected?.id === msg.id) setSelected(null);
      load();
    } catch {
      showToast('Failed to delete', false);
    } finally {
      setDeleting(null);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Layout title="Contact Messages">
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
            <h1 className="font-display font-bold text-[24px] text-[#1c1b1b]">Contact Messages</h1>
            <p className="text-sm text-[#5c3f3f] mt-1">Messages submitted through the contact form.</p>
          </div>
          <button onClick={load}
            style={{ color: S, border: `1px solid ${S}`, borderRadius: 8, backgroundColor: '#f0f4ff', padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">refresh</span> Refresh
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: 'mark_email_unread', bg: '#ffdad9', color: P, label: 'UNREAD', value: stats.unread },
            { icon: 'mark_email_read', bg: '#dcfce7', color: '#16a34a', label: 'READ', value: stats.read },
            { icon: 'mail', bg: '#dae1ff', color: S, label: 'TOTAL', value: total },
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
          {(['all', 'unread', 'read'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{ borderRadius: 8, padding: '5px 14px', fontSize: 13, fontWeight: 600, border: `1px solid ${statusFilter === s ? P : '#e6bdbc'}`, backgroundColor: statusFilter === s ? '#ffdad9' : '#f6f3f2', color: statusFilter === s ? P : '#5c3f3f', cursor: 'pointer' }}>
              {s === 'all' ? 'All' : s === 'unread' ? 'Unread' : 'Read'}
            </button>
          ))}
          {statusFilter !== 'all' && (
            <span className="text-sm text-[#5c3f3f] ml-2">
              Showing <strong>{statusFilter === 'unread' ? stats.unread : stats.read}</strong> messages
            </span>
          )}
        </div>

        {/* Messages List */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 12 }} className="overflow-hidden shadow-sm mb-6">
          {loading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="px-5 py-4 animate-pulse" style={{ borderBottom: '1px solid #e6bdbc20' }}>
                <div className="flex items-center gap-3">
                  <div style={{ backgroundColor: '#f0eded', borderRadius: '50%', width: 40, height: 40 }} />
                  <div className="flex-1">
                    <div style={{ backgroundColor: '#f0eded', borderRadius: 4, height: 12, width: '40%', marginBottom: 6 }} />
                    <div style={{ backgroundColor: '#f0eded', borderRadius: 4, height: 10, width: '70%' }} />
                  </div>
                </div>
              </div>
            ))
          ) : messages.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <span className="material-symbols-outlined text-5xl text-[#e6bdbc] mb-3 block" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
              <p className="text-sm font-bold text-[#1c1b1b]">No messages found</p>
              <p className="text-xs text-[#5c3f3f] mt-1">Contact form submissions will appear here.</p>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id}
                onClick={() => { setSelected(msg); if (msg.status === 'unread') toggleStatus(msg); }}
                style={{ borderBottom: '1px solid #e6bdbc20', cursor: 'pointer', backgroundColor: msg.status === 'unread' ? '#fff8f7' : 'transparent' }}
                className="px-5 py-4 hover:bg-[#fdf5f5] transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div style={{ width: 42, height: 42, borderRadius: '50%', backgroundColor: msg.status === 'unread' ? '#ffdad9' : '#f0eded', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: msg.status === 'unread' ? `2px solid ${P}` : '2px solid transparent' }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: msg.status === 'unread' ? P : '#5c3f3f' }}>
                      {msg.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-[#1c1b1b]">{msg.name}</span>
                      <span className="text-xs text-[#5c3f3f]">&lt;{msg.email}&gt;</span>
                      {msg.status === 'unread' && (
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: P, flexShrink: 0 }} />
                      )}
                      <span className="text-xs text-[#5c3f3f] ml-auto flex-shrink-0">{timeAgo(msg.createdAt)}</span>
                    </div>
                    <p className="text-sm font-semibold text-[#1c1b1b] mb-1">{msg.subject}</p>
                    <p className="text-sm text-[#5c3f3f] line-clamp-2">{msg.message}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); toggleStatus(msg); }}
                      title={msg.status === 'unread' ? 'Mark as read' : 'Mark as unread'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: msg.status === 'unread' ? '#16a34a' : '#a16207' }}
                      className="hover:bg-[#f0eded]">
                      <span className="material-symbols-outlined text-base">{msg.status === 'unread' ? 'mark_email_read' : 'mark_email_unread'}</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(msg); }}
                      title="Delete"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: P }}
                      className="hover:bg-[#ffdad9]">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ borderTop: '1px solid #e6bdbc', backgroundColor: '#f6f3f2' }} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-[#5c3f3f]">Showing <strong>{Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)}</strong> of <strong>{total}</strong></span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ border: '1px solid #e6bdbc', borderRadius: 8 }} className="w-8 h-8 flex items-center justify-center text-[#5c3f3f] hover:bg-[#e6bdbc] disabled:opacity-40">
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                {Array.from({ length: Math.min(5, totalPages || 1) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ backgroundColor: p === page ? P : 'transparent', color: p === page ? '#fff' : '#5c3f3f', border: `1px solid ${p === page ? P : '#e6bdbc'}`, borderRadius: 8 }}
                    className="w-8 h-8 flex items-center justify-center text-sm font-bold">{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || totalPages === 0}
                  style={{ border: '1px solid #e6bdbc', borderRadius: 8 }} className="w-8 h-8 flex items-center justify-center text-[#5c3f3f] hover:bg-[#e6bdbc] disabled:opacity-40">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selected && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: 0 }}>
            <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: 520, height: '100vh', overflowY: 'auto', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)' }}>
              {/* Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e6bdbc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 className="font-display font-bold text-lg text-[#1c1b1b]">Message Details</h2>
                  <p className="text-xs text-[#5c3f3f] mt-0.5">{fmtDate(selected.createdAt)}</p>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5c3f3f' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: 24 }} className="space-y-5">
                {/* Sender */}
                <div className="flex items-center gap-3">
                  <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#ffdad9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: P }}>
                      {selected.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1c1b1b]">{selected.name}</p>
                    <a href={`mailto:${selected.email}`} className="text-sm text-[#335ab4] hover:underline">{selected.email}</a>
                  </div>
                </div>

                {/* Subject */}
                <div style={{ backgroundColor: '#f6f3f2', borderRadius: 10, padding: 16 }}>
                  <p className="text-xs font-bold text-[#5c3f3f] uppercase tracking-wider mb-1">Subject</p>
                  <p className="text-sm font-bold text-[#1c1b1b]">{selected.subject}</p>
                </div>

                {/* Message */}
                <div>
                  <p className="text-xs font-bold text-[#5c3f3f] uppercase tracking-wider mb-2">Message</p>
                  <div style={{ backgroundColor: '#f6f3f2', borderRadius: 10, padding: 16 }}>
                    <p className="text-sm text-[#1c1b1b] leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => toggleStatus(selected)}
                    style={{ flex: 1, border: `1px solid ${S}`, borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', backgroundColor: '#f0f4ff', color: S }}
                    className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-base">{selected.status === 'unread' ? 'mark_email_read' : 'mark_email_unread'}</span>
                    {selected.status === 'unread' ? 'Mark as Read' : 'Mark as Unread'}
                  </button>
                  <a href={`mailto:${selected.email}?subject=Re: ${selected.subject}`}
                    style={{ flex: 1, backgroundColor: P, color: '#fff', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', textAlign: 'center' }}
                    className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-base">reply</span>
                    Reply via Email
                  </a>
                </div>

                <button onClick={() => { setDeleteConfirm(selected); setSelected(null); }}
                  style={{ width: '100%', border: `1px solid ${P}`, borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', backgroundColor: '#fff', color: P }}
                  className="flex items-center justify-center gap-2 hover:bg-[#ffdad9] transition-colors">
                  <span className="material-symbols-outlined text-base">delete</span>
                  Delete Message
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
              <h3 className="font-bold text-lg text-[#1c1b1b] mb-2">Delete Message?</h3>
              <p className="text-sm text-[#5c3f3f] mb-6">Message from &quot;{deleteConfirm.name}&quot; will be permanently removed.</p>
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
