"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useParams } from 'next/navigation';

const P = '#b1002c';
const S = '#335ab4';

interface QuestionSet {
  id: string;
  name: string;
  nameNp?: string;
  description: string;
}

interface Question {
  id: string;
  subject: string;
  subjectNp?: string;
  category: string;
  topic: string;
  status: string;
}

export default function SetDetailsPage() {
  const { id } = useParams() as { id: string };
  
  const [setInfo, setSetInfo] = useState<QuestionSet | null>(null);
  const [assigned, setAssigned] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [unassigned, setUnassigned] = useState<Question[]>([]);
  const [loadingUnassigned, setLoadingUnassigned] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const loadSetAndAssigned = useCallback(async () => {
    setLoading(true);
    try {
      const [setRes, qRes] = await Promise.all([
        fetch(`/api/questions/sets/${id}`),
        fetch(`/api/questions?setId=${id}&pageSize=100`)
      ]);
      if (setRes.ok) setSetInfo(await setRes.json());
      if (qRes.ok) {
        const qData = await qRes.json();
        setAssigned(qData.items || []);
      }
    } catch {
      showToast('Failed to load data', false);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadSetAndAssigned(); }, [loadSetAndAssigned]);

  const openAddModal = async () => {
    setShowModal(true);
    setSelectedIds(new Set());
    setLoadingUnassigned(true);
    try {
      const res = await fetch(`/api/questions?setId=unassigned&pageSize=200`);
      if (res.ok) {
        const data = await res.json();
        setUnassigned(data.items || []);
      }
    } catch {
      showToast('Failed to load unassigned questions', false);
    } finally {
      setLoadingUnassigned(false);
    }
  };

  const toggleSelect = (qId: string) => {
    const next = new Set(selectedIds);
    if (next.has(qId)) next.delete(qId);
    else next.add(qId);
    setSelectedIds(next);
  };

  const assignQuestions = async () => {
    if (selectedIds.size === 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/questions/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds: Array.from(selectedIds), setId: id })
      });
      if (res.ok) {
        showToast('Questions added to set');
        setShowModal(false);
        loadSetAndAssigned();
      } else {
        showToast('Failed to assign questions', false);
      }
    } catch {
      showToast('Failed to assign questions', false);
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = async (qId: string) => {
    if (!confirm('Remove this question from the set?')) return;
    setRemovingId(qId);
    try {
      const res = await fetch('/api/questions/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds: [qId], setId: "" })
      });
      if (res.ok) {
        showToast('Question removed');
        loadSetAndAssigned();
      } else {
        showToast('Failed to remove question', false);
      }
    } catch {
      showToast('Failed to remove question', false);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Layout title={setInfo ? `Manage Set: ${setInfo.name}` : "Manage Set"}>
      <div className="p-6 max-w-5xl mx-auto">
        {toast && (
          <div style={{ position: 'fixed', top: 72, right: 24, zIndex: 999, backgroundColor: toast.ok ? '#dcfce7' : '#ffdad9', border: `1px solid ${toast.ok ? '#16a34a' : P}`, borderRadius: 10, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
            <span className="material-symbols-outlined text-base" style={{ color: toast.ok ? '#16a34a' : P, fontVariationSettings: "'FILL' 1" }}>{toast.ok ? 'check_circle' : 'error'}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: toast.ok ? '#16a34a' : P }}>{toast.msg}</span>
          </div>
        )}

        <div className="flex items-center gap-2 mb-5 text-sm">
          <Link href="/questions/sets" style={{ color: '#5c3f3f', textDecoration: 'none', fontWeight: 600 }} className="hover:text-[#b1002c]">Manage Sets</Link>
          <span className="material-symbols-outlined text-base text-[#5c3f3f]">chevron_right</span>
          <span style={{ color: P, fontWeight: 700 }}>{setInfo?.name || 'Loading...'}</span>
        </div>

        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="font-display font-bold text-[24px] text-[#1c1b1b]">{setInfo?.name || 'Loading...'}</h1>
            {setInfo?.description && <p className="text-sm text-[#5c3f3f] mt-1">{setInfo.description}</p>}
          </div>
          <button onClick={openAddModal} style={{ backgroundColor: S, color: '#fff', borderRadius: 8, textDecoration: 'none', border: 'none', cursor: 'pointer' }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold hover:opacity-90 shrink-0">
            <span className="material-symbols-outlined text-base">add_circle</span>
            Add Questions
          </button>
        </div>

        {/* Assigned Questions Table */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 12 }} className="overflow-hidden shadow-sm mb-4">
          <div className="grid text-xs font-bold uppercase tracking-wider text-[#5c3f3f] px-5 py-3"
            style={{ backgroundColor: '#f6f3f2', borderBottom: '1px solid #e6bdbc', gridTemplateColumns: '4fr 2fr 2fr 1fr' } as React.CSSProperties}>
            <span>Question</span>
            <span>Category</span>
            <span>Topic</span>
            <span className="text-right">Actions</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-[#5c3f3f]">Loading questions...</div>
          ) : assigned.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <span className="material-symbols-outlined text-5xl text-[#e6bdbc] mb-3 block" style={{ fontVariationSettings: "'FILL' 1" }}>help</span>
              <p className="text-sm font-bold text-[#1c1b1b]">No questions assigned</p>
              <p className="text-xs text-[#5c3f3f] mt-1">Click "Add Questions" to assign questions to this set.</p>
            </div>
          ) : (
            assigned.map(q => (
              <div key={q.id}
                style={{ borderBottom: '1px solid #e6bdbc30', gridTemplateColumns: '4fr 2fr 2fr 1fr' } as React.CSSProperties}
                className="grid items-center px-5 py-4 hover:bg-[#fdf5f5] transition-colors">
                <div>
                  <p className="text-sm font-bold text-[#1c1b1b] line-clamp-1">{q.subject}</p>
                  {q.subjectNp && <p className="text-xs text-[#5c3f3f] line-clamp-1">{q.subjectNp}</p>}
                </div>
                <div>
                  <span style={{ backgroundColor: '#fbe9e9', color: P, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>Cat {q.category}</span>
                </div>
                <div>
                  <p className="text-xs text-[#5c3f3f]">{q.topic}</p>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => removeQuestion(q.id)} disabled={removingId === q.id}
                    title="Remove from Set"
                    className="text-[#5c3f3f] hover:text-[#b1002c] transition-colors border-none bg-transparent cursor-pointer p-0 disabled:opacity-40">
                    <span className="material-symbols-outlined text-base">{removingId === q.id ? 'progress_activity' : 'do_not_disturb_on'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Questions Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#fdf5f5', borderBottom: '1px solid #e6bdbc', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1c1b1b', margin: 0 }}>Assign Questions</h2>
                <p className="text-xs text-[#5c3f3f] mt-1">Select unassigned questions to add to {setInfo?.name}</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5c3f3f', display: 'flex' }}>
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-0">
              {loadingUnassigned ? (
                <div className="p-8 text-center text-sm text-[#5c3f3f]">Loading unassigned questions...</div>
              ) : unassigned.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm font-bold text-[#1c1b1b]">No unassigned questions found</p>
                  <p className="text-xs text-[#5c3f3f] mt-1">All existing questions might already be assigned to other sets.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#e6bdbc30]">
                  {unassigned.map(q => (
                    <label key={q.id} className="flex items-start gap-4 p-4 hover:bg-[#fdf5f5] cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(q.id)} 
                        onChange={() => toggleSelect(q.id)} 
                        className="mt-1 w-4 h-4 accent-[#b1002c]"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#1c1b1b]">{q.subject}</p>
                        {q.subjectNp && <p className="text-xs text-[#5c3f3f]">{q.subjectNp}</p>}
                        <div className="flex items-center gap-3 mt-2">
                          <span style={{ backgroundColor: '#fbe9e9', color: P, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>Cat {q.category}</span>
                          <span className="text-[11px] text-[#5c3f3f] font-semibold">{q.topic}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e6bdbc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#faf9f8' }}>
              <span className="text-xs font-semibold text-[#5c3f3f]">{selectedIds.size} questions selected</span>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#5c3f3f', backgroundColor: '#fff', border: '1px solid #e6bdbc', cursor: 'pointer' }}>Cancel</button>
                <button onClick={assignQuestions} disabled={saving || selectedIds.size === 0} style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#fff', backgroundColor: P, border: 'none', cursor: (saving || selectedIds.size === 0) ? 'default' : 'pointer', opacity: (saving || selectedIds.size === 0) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {saving && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
                  Assign to Set
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
