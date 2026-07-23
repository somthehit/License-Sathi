"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';

const P = '#b1002c';
const S = '#335ab4';

type LibTab    = 'Traffic Sign' | 'Road Rule' | 'Vehicle Knowledge';
type StatusFilter = 'All' | 'Published' | 'Draft';

interface Material {
  id: string;
  code: string;
  contentType: string;
  vehicleCategory: string;
  difficulty: string;
  titleEn: string;
  titleNp: string;
  descEn: string;
  descNp?: string;
  sectionId?: string;
  dotmRef?: string;
  imageUrl?: string;
  status: string;
  createdAt?: { _seconds: number };
}

interface Stats { published: number; draft: number; }

const DIFF_COLOR: Record<string, string> = { Easy: '#16a34a', Medium: S, Hard: P };
const DIFF_BG:    Record<string, string> = { Easy: '#dcfce7', Medium: '#dae1ff', Hard: '#ffdad9' };
const TYPE_ICON:  Record<string, string> = { 'Traffic Sign': 'traffic', 'Road Rule': 'menu_book', 'Vehicle Knowledge': 'build' };

const PAGE_SIZE = 9; // 3-col grid

export default function StudyLibraryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stats, setStats]         = useState<Stats>({ published: 0, draft: 0 });
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<LibTab>('Traffic Sign');
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('All');
  const [vehicleFilter, setVehicleFilter] = useState('All');
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
      q.set('contentType', activeTab);
      if (vehicleFilter !== 'All') q.set('vehicleCategory', vehicleFilter);
      if (activeStatus  !== 'All') q.set('status', activeStatus);
      q.set('page', String(page));
      q.set('pageSize', String(PAGE_SIZE));

      const res = await fetch(`/api/materials?${q}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setMaterials(data.items ?? []);
      setTotal(data.total ?? 0);
      setStats(data.stats ?? { published: 0, draft: 0 });
    } catch { showToast('Failed to load materials', false); }
    finally { setLoading(false); }
  }, [activeTab, vehicleFilter, activeStatus, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [activeTab, vehicleFilter, activeStatus]);

  async function deleteMaterial(id: string) {
    if (!confirm('Delete this material? This cannot be undone.')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' });
      if (res.ok) { showToast('Material deleted'); load(); }
      else showToast('Failed to delete', false);
    } finally { setDeleting(null); }
  }

  const tabs: LibTab[] = ['Traffic Sign', 'Road Rule', 'Vehicle Knowledge'];

  return (
    <Layout title="Study Library">
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
            <h1 className="font-display font-bold text-[24px] text-[#1c1b1b]">Study Library Editor</h1>
            <p className="text-sm text-[#5c3f3f] mt-1">Manage traffic signs, road rules, and vehicle knowledge content.</p>
          </div>
          <Link href="/study-library/add"
            style={{ backgroundColor: P, color: '#fff', borderRadius: 8, textDecoration: 'none' }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold hover:opacity-90 shrink-0">
            <span className="material-symbols-outlined text-base">add_circle</span>
            Add New Study Material
          </Link>
        </div>

        {/* Tabs + Filters */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 12 }} className="flex items-center justify-between p-3 mb-6 shadow-sm flex-wrap gap-3">
          {/* Content type tabs */}
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ color: activeTab === tab ? P : '#5c3f3f', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === tab ? `2px solid ${P}` : '2px solid transparent', padding: '6px 16px', fontWeight: activeTab === tab ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s' }}
                className="text-sm">
                {tab}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#5c3f3f] uppercase">Vehicle:</span>
            <select style={{ border: '1px solid #e6bdbc', borderRadius: 6, backgroundColor: '#f6f3f2', color: '#1c1b1b', padding: '4px 10px', fontSize: 12, outline: 'none' }}
              value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)}>
              <option value="All">All Categories</option>
              <option value="A - Motorcycle/Bike">Category A</option>
              <option value="B - Car / Jeep / Van">Category B</option>
              <option value="K - Scooter / Moped">Category K</option>
              <option value="All">All</option>
            </select>
            <span className="text-xs font-bold text-[#5c3f3f] uppercase ml-2">Status:</span>
            <select style={{ border: '1px solid #e6bdbc', borderRadius: 6, backgroundColor: '#f6f3f2', color: '#1c1b1b', padding: '4px 10px', fontSize: 12, outline: 'none' }}
              value={activeStatus} onChange={e => setActiveStatus(e.target.value as StatusFilter)}>
              <option value="All">All Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
            <button onClick={load} style={{ border: `1px solid ${S}`, borderRadius: 6, backgroundColor: '#f0f4ff', color: S, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Refresh
            </button>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-5 mb-5">
          {loading ? (
            // Skeleton cards
            [1,2,3,4].map(i => (
              <div key={i} style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 12 }} className="overflow-hidden animate-pulse flex flex-col md:flex-row">
                <div style={{ backgroundColor: '#f0eded', minWidth: 140, minHeight: 120 }} className="border-b md:border-b-0 md:border-r border-[#e6bdbc]" />
                <div className="p-3 flex-1">
                  <div style={{ backgroundColor: '#f0eded', borderRadius: 4, height: 14, width: '40%', marginBottom: 12 }} />
                  <div style={{ backgroundColor: '#f0eded', borderRadius: 4, height: 10, width: '30%', marginBottom: 16 }} />
                  <div style={{ backgroundColor: '#f0eded', borderRadius: 4, height: 10, width: '90%', marginBottom: 8 }} />
                  <div style={{ backgroundColor: '#f0eded', borderRadius: 4, height: 10, width: '80%' }} />
                </div>
              </div>
            ))
          ) : materials.length === 0 ? (
            <div className="col-span-1 py-16 text-center">
              <span className="material-symbols-outlined text-5xl text-[#e6bdbc] mb-3 block" style={{ fontVariationSettings: "'FILL' 1" }}>library_books</span>
              <p className="text-sm font-bold text-[#1c1b1b]">No materials found</p>
              <p className="text-xs text-[#5c3f3f] mt-1">Try adjusting filters or add new study material.</p>
            </div>
          ) : (
            <>
              {materials.map(m => {
                const isPublished = m.status === 'Published';
                const diffColor = DIFF_COLOR[m.difficulty] ?? '#5c3f3f';
                const diffBg    = DIFF_BG[m.difficulty]    ?? '#f0eded';
                const icon      = TYPE_ICON[m.contentType] ?? 'article';
                return (
                  <div key={m.id} style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 12 }} className="flex flex-col md:flex-row overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {/* Card image / icon area */}
                    <div style={{ backgroundColor: '#f6f3f2', minWidth: '160px', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }} className="border-b md:border-b-0 md:border-r border-[#e6bdbc]">
                      {m.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.imageUrl} alt={m.titleEn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span className="material-symbols-outlined text-4xl text-[#e6bdbc]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="p-3 flex-1 flex flex-col">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-1 mb-1">
                        <div className="w-full">
                           <div className="flex flex-wrap items-center gap-2 mb-1">
                             <span style={{ backgroundColor: '#f6f3f2', border: '1px solid #e6bdbc', borderRadius: 4, color: P, fontSize: 10, fontWeight: 700, padding: '2px 6px' }}>{m.code}</span>
                             <span style={{ color: isPublished ? '#16a34a' : '#5c3f3f', fontSize: 10, fontWeight: 700, backgroundColor: isPublished ? '#dcfce7' : '#f0eded', borderRadius: 4, padding: '2px 6px' }}>{m.status.toUpperCase()}</span>
                             <span style={{ backgroundColor: diffBg, color: diffColor, fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '2px 8px' }}>{m.difficulty}</span>
                             {m.vehicleCategory && (
                                <span style={{ backgroundColor: '#f0eded', color: '#5c3f3f', fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '2px 6px' }}>{m.vehicleCategory}</span>
                             )}
                           </div>
                           <h4 className="font-display font-bold text-base text-[#1c1b1b] leading-tight">{m.titleEn}</h4>
                           <p className="text-sm font-semibold text-[#b1002c] leading-tight">{m.titleNp}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2 flex-1">
                        <div>
                          <p className="text-[10px] font-bold text-[#5c3f3f] mb-0 uppercase tracking-wider">English</p>
                          <p className="text-[11px] text-[#1c1b1b] leading-tight">{m.descEn || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[#5c3f3f] mb-0 uppercase tracking-wider">Nepali</p>
                          <p className="text-[11px] text-[#1c1b1b] leading-tight">{m.descNp || '-'}</p>
                        </div>
                      </div>

                      {(m.sectionId || m.dotmRef) && (
                        <div className="flex flex-wrap gap-2 mb-2 bg-[#f6f3f2] px-2 py-1.5 rounded">
                          {m.sectionId && (
                            <p className="text-[11px] text-[#5c3f3f]"><strong>Sec ID:</strong> {m.sectionId}</p>
                          )}
                          {m.dotmRef && (
                            <p className="text-[11px] text-[#5c3f3f]"><strong>DOTM Ref:</strong> {m.dotmRef}</p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ borderTop: '1px solid #e6bdbc40', marginTop: 'auto', paddingTop: 8 }} className="flex items-center justify-between">
                        <div className="flex gap-4">
                          <Link href={`/study-library/add?edit=${m.id}`} className="flex items-center gap-1 text-[13px] font-bold hover:opacity-80 transition-opacity" style={{ color: S }}>
                            <span className="material-symbols-outlined text-sm">edit</span> Edit
                          </Link>
                        </div>
                        <button onClick={() => deleteMaterial(m.id)} disabled={deleting === m.id}
                          className="disabled:opacity-40 flex items-center gap-1 text-[13px] font-bold hover:opacity-80 transition-opacity" style={{ color: P }}>
                          <span className="material-symbols-outlined text-sm">
                            {deleting === m.id ? 'progress_activity' : 'delete'}
                          </span>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add new card */}
              <Link href="/study-library/add"
                style={{ border: '2px dashed #e6bdbc', borderRadius: 12, backgroundColor: '#f6f3f2', textDecoration: 'none', minHeight: 60 }}
                className="flex flex-row items-center justify-center gap-3 hover:border-[#b1002c] hover:bg-[#ffdad9]/20 transition-colors group p-3">
                <div style={{ backgroundColor: '#fff', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
                  <span className="material-symbols-outlined text-base text-[#5c3f3f] group-hover:text-[#b1002c] transition-colors">add</span>
                </div>
                <div className="text-left">
                  <h4 className="font-display font-bold text-sm text-[#1c1b1b] group-hover:text-[#b1002c] transition-colors">Add New Material</h4>
                  <p className="text-sm text-[#5c3f3f]">Create a new traffic sign, road rule, or other study content.</p>
                </div>
              </Link>
            </>
          )}
        </div>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 12 }} className="flex items-center justify-between px-5 py-3 mb-5 shadow-sm">
            <span className="text-sm text-[#5c3f3f]">
              Showing <strong>{Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)}</strong> of <strong>{total}</strong>
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ border: '1px solid #e6bdbc', borderRadius: 8 }} className="w-8 h-8 flex items-center justify-center text-[#5c3f3f] hover:bg-[#e6bdbc] disabled:opacity-40">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(5, Math.ceil(total / PAGE_SIZE)) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  style={{ backgroundColor: p === page ? P : 'transparent', color: p === page ? '#fff' : '#5c3f3f', border: `1px solid ${p === page ? P : '#e6bdbc'}`, borderRadius: 8 }}
                  className="w-8 h-8 flex items-center justify-center text-sm font-bold">
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(Math.ceil(total / PAGE_SIZE), p + 1))} disabled={page >= Math.ceil(total / PAGE_SIZE)}
                style={{ border: '1px solid #e6bdbc', borderRadius: 8 }} className="w-8 h-8 flex items-center justify-center text-[#5c3f3f] hover:bg-[#e6bdbc] disabled:opacity-40">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}

        {/* Stats footer */}
        <div className="grid grid-cols-3 gap-4">
          <div style={{ backgroundColor: P, borderRadius: 16, color: '#fff' }} className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Total Materials</p>
            <div className="flex justify-between items-center">
              <span className="font-display font-bold text-3xl">{total}</span>
              <span className="material-symbols-outlined text-5xl opacity-20" style={{ fontVariationSettings: "'FILL' 1" }}>library_books</span>
            </div>
          </div>
          <div style={{ backgroundColor: '#16a34a', borderRadius: 16, color: '#fff' }} className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Published</p>
            <div className="flex justify-between items-center">
              <span className="font-display font-bold text-3xl">{stats.published}</span>
              <span className="material-symbols-outlined text-5xl opacity-20" style={{ fontVariationSettings: "'FILL' 1" }}>publish</span>
            </div>
          </div>
          <div style={{ backgroundColor: '#705d00', borderRadius: 16, color: '#fff' }} className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Drafts</p>
            <div className="flex justify-between items-center">
              <span className="font-display font-bold text-3xl">{stats.draft}</span>
              <span className="material-symbols-outlined text-5xl opacity-20" style={{ fontVariationSettings: "'FILL' 1" }}>draft</span>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
