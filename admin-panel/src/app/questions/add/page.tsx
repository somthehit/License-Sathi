"use client";

import React, { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';

const P = '#b1002c';
const S = '#335ab4';
type Difficulty = 'Easy' | 'Medium' | 'Hard';
type Mode = 'single' | 'bulk';
type ImgSrc = 'upload' | 'url';
const TOPICS = ['Traffic Rules','Vehicle Knowledge','Road Signs','Right of Way','Road Safety Rules','Technical Knowledge','Legal Provisions','Environmental Issues'];
const CATS = [{value:'ALL',label:'ALL — Every category'},{value:'A',label:'A — Motorcycle / Bike'},{value:'B',label:'B — Car / Jeep / Van'},{value:'K',label:'K — Scooter / Moped'},{value:'G',label:'G — Tractor'}];
const OPT = ['A','B','C','D'];
const DIFF_COL: Record<Difficulty,{t:string;b:string}> = {Easy:{t:'#16a34a',b:'#dcfce7'},Medium:{t:'#a16207',b:'#fef9c3'},Hard:{t:P,b:'#ffdad9'}};
// Sets 1–20 (set 0 = "Unassigned")
const SET_OPTIONS = [{value:0,label:'— Unassigned (auto-ordered)'},...Array.from({length:20},(_,i)=>({value:i+1,label:`Set ${i+1} (Questions ${i*20+1}–${(i+1)*20})`}))];
const SET_COLORS = ['#335ab4','#16a34a','#b1002c','#a16207','#6d28d9','#0891b2','#be185d','#065f46','#9a3412','#1e40af'];

function Sec({icon,title,children}:{icon:string;title:string;children:React.ReactNode}) {
  return (
    <div style={{backgroundColor:'#fff',border:'1px solid #e6bdbc',borderRadius:16}} className="shadow-sm overflow-hidden">
      <div style={{borderBottom:'1px solid #e6bdbc',padding:'14px 24px'}} className="flex items-center gap-2">
        <span className="material-symbols-outlined text-base" style={{color:P,fontVariationSettings:"'FILL' 1"}}>{icon}</span>
        <h3 style={{fontWeight:700,fontSize:14,color:'#1c1b1b',margin:0}}>{title}</h3>
      </div>
      <div style={{padding:'20px 24px'}}>{children}</div>
    </div>
  );
}
function Toggle({on,onChange}:{on:boolean;onChange:(v:boolean)=>void}) {
  return (
    <div onClick={()=>onChange(!on)} style={{width:44,height:24,borderRadius:99,backgroundColor:on?P:'#e6bdbc',cursor:'pointer',position:'relative',flexShrink:0}}>
      <div style={{position:'absolute',top:3,left:on?23:3,width:18,height:18,borderRadius:'50%',backgroundColor:'#fff',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
    </div>
  );
}

// ── CSV helpers ───────────────────────────────────────────────────────────────
const CSV_COLS = ['category','topic','difficulty','setNumber','questionEn','questionNp',
  'optionAEn','optionANp','optionBEn','optionBNp','optionCEn','optionCNp','optionDEn','optionDNp',
  'correctOptionIndex','explanationEn','explanationNp','status'];

interface BRow { row:number;category:string;topic:string;difficulty:string;setNumber:string;
  questionEn:string;questionNp:string;optionAEn:string;optionANp:string;
  optionBEn:string;optionBNp:string;optionCEn:string;optionCNp:string;
  optionDEn:string;optionDNp:string;correctOptionIndex:string;
  explanationEn:string;explanationNp:string;status:string; }

function dlTpl() {
  const ex=['ALL','Traffic Rules','Medium','1',
    'Minimum age for heavy vehicle license?','ठूलो सवारीको लाइसेन्सको न्यूनतम उमेर?',
    '16 years','१६ वर्ष','18 years','१८ वर्ष','21 years','२१ वर्ष','25 years','२५ वर्ष',
    '2','Must be at least 21.','न्यूनतम २१ वर्ष।','Active'].map(v=>`"${v}"`).join(',');
  const blob=new Blob([CSV_COLS.join(',')+'\n'+ex],{type:'text/csv'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='questions_template.csv';a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text:string):BRow[] {
  const lines=text.trim().split('\n'); if(lines.length<2) return [];
  const hdrs=lines[0].replace(/^\uFEFF/,'').split(',').map(h=>h.trim().replace(/^"|"$/g,''));
  return lines.slice(1).map((line,i)=>{
    const vals:string[]=[]; let inQ=false,cur='';
    for(const ch of line){if(ch==='"'){inQ=!inQ;}else if(ch===','&&!inQ){vals.push(cur.trim());cur='';}else{cur+=ch;}}
    vals.push(cur.trim());
    const r:Record<string,string>={};
    hdrs.forEach((h,j)=>{r[h]=(vals[j]??'').replace(/^"|"$/g,'').trim();});
    return{row:i+2,category:r.category??'ALL',topic:r.topic??'',difficulty:r.difficulty??'Medium',
      questionEn:r.questionEn??'',questionNp:r.questionNp??'',
      optionAEn:r.optionAEn??'',optionANp:r.optionANp??'',optionBEn:r.optionBEn??'',optionBNp:r.optionBNp??'',
      optionCEn:r.optionCEn??'',optionCNp:r.optionCNp??'',optionDEn:r.optionDEn??'',optionDNp:r.optionDNp??'',
      correctOptionIndex:r.correctOptionIndex??'0',explanationEn:r.explanationEn??'',
      explanationNp:r.explanationNp??'',status:r.status??'Draft',setNumber:r.setNumber??'0'} as BRow;
  }).filter(r=>r.questionEn||r.category);
}

function BulkPanel() {
  const csvRef=useRef<HTMLInputElement>(null);
  const router=useRouter();
  const [rows,setRows]=useState<BRow[]>([]);
  const [fname,setFname]=useState('');
  const [busy,setBusy]=useState(false);
  const [res,setRes]=useState<{written:number;skipped:number;errors:{row:number;message:string}[]}|null>(null);
  const [err,setErr]=useState('');
  const load=useCallback((e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0]; if(!f) return;
    setFname(f.name);setRes(null);setErr('');
    const rd=new FileReader();rd.onload=ev=>setRows(parseCSV(ev.target?.result as string));rd.readAsText(f,'utf-8');
  },[]);
  function drop(e:React.DragEvent){e.preventDefault();const f=e.dataTransfer.files[0];
    if(!f||!f.name.endsWith('.csv'))return;setFname(f.name);setRes(null);setErr('');
    const rd=new FileReader();rd.onload=ev=>setRows(parseCSV(ev.target?.result as string));rd.readAsText(f,'utf-8');}
  async function upload(){
    if(!rows.length)return; setBusy(true);setErr('');
    try{
      const qs=rows.map(r=>({category:r.category,topic:r.topic,difficulty:r.difficulty,
        questionEn:r.questionEn,questionNp:r.questionNp,
        optionsEn:[r.optionAEn,r.optionBEn,r.optionCEn,r.optionDEn].join('|'),
        optionsNp:[r.optionANp,r.optionBNp,r.optionCNp,r.optionDNp].join('|'),
        correctOptionIndex:parseInt(r.correctOptionIndex||'0',10)||0,
        explanationEn:r.explanationEn,explanationNp:r.explanationNp,status:r.status}));
      const resp=await fetch('/api/questions/bulk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({questions:qs})});
      const d=await resp.json();
      if(!resp.ok){setErr(d.error??'Upload failed');return;}
      setRes(d);if(d.written>0&&d.skipped===0)setTimeout(()=>router.push('/questions'),1800);
    }catch{setErr('Network error.');}finally{setBusy(false);}
  }
  const is:React.CSSProperties={fontSize:12,color:'#1c1b1b',padding:'4px 8px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:140};
  return(
    <div className="space-y-5">
      <Sec icon="download" title="CSV Template">
        <p className="text-sm text-[#5c3f3f] mb-3">Required columns:</p>
        <div className="flex flex-wrap gap-1.5 mb-3">{CSV_COLS.map(c=><span key={c} style={{backgroundColor:'#f6f3f2',border:'1px solid #e6bdbc',borderRadius:4,fontSize:11,fontWeight:600,color:'#1c1b1b',padding:'2px 8px'}}>{c}</span>)}</div>
        <div className="grid grid-cols-3 gap-2 text-xs text-[#5c3f3f] mb-4">
          <div><strong>category</strong> — ALL,A,B,K,G</div><div><strong>correctOptionIndex</strong> — 0,1,2,3</div>
          <div><strong>difficulty</strong> — Easy,Medium,Hard</div><div><strong>status</strong> — Active,Draft</div>
        </div>
        <button onClick={dlTpl} style={{backgroundColor:S,color:'#fff',borderRadius:8,padding:'9px 20px',fontSize:13,fontWeight:700,border:'none',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:8}}>
          <span className="material-symbols-outlined text-base">download</span>Download Template
        </button>
      </Sec>
      <Sec icon="upload_file" title="Upload CSV">
        <div onDrop={drop} onDragOver={e=>e.preventDefault()} onClick={()=>csvRef.current?.click()}
          style={{border:`2px dashed ${rows.length>0?'#16a34a':'#e6bdbc'}`,borderRadius:12,backgroundColor:rows.length>0?'#f0fdf4':'#f6f3f2',padding:'32px 24px',display:'flex',flexDirection:'column',alignItems:'center',gap:10,cursor:'pointer',marginBottom:16}}>
          <span className="material-symbols-outlined text-4xl" style={{color:rows.length>0?'#16a34a':'#c0a0a0'}}>{rows.length>0?'check_circle':'upload_file'}</span>
          {rows.length>0?<><p style={{fontSize:14,fontWeight:700,color:'#16a34a',margin:0}}>{fname}</p><p style={{fontSize:12,color:'#5c3f3f',margin:'2px 0 0'}}>{rows.length} rows ready</p></>
            :<><p style={{fontSize:14,fontWeight:700,color:'#1c1b1b',margin:0}}>Click or drag & drop CSV</p><p style={{fontSize:12,color:'#5c3f3f',margin:'2px 0 0'}}>Max 1,000 rows</p></>}
        </div>
        <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={load}/>
        {rows.length>0&&(
          <div style={{border:'1px solid #e6bdbc',borderRadius:10,overflow:'hidden',marginBottom:16}}>
            <div style={{backgroundColor:'#f6f3f2',borderBottom:'1px solid #e6bdbc',padding:'8px 12px',display:'flex',justifyContent:'space-between'}}>
              <span style={{fontSize:12,fontWeight:700}}>Preview — first 5 rows</span>
              <button onClick={()=>{setRows([]);setFname('');if(csvRef.current)csvRef.current.value='';}} style={{fontSize:11,fontWeight:600,color:P,background:'none',border:'none',cursor:'pointer'}}>Clear</button>
            </div>
            <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
              <thead><tr style={{backgroundColor:'#f6f3f2'}}>
                {['#','Cat','Topic','Q(EN)','A','B','C','D','✓','Status'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'left',color:'#5c3f3f',fontWeight:700,borderBottom:'1px solid #e6bdbc',whiteSpace:'nowrap'}}>{h}</th>)}
              </tr></thead>
              <tbody>{rows.slice(0,5).map((r,i)=>(
                <tr key={i} style={{borderBottom:'1px solid #e6bdbc20'}}>
                  <td style={{...is,color:'#5c3f3f'}}>{r.row}</td><td style={is}>{r.category}</td><td style={is}>{r.topic}</td>
                  <td style={{...is,maxWidth:180}}>{r.questionEn}</td><td style={is}>{r.optionAEn}</td><td style={is}>{r.optionBEn}</td>
                  <td style={is}>{r.optionCEn}</td><td style={is}>{r.optionDEn}</td>
                  <td style={{...is,fontWeight:700,color:P}}>{r.correctOptionIndex}</td>
                  <td style={{...is,color:r.status==='Active'?'#16a34a':'#a16207'}}>{r.status}</td>
                </tr>))}</tbody>
            </table></div>
            {rows.length>5&&<p style={{fontSize:11,color:'#5c3f3f',padding:'6px 12px',textAlign:'center'}}>…and {rows.length-5} more</p>}
          </div>
        )}
        {err&&<div style={{backgroundColor:'#ffdad9',border:'1px solid #b1002c40',borderRadius:8,padding:'10px 14px',marginBottom:12}}><span style={{fontSize:13,color:P,fontWeight:600}}>{err}</span></div>}
        {res&&<div style={{backgroundColor:res.written>0?'#f0fdf4':'#fef9c3',border:`1px solid ${res.written>0?'#16a34a':'#a16207'}40`,borderRadius:8,padding:'14px 16px',marginBottom:12}}>
          <p style={{fontSize:14,fontWeight:700,color:res.written>0?'#16a34a':'#a16207',margin:'0 0 8px'}}>{res.written>0?`✔ ${res.written} imported!`:'No questions imported.'}{res.skipped>0&&` (${res.skipped} skipped)`}</p>
          {res.errors.map((e,i)=><p key={i} style={{fontSize:12,color:P,margin:0}}>Row {e.row}: {e.message}</p>)}
        </div>}
        <button onClick={upload} disabled={!rows.length||busy}
          style={{backgroundColor:P,color:'#fff',borderRadius:8,padding:'10px 24px',fontSize:14,fontWeight:700,border:'none',cursor:rows.length?'pointer':'default',opacity:!rows.length||busy?0.5:1,display:'inline-flex',alignItems:'center',gap:8}}>
          {busy?<span className="material-symbols-outlined text-base animate-spin">progress_activity</span>:<span className="material-symbols-outlined text-base" style={{fontVariationSettings:"'FILL' 1"}}>upload</span>}
          {busy?'Uploading...':`Import ${rows.length||''} Question${rows.length!==1?'s':''}`}
        </button>
      </Sec>
    </div>
  );
}

// ── Inner page (useSearchParams requires Suspense boundary) ───────────────────
function Inner() {
  const router=useRouter();
  const sp=useSearchParams();
  const editId=sp.get('edit');
  const isEdit=Boolean(editId);
  const imgRef=useRef<HTMLInputElement>(null);

  const [mode,setMode]=useState<Mode>('single');
  const [imgSrc,setImgSrc]=useState<ImgSrc>('upload');
  const [loadingEdit,setLoadingEdit]=useState(isEdit);

  const [cat,setCat]=useState('ALL');
  const [topic,setTopic]=useState('Traffic Rules');
  const [diff,setDiff]=useState<Difficulty>('Medium');
  const [setId, setSetId] = useState<string>('');
  const [sets, setSets] = useState<{id: string, name: string}[]>([]);
  const [qEn,setQEn]=useState('');
  const [qNp,setQNp]=useState('');
  const [optsEn,setOptsEn]=useState(['','','','']);
  const [optsNp,setOptsNp]=useState(['','','','']);
  const [correct,setCorrect]=useState<number|null>(null);
  const [expEn,setExpEn]=useState('');
  const [expNp,setExpNp]=useState('');
  const [imgFile,setImgFile]=useState<File|null>(null);
  const [imgUrl,setImgUrl]=useState('');
  const [imgPrev,setImgPrev]=useState<string|null>(null);
  const [existImg,setExistImg]=useState<string|null>(null);
  const [pub,setPub]=useState(true);
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState<{msg:string;ok:boolean}|null>(null);

  const showToast=(msg:string,ok=true)=>{setToast({msg,ok});setTimeout(()=>setToast(null),3500);};

  const loadQ=useCallback(async()=>{
    if(!editId)return;
    try{
      const res=await fetch(`/api/questions/${editId}`);
      if(!res.ok)throw new Error();
      const d=await res.json();
      setCat(d.category??'ALL');setTopic(d.topic??'Traffic Rules');setDiff(d.difficulty??'Medium');
      if (d.setId) setSetId(d.setId);
      if (d.setNumber) setSetId(String(d.setNumber));
      setQEn(d.questionEn??'');setQNp(d.questionNp??'');
      setExpEn(d.explanationEn??d.explanation??'');setExpNp(d.explanationNp??'');
      setPub(d.status==='Active');
      setCorrect(typeof d.correctOptionIndex==='number'?d.correctOptionIndex:null);
      if(d.optionsEn)setOptsEn(d.optionsEn.split('|').map((s:string)=>s.trim()));
      if(d.optionsNp)setOptsNp(d.optionsNp.split('|').map((s:string)=>s.trim()));
      if(d.imageRef){setExistImg(d.imageRef);setImgPrev(d.imageRef);if(d.imageRef.startsWith('http')){setImgUrl(d.imageRef);setImgSrc('url');}}
    }catch{showToast('Failed to load',false);}
    finally{setLoadingEdit(false);}
  },[editId]);

  useEffect(()=>{if(isEdit)loadQ();},[isEdit,loadQ]);

  useEffect(()=>{
    async function loadSets() {
      try {
        const res = await fetch('/api/question-sets');
        if (res.ok) {
          const data = await res.json();
          setSets(data.items ?? []);
        }
      } catch (e) { /* silent */ }
    }
    loadSets();
  },[]);

  async function submit(status:'Draft'|'Active'){
    if(!qEn.trim()){showToast('English question required',false);return;}
    if(correct===null){showToast('Select correct answer',false);return;}
    if(optsEn.some(o=>!o.trim())){showToast('All 4 English options required',false);return;}
    setSaving(true);
    try{
      let finalImg:string|null=existImg;
      if(imgSrc==='upload'&&imgFile){const{uploadImage:up}=await import('@/lib/uploadImage');finalImg=await up(imgFile,'questions');}
      else if(imgSrc==='url'&&imgUrl.trim()){finalImg=imgUrl.trim();}
      const payload={category:cat,topic,difficulty:diff,
        setNumber:setId?parseInt(setId,10):null,
        questionEn:qEn.trim(),questionNp:qNp.trim(),
        optionsEn:optsEn.map(o=>o.trim()).join('|'),
        optionsNp:optsNp.map(o=>o.trim()).join('|'),
        correctOptionIndex:correct,explanationEn:expEn.trim(),explanationNp:expNp.trim(),
        imageRef:finalImg,status};
      const res=isEdit
        ?await fetch(`/api/questions/${editId}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
        :await fetch('/api/questions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if(!res.ok){const e=await res.json();showToast(e.error??'Failed',false);return;}
      showToast(isEdit?'Updated':status==='Active'?'Added to bank':'Saved as draft');
      setTimeout(()=>router.push('/questions'),1200);
    }catch{showToast('Error occurred',false);}
    finally{setSaving(false);}
  }

  const L:React.CSSProperties={display:'block',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#5c3f3f',marginBottom:6};
  const I:React.CSSProperties={width:'100%',border:'1px solid #e6bdbc',borderRadius:8,padding:'9px 12px',fontSize:13,color:'#1c1b1b',backgroundColor:'#f6f3f2',outline:'none',boxSizing:'border-box'};

  return(
    <Layout title="Question Bank">
      <div className="p-6 max-w-4xl mx-auto">
        {toast&&<div style={{position:'fixed',top:72,right:24,zIndex:999,backgroundColor:toast.ok?'#dcfce7':'#ffdad9',border:`1px solid ${toast.ok?'#16a34a':P}`,borderRadius:10,padding:'10px 18px',display:'flex',alignItems:'center',gap:8,boxShadow:'0 4px 16px rgba(0,0,0,0.12)'}}>
          <span className="material-symbols-outlined text-base" style={{color:toast.ok?'#16a34a':P,fontVariationSettings:"'FILL' 1"}}>{toast.ok?'check_circle':'error'}</span>
          <span style={{fontSize:13,fontWeight:600,color:toast.ok?'#16a34a':P}}>{toast.msg}</span>
        </div>}

        <div className="flex items-center gap-2 mb-5 text-sm">
          <Link href="/questions" style={{color:'#5c3f3f',textDecoration:'none',fontWeight:600}} className="hover:text-[#b1002c]">Question Bank</Link>
          <span className="material-symbols-outlined text-base text-[#5c3f3f]">chevron_right</span>
          <span style={{color:P,fontWeight:700}}>{isEdit?'Edit Question':'Add New Question'}</span>
        </div>

        {loadingEdit?(<div className="space-y-5">{[1,2,3].map(i=>(
          <div key={i} style={{backgroundColor:'#fff',border:'1px solid #e6bdbc',borderRadius:16}} className="p-6 animate-pulse">
            <div style={{backgroundColor:'#f0eded',borderRadius:4,height:14,width:'30%',marginBottom:20}}/>
            <div style={{backgroundColor:'#f0eded',borderRadius:4,height:40,width:'100%',marginBottom:12}}/>
            <div style={{backgroundColor:'#f0eded',borderRadius:4,height:40,width:'100%'}}/>
          </div>))}</div>
        ):(
          <>
            <div className="flex items-start justify-between mb-6 gap-4">
              <div>
                <h1 className="font-display font-bold text-[24px] text-[#1c1b1b]">{isEdit?'Edit Question':'Add New Question'}</h1>
                <p className="text-sm text-[#5c3f3f] mt-1">Schema matches the mobile app — uses pipe-separated options and 0-indexed correct answer.</p>
              </div>
              {!isEdit&&(
                <div style={{display:'inline-flex',border:'1px solid #e6bdbc',borderRadius:10,overflow:'hidden',backgroundColor:'#f6f3f2',flexShrink:0}}>
                  {(['single','bulk'] as Mode[]).map(m=>{const a=mode===m;return(
                    <button key={m} onClick={()=>setMode(m)} style={{padding:'8px 16px',fontSize:13,fontWeight:a?700:500,color:a?P:'#5c3f3f',backgroundColor:a?'#fff':'transparent',border:'none',borderRight:m==='single'?'1px solid #e6bdbc':'none',cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                      <span className="material-symbols-outlined text-base">{m==='single'?'edit':'upload_file'}</span>
                      {m==='single'?'Single Question':'Bulk CSV'}
                    </button>);})}
                </div>
              )}
            </div>

            {mode==='bulk'&&<BulkPanel/>}

            {mode==='single'&&(
              <div className="space-y-5">
                <Sec icon="info" title="Basic Information">
                  <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                    <div><label style={L}>Category</label>
                      <select style={I} value={cat} onChange={e=>setCat(e.target.value)}>
                        {CATS.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                    <div><label style={L}>Topic</label>
                      <select style={I} value={topic} onChange={e=>setTopic(e.target.value)}>
                        {TOPICS.map(t=><option key={t}>{t}</option>)}</select></div>
                    <div><label style={L}>Question Set</label>
                      <select style={I} value={setId} onChange={e=>setSetId(e.target.value)}>
                        <option value="">— Unassigned —</option>
                        {sets.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                      </select></div>
                    <div><label style={L}>Difficulty</label>
                      <div className="flex gap-1">{(['Easy','Medium','Hard'] as Difficulty[]).map(d=>(
                        <button key={d} type="button" onClick={()=>setDiff(d)}
                          style={{flex:1,padding:'8px 4px',borderRadius:8,border:`1px solid ${diff===d?DIFF_COL[d].t:'#e6bdbc'}`,backgroundColor:diff===d?DIFF_COL[d].b:'#f6f3f2',color:diff===d?DIFF_COL[d].t:'#5c3f3f',fontWeight:700,fontSize:12,cursor:'pointer'}}>
                          {d}</button>))}</div></div>
                  </div>
                </Sec>

                <Sec icon="translate" title="Question Content">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <label style={{...L,margin:0}}>English Question</label>
                        <span style={{backgroundColor:S,color:'#fff',fontSize:9,fontWeight:700,borderRadius:4,padding:'2px 6px'}}>EN</span>
                      </div>
                      <textarea rows={3} style={{...I,resize:'vertical'}} placeholder="Enter question in English..." value={qEn} onChange={e=>setQEn(e.target.value)}/>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <label style={{...L,margin:0}}>Nepali Question</label>
                        <span style={{backgroundColor:'#a16207',color:'#fff',fontSize:9,fontWeight:700,borderRadius:4,padding:'2px 6px'}}>NP</span>
                      </div>
                      <textarea rows={3} style={{...I,resize:'vertical'}} placeholder="नेपालीमा प्रश्न..." value={qNp} onChange={e=>setQNp(e.target.value)}/>
                    </div>
                  </div>
                </Sec>

                <Sec icon="list_alt" title="Answer Options">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-[#5c3f3f]">Enter all 4 options. Click the circle to mark the correct answer (index 0–3).</p>
                    <span style={{backgroundColor:'#ffdad9',color:P,fontSize:11,fontWeight:700,borderRadius:6,padding:'3px 10px'}}>
                      {correct!==null?`Option ${OPT[correct]} is correct`:'No answer selected'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {[0,1,2,3].map(idx=>{const isC=correct===idx;return(
                      <div key={idx} style={{display:'flex',gap:12,alignItems:'flex-start',padding:12,border:`1px solid ${isC?P:'#e6bdbc'}`,backgroundColor:isC?'#ffdad920':'#fff',borderRadius:12}}>
                        <button type="button" onClick={()=>setCorrect(idx)}
                          style={{marginTop:8,border:`2px solid ${isC?P:'#c0a0a0'}`,backgroundColor:isC?P:'transparent',borderRadius:'50%',width:20,height:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          {isC&&<span style={{width:8,height:8,borderRadius:'50%',backgroundColor:'#fff'}}/>}
                        </button>
                        <div style={{fontWeight:700,fontSize:14,color:isC?P:'#5c3f3f',marginTop:7,width:20}}>{OPT[idx]}</div>
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <input style={I} placeholder={`Option ${OPT[idx]} (English)`} value={optsEn[idx]}
                            onChange={e=>setOptsEn(p=>{const a=[...p];a[idx]=e.target.value;return a;})}/>
                          <input style={I} placeholder={`विकल्प ${OPT[idx]} (नेपाली)`} value={optsNp[idx]}
                            onChange={e=>setOptsNp(p=>{const a=[...p];a[idx]=e.target.value;return a;})}/>
                        </div>
                      </div>);})}
                  </div>
                </Sec>

                <Sec icon="image" title="Media (Optional)">
                  <div className="flex gap-5">
                    <div style={{width:220,flexShrink:0}} className="space-y-3">
                      <div style={{display:'flex',border:'1px solid #e6bdbc',borderRadius:8,overflow:'hidden',backgroundColor:'#f6f3f2'}}>
                        {(['upload','url'] as ImgSrc[]).map((s,i)=>(
                          <button key={s} type="button" onClick={()=>setImgSrc(s)}
                            style={{flex:1,padding:'6px 12px',fontSize:12,fontWeight:imgSrc===s?700:500,color:imgSrc===s?P:'#5c3f3f',backgroundColor:imgSrc===s?'#fff':'transparent',border:'none',borderLeft:i>0?'1px solid #e6bdbc':'none',cursor:'pointer'}}>
                            {s==='upload'?'Upload':'Paste URL'}</button>))}
                      </div>
                      <div onClick={()=>imgSrc==='upload'&&imgRef.current?.click()}
                        style={{width:'100%',height:140,border:`2px dashed ${imgPrev?P:'#e6bdbc'}`,borderRadius:12,backgroundColor:'#f6f3f2',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,cursor:imgSrc==='upload'?'pointer':'default',overflow:'hidden'}}>
                        {imgPrev
                          // eslint-disable-next-line @next/next/no-img-element
                          ?<img src={imgPrev} alt="preview" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
                          :<><span className="material-symbols-outlined text-3xl text-[#e6bdbc]">image</span>
                            <p className="text-[11px] text-[#5c3f3f] text-center px-2">{imgSrc==='upload'?'Click to upload':'No URL'}</p></>}
                      </div>
                    </div>
                    <input ref={imgRef} type="file" accept="image/png,image/jpeg" className="hidden"
                      onChange={e=>{const f=e.target.files?.[0];if(!f)return;setImgFile(f);setImgPrev(URL.createObjectURL(f));setExistImg(null);setImgUrl('');}}/>
                    <div className="flex-1">
                      {imgSrc==='url'&&(
                        <div className="space-y-2">
                          <label style={L}>Image URL</label>
                          <input type="text" style={I} placeholder="https://example.com/sign.png" value={imgUrl}
                            onChange={e=>{setImgUrl(e.target.value);setImgPrev(e.target.value.trim()||null);setImgFile(null);setExistImg(null);}}/>
                        </div>
                      )}
                      {imgPrev&&<button type="button" onClick={()=>{setImgFile(null);setImgUrl('');setImgPrev(null);setExistImg(null);if(imgRef.current)imgRef.current.value='';}}
                        style={{marginTop:12,border:'1px solid #e6bdbc',borderRadius:8,padding:'7px 16px',fontSize:12,fontWeight:600,color:P,backgroundColor:'#ffdad9',cursor:'pointer'}}>
                        Clear Image</button>}
                    </div>
                  </div>
                </Sec>

                <Sec icon="psychology" title="Explanation & Publish">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5"><label style={{...L,margin:0}}>Explanation (English)</label>
                          <span style={{backgroundColor:S,color:'#fff',fontSize:9,fontWeight:700,borderRadius:4,padding:'2px 6px'}}>EN</span></div>
                        <textarea rows={3} style={{...I,resize:'vertical'}} placeholder="Why is this correct?" value={expEn} onChange={e=>setExpEn(e.target.value)}/>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1.5"><label style={{...L,margin:0}}>Explanation (Nepali)</label>
                          <span style={{backgroundColor:'#a16207',color:'#fff',fontSize:9,fontWeight:700,borderRadius:4,padding:'2px 6px'}}>NP</span></div>
                        <textarea rows={3} style={{...I,resize:'vertical'}} placeholder="यो उत्तर किन सही छ?" value={expNp} onChange={e=>setExpNp(e.target.value)}/>
                      </div>
                    </div>
                    <div style={{borderTop:'1px solid #e6bdbc',paddingTop:16}} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Toggle on={pub} onChange={setPub}/>
                        <div><p style={{fontSize:13,fontWeight:700,color:'#1c1b1b',margin:0}}>Set status to Active</p>
                          <p style={{fontSize:11,color:'#5c3f3f',margin:0}}>Active questions appear immediately in the app.</p></div>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={()=>submit(pub?'Active':'Draft')} disabled={saving}
                          style={{backgroundColor:P,color:'#fff',borderRadius:8,padding:'10px 24px',fontSize:13,fontWeight:700,border:'none',cursor:'pointer'}}
                          className="hover:opacity-90 disabled:opacity-50">
                          {saving?'Saving...':(isEdit?'Update Question':'Save Question')}
                        </button>
                        <button type="button" onClick={()=>router.push('/questions')}
                          style={{border:'1px solid #e6bdbc',borderRadius:8,padding:'10px 20px',fontSize:13,fontWeight:600,color:'#5c3f3f',backgroundColor:'#fff',cursor:'pointer'}}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </Sec>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

// ── Default export wraps Inner in Suspense (required for useSearchParams) ─────
export default function AddQuestionPage() {
  return (
    <Suspense fallback={
      <div className="p-6 flex items-center justify-center h-64">
        <span className="material-symbols-outlined animate-spin text-3xl" style={{color:P}}>progress_activity</span>
      </div>
    }>
      <Inner/>
    </Suspense>
  );
}
