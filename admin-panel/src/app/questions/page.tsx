"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';

const P = '#b1002c';
const S = '#335ab4';

type Category   = 'All' | 'A' | 'B' | 'K' | 'G';
type Status     = 'All' | 'Active' | 'Draft';
type Difficulty = 'All' | 'Easy' | 'Medium' | 'Hard';

interface Question { id:string;category:string;topic:string;difficulty:string;questionEn:string;questionNp:string;status:string;setNumber?:number; }
interface Stats    { active:number; draft:number; }
interface QSet     { id:string;name:string;description:string;setNumber:number;questionCount:number; }

const CATEGORY_BG:   Record<string,string> = { A:`${P}20`,B:'#335ab420',K:'#705d0020',G:'#16a34a20' };
const CATEGORY_TEXT: Record<string,string> = { A:P,B:S,K:'#705d00',G:'#16a34a' };
const DIFF_COLOR: Record<string,{bg:string;text:string}> = {
  Easy:{bg:'#dcfce7',text:'#16a34a'}, Medium:{bg:'#fef9c3',text:'#a16207'}, Hard:{bg:'#ffdad9',text:P},
};
const PAGE_SIZE = 10;
const SET_BG = ['#dae1ff','#dcfce7','#ffdad9','#fef9c3','#ede9fe','#cffafe','#fce7f3','#ffedd5'];
const SET_TEXT = ['#335ab4','#16a34a','#b1002c','#a16207','#6d28d9','#0891b2','#be185d','#9a3412'];

function SkeletonRow() {
  return (
    <div className="grid px-5 py-4 animate-pulse items-center"
      style={{gridTemplateColumns:'2.5fr 0.8fr 1fr 0.7fr 0.7fr 0.8fr',borderBottom:'1px solid #e6bdbc20'} as React.CSSProperties}>
      {[80,55,65,45,40,0].map((w,i)=>(
        <div key={i}>{w>0&&<div style={{backgroundColor:'#f0eded',borderRadius:4,height:13,width:`${w}%`}}/>}</div>
      ))}
    </div>
  );
}

