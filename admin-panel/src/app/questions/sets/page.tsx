"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';

const P = '#b1002c';
const S = '#335ab4';

const SET_PALETTE = [
  { bg: '#dae1ff', text: S },
  { bg: '#dcfce7', text: '#16a34a' },
  { bg: '#ffdad9', text: P },
  { bg: '#fef9c3', text: '#a16207' },
  { bg: '#ede9fe', text: '#6d28d9' },
  { bg: '#cffafe', text: '#0891b2' },
  { bg: '#fce7f3', text: '#be185d' },
  { bg: '#d1fae5', text: '#065f46' },
  { bg: '#ffedd5', text: '#9a3412' },
  { bg: '#e0e7ff', text: '#1e40af' },
];

interface QSet {
  id: string;
  name: string;
  description?: string;
  setNumber: number;
  questionCount?: number;
  createdAt?: { _seconds: number };
}

const EMPTY = { name: '', description: '', setNumber: 1 };

export default function SetsPage() {
  const [sets, setSets]         = useState<QSet[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editSet, setEditSet]       = useState<QSet | null>(null);
  const [form, setForm]             = useState({ ...EMPTY });
  const [deleteConfirm, setDeleteConfirm] = useState<QSet | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/question-sets');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setSets(data.items ?? []);
    } catch { showToast('Failed to load sets', false); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditSet(null);
    // Suggest next available setNumber
    const used = new Set(sets.map(s => s.setNumber));
    let next = 1;
    while (used.has(next)) next++;
    setForm({ name: `Set ${next}`, description: '', setNumber: next });
    setModalOpen(true);
  }

  function openEdit(s: QSet) {
    setEditSet(s);
    setForm({ name: s.name, description: s.description ?? '', setNumber: s.setNumber });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { showToast('Set name is required', false); return; }
    if (form.setNumber < 1) { showToast('Set number must be ≥ 1', false); return; }
    setSaving(true);
    try {
      const url    = editSet ? `/api/question-sets/${editSet.id}` : '/api/question-sets';
      const method = editSet ? 'PATCH' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const e = await res.json(); showToast(e.error ?? 'Failed', false); return; }
      showToast(editSet ? 'Set updated' : 'Set created');
      setModalOpen(false);
      load();
    } catch { showToast('Error occurred', false); }
    finally { setSaving(false); }
  }

  async function handleDelete(s: QSet) {
    setDeleting(s.id);
    try {
      const res = await fetch(`/api/question-sets/${s.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast('Set deleted');
      setDeleteConfirm(null);
      load();
    } catch { showToast('Failed to delete', false); }
    finally { setDeleting(null); }
  }

  return (
    <Layout title="Question Sets">
      <div className="p-6 max-w-5xl mx-auto">

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', top: 72, right: 24, zIndex: 999, backgroundColor: toast.ok ? '#dcfce7' : '#ffdad9', border: `1px solid ${toast.ok ? '#16a34a' : P}`, borderRadius: 10, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,.12)' }}>
            <span className="material-symbols-outlined text-base" style={{ color: toast.ok ? '#16a34a' : P, fontVariationSettings: "'FILL' 1" }}>{toast.ok ? 'check_circle' : 'error'}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: toast.ok ? '#16a34a' : P }}>{toast.msg}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/questions" style={{ color: '#5c3f3f', textDecoration: 'none', fontWeight: 600, fontSize: 14 }} className="hover:text-[#b1002c]">Question Bank</Link>
            <span className="material-symbols-outlined text-base text-[#5c3f3f]">chevron_right</span>
            <span style={{ color: P, fontWeight: 700, fontSize: 14 }}>Question Sets</span>
          </div>
          <button onClick={openCreate}
            style={{ backgroundColor: P, color: '#fff', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined text-base">add</span>New Set
          </button>
        </div>

        <div className="mb-4">
          <h1 className="font-display font-bold text-[24px] text-[#1c1b1b]">Manage Question Sets</h1>
          <p className="text-sm text-[#5c3f3f] mt-1">
            Sets organise questions into groups. Each set has a number — questions tagged with that number appear together in the app's practice and mock exam screens.
          </p>
        </div>

        {/* Sets Grid */}
        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} style={{ backgroundColor: '#f0eded', borderRadius: 16, height: 140 }} className="animate-pulse" />)}
          </div>
        ) : sets.length === 0 ? (
          <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 16 }} className="p-16 text-center shadow-sm">
            <span className="material-symbols-outlined text-6xl text-[#e6bdbc] block mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>layers</span>
            <p className="text-base font-bold text-[#1c1b1b]">No sets yet</p>
            <p className="text-sm text-[#5c3f3f] mt-1 mb-6">Create your first set to start organising questions.</p>
            <button onClick={openCreate} style={{ backgroundColor: P, color: '#fff', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              Create First Set
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {sets.map((s, i) => {
              const pal = SET_PALETTE[i % SET_PALETTE.length];
              return (
                <div key={s.id} style={{ backgroundColor: pal.bg, borderRadius: 16, padding: 20, position: 'relative' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div style={{ backgroundColor: pal.text, color: '#fff', borderRadius: 8, fontSize: 11, fontWeight: 700, padding: '3px 10px', display: 'inline-block' }}>
                      Set {s.setNumber}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(s)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: pal.text, padding: 4, borderRadius: 6 }}
                        className="hover:opacity-70">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                      </button>
                      <button onClick={() => setDeleteConfirm(s)} disabled={deleting === s.id}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: pal.text, padding: 4, borderRadius: 6 }}
                        className="hover:opacity-70 disabled:opacity-40">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      </button>
                    </div>
                  </div>

                  <p style={{ fontWeight: 700, fontSize: 15, color: pal.text, margin: 0 }}>{s.name}</p>
                  {s.description && <p style={{ fontSize: 12, color: pal.text, opacity: 0.75, margin: '4px 0 0', lineHeight: 1.4 }}>{s.description}</p>}

                  <div className="flex items-center justify-between mt-4">
                    <span style={{ fontSize: 11, fontWeight: 600, color: pal.text, opacity: 0.7 }}>
                      {s.questionCount ?? 0} questions
                    </span>
                    <Link href={`/questions?set=${s.setNumber}`}
                      style={{ fontSize: 11, fontWeight: 700, color: pal.text, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
                      className="hover:opacity-80">
                      View questions
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_forward</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create / Edit Modal */}
        {modalOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #e6bdbc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{editSet ? 'Edit Set' : 'Create New Set'}</h3>
                <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5c3f3f' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div style={{ padding: 24 }} className="space-y-4">
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5c3f3f', marginBottom: 6 }}>
                    Set Number <span style={{ color: P }}>*</span>
                  </label>
                  <input type="number" min={1} max={100} value={form.setNumber}
                    onChange={e => setForm(f => ({ ...f, setNumber: parseInt(e.target.value) || 1 }))}
                    style={{ width: '100%', border: '1px solid #e6bdbc', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#1c1b1b', backgroundColor: '#f6f3f2', outline: 'none' }} />
                  <p style={{ fontSize: 11, color: '#5c3f3f', marginTop: 4 }}>
                    Questions tagged with this number will appear in this set in the app (Set 1 = questions 1–20).
                  </p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5c3f3f', marginBottom: 6 }}>
                    Set Name <span style={{ color: P }}>*</span>
                  </label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Traffic Rules Basics"
                    style={{ width: '100%', border: '1px solid #e6bdbc', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#1c1b1b', backgroundColor: '#f6f3f2', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5c3f3f', marginBottom: 6 }}>
                    Description (optional)
                  </label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={2} placeholder="Brief description of this set's focus..."
                    style={{ width: '100%', border: '1px solid #e6bdbc', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#1c1b1b', backgroundColor: '#f6f3f2', outline: 'none', resize: 'vertical' }} />
                </div>
              </div>
              <div style={{ padding: '14px 24px', borderTop: '1px solid #e6bdbc', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setModalOpen(false)}
                  style={{ border: '1px solid #e6bdbc', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', backgroundColor: '#f6f3f2', color: '#5c3f3f' }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ backgroundColor: P, color: '#fff', borderRadius: 8, padding: '9px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : editSet ? 'Save Changes' : 'Create Set'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {deleteConfirm && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, padding: 28, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
              <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: P, fontVariationSettings: "'FILL' 1" }}>delete_forever</span>
              <h3 className="font-bold text-lg text-[#1c1b1b] mb-2">Delete Set?</h3>
              <p className="text-sm text-[#5c3f3f] mb-6">
                <strong>"{deleteConfirm.name}"</strong> will be removed. Questions tagged with Set {deleteConfirm.setNumber} will stay but become unassigned.
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeleteConfirm(null)}
                  style={{ border: '1px solid #e6bdbc', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', backgroundColor: '#f6f3f2', color: '#5c3f3f' }}>
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)} disabled={!!deleting}
                  style={{ backgroundColor: P, color: '#fff', borderRadius: 8, padding: '9px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', opacity: deleting ? 0.7 : 1 }}>
                  {deleting ? 'Deleting…' : 'Delete Set'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
