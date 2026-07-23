'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';

const P = '#b1002c';
const S = '#335ab4';

interface VideoGuide {
  id: string;
  titleEn: string;
  titleNp: string;
  descriptionEn: string;
  descriptionNp: string;
  videoUrl: string;
  durationSeconds: number;
  category: string;
  status: string;
  createdAt?: { _seconds: number };
}

interface Stats { published: number; draft: number; }

type StatusFilter = 'All' | 'Published' | 'Draft';

const PAGE_SIZE = 9;

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

export default function VideoGuidesPage() {
  const [guides, setGuides]       = useState<VideoGuide[]>([]);
  const [stats, setStats]         = useState<Stats>({ published: 0, draft: 0 });
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter !== 'All') q.set('status', statusFilter);
      q.set('page', String(page));
      q.set('pageSize', String(PAGE_SIZE));

      const res = await fetch(`/api/video-guides?${q}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setGuides(data.items ?? []);
      setTotal(data.total ?? 0);
      setStats(data.stats ?? { published: 0, draft: 0 });
    } catch { showToast('Failed to load video guides', false); }
    finally { setLoading(false); }
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  async function deleteGuide(id: string) {
    if (!confirm('Delete this video guide? This cannot be undone.')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/video-guides/${id}`, { method: 'DELETE' });
      if (res.ok) { showToast('Video guide deleted'); load(); }
      else showToast('Failed to delete', false);
    } finally { setDeleting(null); }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Layout title="Video Guides">
      <div className="p-6">

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', top: 72, right: 24, zIndex: 999, backgroundColor: toast.ok ? '#dcfce7' : '#ffdad9', border: `1px solid ${toast.ok ? '#16a34a' : P}`, borderRadius: 10, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
            <span className="material-symbols-outlined text-base" style={{ color: toast.ok ? '#16a34a' : P, fontVariationSettings: "'FILL' 1" }}>{toast.ok ? 'check_circle' : 'error'}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: toast.ok ? '#16a34a' : P }}>{toast.msg}</span>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1c1b1b' }}>Video Guides</h1>
            <p style={{ fontSize: 13, color: '#5c3f3f', marginTop: 2 }}>Manage video tutorials shown in the app's Videos tab</p>
          </div>
          <Link
            href="/video-guides/add"
            style={{ backgroundColor: S, color: '#fff', borderRadius: 10, padding: '9px 20px', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
            Add Video Guide
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total', value: total, icon: 'play_circle', color: S, bg: '#dae1ff' },
            { label: 'Published', value: stats.published, icon: 'check_circle', color: '#16a34a', bg: '#dcfce7' },
            { label: 'Draft', value: stats.draft, icon: 'edit_note', color: '#d97706', bg: '#fef3c7' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ color: s.color, fontSize: 22, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              </div>
              <div>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#1c1b1b', lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 12, color: '#5c3f3f', marginTop: 2 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="mb-5 flex gap-2">
          {(['All', 'Published', 'Draft'] as StatusFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              style={{
                padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                backgroundColor: statusFilter === f ? S : '#f0eaea',
                color: statusFilter === f ? '#fff' : '#5c3f3f',
              }}
            >{f}</button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: S, animation: 'spin 1s linear infinite' }}>progress_activity</span>
          </div>
        ) : guides.length === 0 ? (
          <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 14, padding: 60, textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#ccc', display: 'block', marginBottom: 12 }}>video_library</span>
            <p style={{ color: '#5c3f3f', fontSize: 15, fontWeight: 600 }}>No video guides found</p>
            <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>Add your first video guide to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {guides.map(guide => (
              <div key={guide.id} style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 14, overflow: 'hidden' }}>
                {/* Thumbnail placeholder */}
                <div style={{ backgroundColor: '#1c1b1b', height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 52, color: 'rgba(255,255,255,0.3)', fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                  <span style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                    {formatDuration(guide.durationSeconds)}
                  </span>
                  <span style={{
                    position: 'absolute', top: 8, left: 8, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                    backgroundColor: guide.status === 'Published' ? '#dcfce7' : '#fef3c7',
                    color: guide.status === 'Published' ? '#16a34a' : '#d97706',
                  }}>{guide.status}</span>
                </div>

                {/* Info */}
                <div style={{ padding: 16 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1c1b1b', marginBottom: 2 }}>{guide.titleEn}</p>
                  {guide.titleNp && <p style={{ fontSize: 12, color: '#5c3f3f', marginBottom: 6 }}>{guide.titleNp}</p>}
                  <p style={{ fontSize: 12, color: '#888', marginBottom: 10, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {guide.descriptionEn || 'No description'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#888' }}>category</span>
                    <span style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>Category: {guide.category}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link
                      href={`/video-guides/edit/${guide.id}`}
                      style={{ flex: 1, backgroundColor: '#dae1ff', color: S, borderRadius: 8, padding: '7px 0', fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteGuide(guide.id)}
                      disabled={deleting === guide.id}
                      style={{ flex: 1, backgroundColor: '#ffdad9', color: P, borderRadius: 8, padding: '7px 0', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
                      {deleting === guide.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #e6bdbc', backgroundColor: page === 1 ? '#f9f5f5' : '#fff', color: page === 1 ? '#ccc' : '#1c1b1b', fontWeight: 600, fontSize: 13, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >← Prev</button>
            <span style={{ fontSize: 13, color: '#5c3f3f', fontWeight: 600 }}>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #e6bdbc', backgroundColor: page === totalPages ? '#f9f5f5' : '#fff', color: page === totalPages ? '#ccc' : '#1c1b1b', fontWeight: 600, fontSize: 13, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
            >Next →</button>
          </div>
        )}
      </div>
    </Layout>
  );
}