// ── Sets Management Section ───────────────────────────────────────────────────
function SetsSection() {
  const [sets,    setSets]    = useState<QSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [deleting,setDeleting]= useState<string|null>(null);
  const [toast,   setToast]   = useState<{msg:string;ok:boolean}|null>(null);
  const [modal,   setModal]   = useState(false);
  const [editSet, setEditSet] = useState<QSet|null>(null);
  const [form, setForm]       = useState({name:'',description:'',setNumber:1});

  const showToast = (msg:string,ok=true)=>{setToast({msg,ok});setTimeout(()=>setToast(null),3000);};

  const loadSets = useCallback(async()=>{
    setLoading(true);
    try{ const r=await fetch('/api/question-sets'); const d=await r.json(); setSets(d.items??[]); }
    catch{ showToast('Failed to load sets',false); }
    finally{ setLoading(false); }
  },[]);

  useEffect(()=>{ loadSets(); },[loadSets]);

  function openCreate(){
    const nextNum = sets.length>0 ? Math.max(...sets.map(s=>s.setNumber))+1 : 1;
    setEditSet(null); setForm({name:`Set ${nextNum}`,description:'',setNumber:nextNum}); setModal(true);
  }
  function openEdit(s:QSet){ setEditSet(s); setForm({name:s.name,description:s.description,setNumber:s.setNumber}); setModal(true); }

  async function handleSave(){
    if(!form.name.trim()){showToast('Name required',false);return;}
    setSaving(true);
    try{
      const url    = editSet ? `/api/question-sets/${editSet.id}` : '/api/question-sets';
      const method = editSet ? 'PATCH' : 'POST';
      const r = await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      const d = await r.json();
      if(!r.ok){showToast(d.error??'Failed',false);return;}
      showToast(editSet?'Set updated':'Set created'); setModal(false); loadSets();
    }catch{showToast('Error',false);}
    finally{setSaving(false);}
  }

  async function handleDelete(s:QSet){
    if(!confirm(`Delete "${s.name}"? Questions in this set won't be deleted.`))return;
    setDeleting(s.id);
    try{
      const r=await fetch(`/api/question-sets/${s.id}`,{method:'DELETE'});
      if(r.ok){showToast('Set deleted');loadSets();}else showToast('Failed to delete',false);
    }finally{setDeleting(null);}
  }

  return(
    <div style={{backgroundColor:'#fff',border:'1px solid #e6bdbc',borderRadius:16}} className="shadow-sm overflow-hidden">
      {toast&&<div style={{position:'fixed',top:72,right:24,zIndex:999,backgroundColor:toast.ok?'#dcfce7':'#ffdad9',border:`1px solid ${toast.ok?'#16a34a':P}`,borderRadius:10,padding:'10px 18px',display:'flex',alignItems:'center',gap:8,boxShadow:'0 4px 16px rgba(0,0,0,.12)'}}>
        <span className="material-symbols-outlined text-base" style={{color:toast.ok?'#16a34a':P,fontVariationSettings:"'FILL' 1"}}>{toast.ok?'check_circle':'error'}</span>
        <span style={{fontSize:13,fontWeight:600,color:toast.ok?'#16a34a':P}}>{toast.msg}</span>
      </div>}

      {/* Header */}
      <div style={{borderBottom:'1px solid #e6bdbc',padding:'16px 24px'}} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base" style={{color:P,fontVariationSettings:"'FILL' 1"}}>layers</span>
          <h3 style={{fontWeight:700,fontSize:15,color:'#1c1b1b',margin:0}}>Question Sets</h3>
          <span style={{backgroundColor:'#ffdad9',color:P,borderRadius:99,fontSize:11,fontWeight:700,padding:'2px 8px'}}>{sets.length} sets</span>
        </div>
        <button onClick={openCreate} style={{backgroundColor:P,color:'#fff',borderRadius:8,padding:'7px 16px',fontSize:13,fontWeight:700,border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
          <span className="material-symbols-outlined text-base">add</span>New Set
        </button>
      </div>

      {/* Grid */}
      <div style={{padding:'16px 24px'}}>
        {loading?(
          <div className="grid grid-cols-4 gap-3">
            {[1,2,3,4].map(i=><div key={i} style={{backgroundColor:'#f0eded',borderRadius:12,height:80}} className="animate-pulse"/>)}
          </div>
        ):sets.length===0?(
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-4xl text-[#e6bdbc] block mb-2" style={{fontVariationSettings:"'FILL' 1"}}>layers</span>
            <p className="text-sm font-bold text-[#1c1b1b]">No sets yet</p>
            <p className="text-xs text-[#5c3f3f] mt-1">Create sets to organise your questions.</p>
          </div>
        ):(
          <div className="grid grid-cols-4 gap-3">
            {sets.map((s,i)=>{
              const fg=SET_TEXT[i%SET_TEXT.length]; const bg=SET_BG[i%SET_BG.length];
              return(
                <div key={s.id} style={{backgroundColor:bg,borderRadius:12,padding:'14px 16px',position:'relative'}}>
                  <div className="flex items-start justify-between mb-2">
                    <div style={{backgroundColor:fg,color:'#fff',borderRadius:99,fontSize:11,fontWeight:700,padding:'2px 8px'}}>
                      Set {s.setNumber}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={()=>openEdit(s)} style={{background:'none',border:'none',cursor:'pointer',padding:2,color:fg}} className="hover:opacity-70">
                        <span className="material-symbols-outlined" style={{fontSize:15}}>edit</span>
                      </button>
                      <button onClick={()=>handleDelete(s)} disabled={deleting===s.id} style={{background:'none',border:'none',cursor:'pointer',padding:2,color:fg}} className="hover:opacity-70 disabled:opacity-40">
                        <span className="material-symbols-outlined" style={{fontSize:15}}>delete</span>
                      </button>
                    </div>
                  </div>
                  <p style={{fontWeight:700,fontSize:13,color:fg,margin:0,lineHeight:1.3}}>{s.name}</p>
                  {s.description&&<p style={{fontSize:11,color:fg,opacity:.7,margin:'2px 0 0',lineHeight:1.3}}>{s.description}</p>}
                  <p style={{fontSize:11,fontWeight:600,color:fg,opacity:.6,margin:'6px 0 0'}}>{s.questionCount} questions</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modal&&(
        <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,.4)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
          <div style={{backgroundColor:'#fff',borderRadius:16,width:'100%',maxWidth:480,boxShadow:'0 20px 60px rgba(0,0,0,.2)'}}>
            <div style={{padding:'18px 24px',borderBottom:'1px solid #e6bdbc',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <h3 style={{fontWeight:700,fontSize:15,margin:0}}>{editSet?'Edit Set':'Create New Set'}</h3>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#5c3f3f'}}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div style={{padding:24}} className="space-y-4">
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#5c3f3f',marginBottom:6}}>Set Number <span style={{color:P}}>*</span></label>
                <input type="number" min={1} max={100} value={form.setNumber}
                  onChange={e=>setForm(f=>({...f,setNumber:parseInt(e.target.value)||1}))}
                  style={{width:'100%',border:'1px solid #e6bdbc',borderRadius:8,padding:'9px 12px',fontSize:13,color:'#1c1b1b',backgroundColor:'#f6f3f2',outline:'none'}}/>
                <p style={{fontSize:11,color:'#5c3f3f',marginTop:4}}>Used by the app to assign questions to this set (e.g. Set 1 = questions 1–20)</p>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#5c3f3f',marginBottom:6}}>Set Name <span style={{color:P}}>*</span></label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                  placeholder="e.g. Traffic Rules Basics"
                  style={{width:'100%',border:'1px solid #e6bdbc',borderRadius:8,padding:'9px 12px',fontSize:13,color:'#1c1b1b',backgroundColor:'#f6f3f2',outline:'none'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#5c3f3f',marginBottom:6}}>Description (optional)</label>
                <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                  rows={2} placeholder="Brief description of this set..."
                  style={{width:'100%',border:'1px solid #e6bdbc',borderRadius:8,padding:'9px 12px',fontSize:13,color:'#1c1b1b',backgroundColor:'#f6f3f2',outline:'none',resize:'vertical'}}/>
              </div>
            </div>
            <div style={{padding:'14px 24px',borderTop:'1px solid #e6bdbc',display:'flex',justifyContent:'flex-end',gap:10}}>
              <button onClick={()=>setModal(false)} style={{border:'1px solid #e6bdbc',borderRadius:8,padding:'9px 20px',fontSize:13,fontWeight:600,cursor:'pointer',backgroundColor:'#f6f3f2',color:'#5c3f3f'}}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{backgroundColor:P,color:'#fff',borderRadius:8,padding:'9px 24px',fontSize:13,fontWeight:700,cursor:'pointer',border:'none',opacity:saving?.7:1}}>
                {saving?'Saving…':(editSet?'Save Changes':'Create Set')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuestionsPage() {
  const [questions, setQuestions]     = useState<Question[]>([]);
  const [stats, setStats]             = useState<Stats>({ active: 0, draft: 0 });
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);
  const [activeCategory, setActiveCategory]   = useState<Category>('All');
  const [activeTopic, setActiveTopic]         = useState('All Topics');
  const [activeStatus, setActiveStatus]       = useState<Status>('All');
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty>('All');
  const [search, setSearch]           = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleting, setDeleting]       = useState<string | null>(null);
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const q = new URLSearchParams();
      if (activeCategory !== 'All')       q.set('category',   activeCategory);
      if (activeTopic !== 'All Topics')   q.set('topic',      activeTopic);
      if (activeStatus !== 'All')         q.set('status',     activeStatus);
      if (activeDifficulty !== 'All')     q.set('difficulty', activeDifficulty);
      if (debouncedSearch)                q.set('search',     debouncedSearch);
      q.set('page', String(page));
      q.set('pageSize', String(PAGE_SIZE));

      const res = await fetch(`/api/questions?${q}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setQuestions(data.items ?? []);
      setTotal(data.total ?? 0);
      setStats(data.stats ?? { active: 0, draft: 0 });
    } catch { showToast('Failed to load questions', false); }
    finally { setLoading(false); }
  }, [activeCategory, activeTopic, activeStatus, activeDifficulty, debouncedSearch, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [activeCategory, activeTopic, activeStatus, activeDifficulty, debouncedSearch]);

  async function deleteQuestion(id: string) {
    if (!confirm('Delete this question? This cannot be undone.')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
      if (res.ok) { showToast('Question deleted'); load(); }
      else showToast('Failed to delete', false);
    } finally { setDeleting(null); }
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} selected questions? This cannot be undone.`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all(Array.from(selected).map(id => fetch(`/api/questions/${id}`, { method: 'DELETE' })));
      showToast(`Deleted ${selected.size} questions`);
      setSelected(new Set());
      load();
    } catch { showToast('Failed to bulk delete', false); }
    finally { setBulkDeleting(false); }
  }

  function toggleSelect(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  function toggleAll() {
    if (selected.size === questions.length) setSelected(new Set());
    else setSelected(new Set(questions.map(q => q.id)));
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const allSelected = questions.length > 0 && selected.size === questions.length;

  return (
    <Layout title="Question Bank">
      <div className="p-6">
        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', top: 72, right: 24, zIndex: 999, backgroundColor: toast.ok ? '#dcfce7' : '#ffdad9', border: `1px solid ${toast.ok ? '#16a34a' : P}`, borderRadius: 10, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
            <span className="material-symbols-outlined text-base" style={{ color: toast.ok ? '#16a34a' : P, fontVariationSettings: "'FILL' 1" }}>{toast.ok ? 'check_circle' : 'error'}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: toast.ok ? '#16a34a' : P }}>{toast.msg}</span>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-[24px] text-[#1c1b1b]">Manage Question Bank</h1>
            <p className="text-sm text-[#5c3f3f] mt-1">Update, filter, and organize the exam curriculum for all vehicle categories.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/questions/sets" style={{ border: `1px solid ${P}`, color: P, borderRadius: 8, textDecoration: 'none' }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold hover:bg-[#ffdad9] transition-colors shrink-0">
              <span className="material-symbols-outlined text-base">folder_copy</span>
              Manage Sets
            </Link>
            <Link href="/questions/add" style={{ backgroundColor: P, color: '#fff', borderRadius: 8, textDecoration: 'none' }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold hover:opacity-90 shrink-0">
              <span className="material-symbols-outlined text-base">add_circle</span>
              Add New Question
            </Link>
          </div>
        </div>

        {/* Search + Bulk bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#5c3f3f] text-base">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search questions in English or Nepali..."
              style={{ border: '1px solid #e6bdbc', borderRadius: 8, backgroundColor: '#fff', width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, fontSize: 13, outline: 'none', color: '#1c1b1b' }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5c3f3f] hover:text-[#b1002c]">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
          {selected.size > 0 && (
            <button onClick={bulkDelete} disabled={bulkDeleting}
              style={{ backgroundColor: P, color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer', opacity: bulkDeleting ? 0.6 : 1 }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold shrink-0 hover:opacity-90">
              <span className="material-symbols-outlined text-base">delete_sweep</span>
              Delete {selected.size} selected
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 12 }} className="flex items-center gap-4 p-4 mb-4 shadow-sm flex-wrap">
          {/* Category */}
          <div className="flex-1 min-w-[150px]">
            <p className="text-xs font-bold text-[#5c3f3f] uppercase tracking-wider mb-2">Category</p>
            <div className="flex gap-1 flex-wrap">
              {(['All','A','B','K','G'] as Category[]).map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  style={{ backgroundColor: activeCategory === cat ? P : 'transparent', color: activeCategory === cat ? '#fff' : '#5c3f3f', border: `1px solid ${activeCategory === cat ? P : '#e6bdbc'}`, borderRadius: 8 }}
                  className="px-2.5 py-1.5 text-xs font-bold transition-colors hover:border-[#b1002c]">
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div className="flex-1 min-w-[150px]">
            <p className="text-xs font-bold text-[#5c3f3f] uppercase tracking-wider mb-2">Topic</p>
            <select style={{ border: '1px solid #e6bdbc', borderRadius: 8, backgroundColor: '#f6f3f2', color: '#1c1b1b' }}
              className="w-full px-3 py-2 text-sm outline-none"
              value={activeTopic} onChange={e => setActiveTopic(e.target.value)}>
              <option>All Topics</option>
              <option>Traffic Rules</option>
              <option>Vehicle Knowledge</option>
              <option>Road Signs</option>
              <option>Right of Way</option>
              <option>Road Safety Rules</option>
              <option>Technical Knowledge</option>
              <option>Legal Provisions</option>
              <option>Environmental Issues</option>
            </select>
          </div>

          {/* Difficulty */}
          <div className="flex-1 min-w-[140px]">
            <p className="text-xs font-bold text-[#5c3f3f] uppercase tracking-wider mb-2">Difficulty</p>
            <div className="flex gap-1">
              {(['All','Easy','Medium','Hard'] as Difficulty[]).map(d => {
                const c = DIFF_COLOR[d];
                const isActive = activeDifficulty === d;
                return (
                  <button key={d} onClick={() => setActiveDifficulty(d)}
                    style={{ backgroundColor: isActive ? (c?.bg ?? P) : 'transparent', color: isActive ? (c?.text ?? '#fff') : '#5c3f3f', border: `1px solid ${isActive ? (c?.text ?? P) : '#e6bdbc'}`, borderRadius: 8 }}
                    className="flex-1 py-1.5 text-xs font-bold transition-colors hover:border-[#b1002c]">
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div className="flex-1 min-w-[130px]">
            <p className="text-xs font-bold text-[#5c3f3f] uppercase tracking-wider mb-2">Status</p>
            <div className="flex gap-1">
              {(['All','Active','Draft'] as Status[]).map(s => (
                <button key={s} onClick={() => setActiveStatus(s)}
                  style={{ backgroundColor: activeStatus === s ? P : 'transparent', color: activeStatus === s ? '#fff' : '#5c3f3f', border: `1px solid ${activeStatus === s ? P : '#e6bdbc'}`, borderRadius: 8 }}
                  className="flex-1 py-1.5 text-xs font-bold transition-colors hover:border-[#b1002c]">
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="ml-auto">
            <button onClick={load}
              style={{ border: `2px solid ${S}`, color: S, borderRadius: 8, backgroundColor: '#f0f4ff' }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold hover:bg-[#dae1ff] transition-colors">
              <span className="material-symbols-outlined text-base">refresh</span>
              Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 12 }} className="overflow-hidden shadow-sm mb-4">
          {/* Table Header */}
          <div className="grid text-xs font-bold uppercase tracking-wider text-[#5c3f3f] px-5 py-3"
            style={{ backgroundColor: '#f6f3f2', borderBottom: '1px solid #e6bdbc', gridTemplateColumns: '32px 2.5fr 0.8fr 1fr 0.7fr 0.7fr 0.8fr' } as React.CSSProperties}>
            <input type="checkbox" checked={allSelected} onChange={toggleAll}
              className="accent-[#b1002c] w-4 h-4 mt-0.5 cursor-pointer" />
            <span>Question</span>
            <span>Category</span>
            <span>Topic</span>
            <span>Difficulty</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          {loading ? (
            [1,2,3,4,5].map(i => <SkeletonRow key={i} />)
          ) : questions.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <span className="material-symbols-outlined text-6xl mb-3 block" style={{ color: '#e6bdbc', fontVariationSettings: "'FILL' 1" }}>quiz</span>
              <p className="text-sm font-bold text-[#1c1b1b]">No questions found</p>
              <p className="text-xs text-[#5c3f3f] mt-1">
                {debouncedSearch ? `No results for "${debouncedSearch}"` : 'Try changing the filters or add a new question.'}
              </p>
            </div>
          ) : (
            questions.map(q => {
              const diffStyle = DIFF_COLOR[q.difficulty] ?? { bg: '#f0eded', text: '#5c3f3f' };
              return (
                <div key={q.id}
                  style={{ borderBottom: '1px solid #e6bdbc20', gridTemplateColumns: '32px 2.5fr 0.8fr 1fr 0.7fr 0.7fr 0.8fr', backgroundColor: selected.has(q.id) ? '#fdf0f0' : undefined } as React.CSSProperties}
                  className="grid items-center px-5 py-4 hover:bg-[#fdf5f5] transition-colors">
                  <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggleSelect(q.id)}
                    className="accent-[#b1002c] w-4 h-4 cursor-pointer" />
                  <div>
                    <p className="text-sm font-bold text-[#1c1b1b] line-clamp-1">{q.questionEn}</p>
                    <p className="text-xs text-[#5c3f3f] line-clamp-1">{q.questionNp}</p>
                  </div>
                  <div>
                    <span style={{ backgroundColor: CATEGORY_BG[q.category] ?? '#f0eded', color: CATEGORY_TEXT[q.category] ?? '#5c3f3f', borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
                      Cat {q.category}
                    </span>
                    {q.setNumber ? <span style={{ marginLeft: 4, backgroundColor: SET_BG[(q.setNumber-1)%SET_BG.length], color: SET_TEXT[(q.setNumber-1)%SET_TEXT.length], borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>S{q.setNumber}</span> : null}
                  </div>
                  <span className="text-xs text-[#5c3f3f] line-clamp-1">{q.topic}</span>
                  <div>
                    <span style={{ backgroundColor: diffStyle.bg, color: diffStyle.text, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                      {q.difficulty || '—'}
                    </span>
                  </div>
                  <div>
                    <span style={{ backgroundColor: q.status === 'Active' ? '#dcfce7' : '#fef9c3', color: q.status === 'Active' ? '#16a34a' : '#a16207', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: q.status === 'Active' ? '#16a34a' : '#a16207' }} />
                      {q.status}
                    </span>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Link href={`/questions/add?edit=${q.id}`} className="text-[#5c3f3f] hover:text-[#335ab4] transition-colors" title="Edit">
                      <span className="material-symbols-outlined text-base">edit</span>
                    </Link>
                    <button onClick={() => deleteQuestion(q.id)} disabled={deleting === q.id}
                      className="text-[#5c3f3f] hover:text-[#b1002c] transition-colors disabled:opacity-40" title="Delete">
                      <span className="material-symbols-outlined text-base">{deleting === q.id ? 'progress_activity' : 'delete'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination */}
          <div style={{ borderTop: '1px solid #e6bdbc', backgroundColor: '#f6f3f2' }} className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-[#5c3f3f]">
              {total === 0 ? 'No questions' : <>Showing <strong>{Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)}</strong> of <strong>{total}</strong> questions</>}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ border: '1px solid #e6bdbc', borderRadius: 8, color: '#5c3f3f' }}
                className="w-8 h-8 flex items-center justify-center hover:bg-[#e6bdbc] transition-colors disabled:opacity-40">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ backgroundColor: p === page ? P : 'transparent', color: p === page ? '#fff' : '#5c3f3f', border: `1px solid ${p === page ? P : '#e6bdbc'}`, borderRadius: 8 }}
                    className="w-8 h-8 flex items-center justify-center text-sm font-bold hover:border-[#b1002c] transition-colors">
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
                style={{ border: '1px solid #e6bdbc', borderRadius: 8, color: '#5c3f3f' }}
                className="w-8 h-8 flex items-center justify-center hover:bg-[#e6bdbc] transition-colors disabled:opacity-40">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sets Section */}
        <SetsSection />

        {/* Stats footer */}
        <div className="grid grid-cols-3 gap-4">
          <div style={{ backgroundColor: P, borderRadius: 16, color: '#fff' }} className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Total Questions</p>
            <div className="flex justify-between items-center">
              <span className="font-display font-bold text-3xl">{total}</span>
              <span className="material-symbols-outlined text-5xl opacity-20" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
            </div>
            <div style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 99, marginTop: 16 }}>
              <div style={{ width: total > 0 ? `${Math.min(100, (stats.active / total) * 100)}%` : '0%', height: '100%', backgroundColor: '#fff', borderRadius: 99 }} />
            </div>
          </div>
          <div style={{ backgroundColor: S, borderRadius: 16, color: '#fff' }} className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Active Questions</p>
            <div className="flex justify-between items-center">
              <div>
                <span className="font-display font-bold text-3xl">{stats.active}</span>
                <p className="text-xs opacity-80 mt-1">{total > 0 ? Math.round((stats.active / total) * 100) : 0}% of total bank</p>
              </div>
              <span className="material-symbols-outlined text-5xl opacity-20" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
          </div>
          <div style={{ backgroundColor: '#705d00', borderRadius: 16, color: '#fff' }} className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Pending Review</p>
            <div className="flex justify-between items-center">
              <div>
                <span className="font-display font-bold text-3xl">{stats.draft}</span>
                <p className="text-xs opacity-80 mt-1">Draft questions</p>
              </div>
              <span className="material-symbols-outlined text-5xl opacity-20" style={{ fontVariationSettings: "'FILL' 1" }}>pending</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
