"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';

const P = '#b1002c';
const S = '#335ab4';

type ContentType = 'Traffic Sign' | 'Road Rule' | 'Law' | 'Vehicle Knowledge';
type Difficulty  = 'Easy' | 'Medium' | 'Hard';
type Mode        = 'single' | 'bulk';
type ImageSource = 'upload' | 'url';

// ── CSV template columns ──────────────────────────────────────────────────────
const CSV_COLUMNS = [
  'code','contentType','vehicleCategory','difficulty',
  'titleEn','titleNp','descEn','descNp',
  'topicEn','topicNp',
  'sectionId','dotmRef','status',
];

function downloadTemplate() {
  const header = CSV_COLUMNS.join(',');
  const example = [
    'TS-004','Traffic Sign','A - Motorcycle/Bike','Easy',
    'Stop Sign','रोक्नुहोस् चिन्ह',
    'A red octagonal sign requiring all drivers to stop.','सबै चालकहरूलाई रोक्न आवश्यक चिन्ह।',
    '','',
    'SEC-MS-01','DOTM-TS-S01','Published',
  ].map(v => `"${v}"`).join(',');
  const blob = new Blob([header + '\n' + example], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'study_materials_template.csv'; a.click();
  URL.revokeObjectURL(url);
}

interface BulkRow {
  row: number;
  code: string; contentType: string; vehicleCategory: string; difficulty: string;
  titleEn: string; titleNp: string; descEn: string; descNp: string;
  sectionId: string; dotmRef: string; status: string;
}

function parseCSV(text: string): BulkRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const rawHeader = lines[0].replace(/^\uFEFF/, '');
  const headers = rawHeader.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line, i) => {
    const values: string[] = [];
    let inQuote = false, current = '';
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { values.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    values.push(current.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, j) => { row[h] = (values[j] ?? '').replace(/^"|"$/g, '').trim(); });
    return {
      row: i + 2,
      code: row.code ?? '', contentType: row.contentType ?? '', vehicleCategory: row.vehicleCategory ?? '',
      difficulty: row.difficulty ?? '', titleEn: row.titleEn ?? '', titleNp: row.titleNp ?? '',
      descEn: row.descEn ?? '', descNp: row.descNp ?? '',
      sectionId: row.sectionId ?? '', dotmRef: row.dotmRef ?? '', status: row.status ?? 'Draft',
    };
  }).filter(r => r.titleEn || r.code);
}

// ── Bulk Upload Panel ─────────────────────────────────────────────────────────
function BulkUploadPanel() {
  const csvInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [rows,      setRows]      = useState<BulkRow[]>([]);
  const [fileName,  setFileName]  = useState('');
  const [uploading, setUploading] = useState(false);
  const [result,    setResult]    = useState<{ written: number; skipped: number; errors: { row: number; message: string }[] } | null>(null);
  const [error,     setError]     = useState('');

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setFileName(file.name); setResult(null); setError('');
    const reader = new FileReader();
    reader.onload = ev => setRows(parseCSV(ev.target?.result as string));
    reader.readAsText(file, 'utf-8');
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith('.csv')) return;
    setFileName(file.name); setResult(null); setError('');
    const reader = new FileReader();
    reader.onload = ev => setRows(parseCSV(ev.target?.result as string));
    reader.readAsText(file, 'utf-8');
  }

  async function handleUpload() {
    if (rows.length === 0) return;
    setUploading(true); setError('');
    try {
      const res = await fetch('/api/materials/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materials: rows }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Upload failed'); return; }
      setResult(data);
      if (data.written > 0 && data.skipped === 0) setTimeout(() => router.push('/study-library'), 1800);
    } catch { setError('Network error. Please try again.'); }
    finally { setUploading(false); }
  }

  const iStyle: React.CSSProperties = { fontSize: 11, color: '#1c1b1b', padding: '4px 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 };

  return (
    <div className="space-y-5">
      {/* Template */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 16 }} className="shadow-sm overflow-hidden">
        <div style={{ borderBottom: '1px solid #e6bdbc', padding: '14px 24px' }} className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base" style={{ color: P, fontVariationSettings: "'FILL' 1" }}>download</span>
          <h3 style={{ fontWeight: 700, fontSize: 14, color: '#1c1b1b', margin: 0 }}>CSV Template</h3>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <p className="text-sm text-[#5c3f3f] mb-3">Download the template, fill it in, then upload. Required columns:</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {CSV_COLUMNS.map(col => (
              <span key={col} style={{ backgroundColor: '#f6f3f2', border: '1px solid #e6bdbc', borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#1c1b1b', padding: '2px 8px' }}>{col}</span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-[#5c3f3f] mb-4">
            <div><strong>contentType</strong> — Traffic Sign / Road Rule / Law / Vehicle Knowledge</div>
            <div><strong>vehicleCategory</strong> — A - Motorcycle/Bike / B - Car / Jeep / Van / K - Scooter / Moped / G - Tractor / All</div>
            <div><strong>difficulty</strong> — Easy / Medium / Hard</div>
            <div><strong>status</strong> — Published or Draft</div>
            <div><strong>titleNp, descNp</strong> — Nepali text (optional)</div>
            <div><strong>topicEn, topicNp</strong> — Required for Law type (e.g. drink_driving, right_of_way, general)</div>
            <div><strong>sectionId, dotmRef</strong> — for Road Rule type (optional)</div>
          </div>
          <button onClick={downloadTemplate}
            style={{ backgroundColor: S, color: '#fff', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined text-base">download</span>
            Download Template CSV
          </button>
        </div>
      </div>

      {/* Upload */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 16 }} className="shadow-sm overflow-hidden">
        <div style={{ borderBottom: '1px solid #e6bdbc', padding: '14px 24px' }} className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base" style={{ color: P, fontVariationSettings: "'FILL' 1" }}>upload_file</span>
          <h3 style={{ fontWeight: 700, fontSize: 14, color: '#1c1b1b', margin: 0 }}>Upload CSV File</h3>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div onDrop={handleDrop} onDragOver={e => e.preventDefault()} onClick={() => csvInputRef.current?.click()}
            style={{ border: `2px dashed ${rows.length > 0 ? '#16a34a' : '#e6bdbc'}`, borderRadius: 12, backgroundColor: rows.length > 0 ? '#f0fdf4' : '#f6f3f2', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', transition: 'all 0.15s', marginBottom: 16 }}
            className="hover:border-[#b1002c]">
            <span className="material-symbols-outlined text-4xl" style={{ color: rows.length > 0 ? '#16a34a' : '#c0a0a0' }}>{rows.length > 0 ? 'check_circle' : 'upload_file'}</span>
            <div className="text-center">
              {rows.length > 0 ? (
                <><p style={{ fontSize: 14, fontWeight: 700, color: '#16a34a', margin: 0 }}>{fileName}</p><p style={{ fontSize: 12, color: '#5c3f3f', margin: '2px 0 0' }}>{rows.length} rows parsed — ready to upload</p></>
              ) : (
                <><p style={{ fontSize: 14, fontWeight: 700, color: '#1c1b1b', margin: 0 }}>Click to select or drag & drop your CSV</p><p style={{ fontSize: 12, color: '#5c3f3f', margin: '2px 0 0' }}>Only .csv files — max 500 rows per upload</p></>
              )}
            </div>
          </div>
          <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />

          {/* Preview */}
          {rows.length > 0 && (
            <div style={{ border: '1px solid #e6bdbc', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ backgroundColor: '#f6f3f2', borderBottom: '1px solid #e6bdbc', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1c1b1b' }}>Preview — first 5 rows</span>
                <button onClick={() => { setRows([]); setFileName(''); setResult(null); if (csvInputRef.current) csvInputRef.current.value = ''; }}
                  style={{ fontSize: 11, fontWeight: 600, color: P, background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f6f3f2' }}>
                      {['#','Code','Type','Category','Diff','Title EN','Title NP','Status'].map(h => (
                        <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: '#5c3f3f', fontWeight: 700, borderBottom: '1px solid #e6bdbc', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e6bdbc20' }}>
                        <td style={{ ...iStyle, color: '#5c3f3f' }}>{r.row}</td>
                        <td style={{ ...iStyle, fontWeight: 700, color: P }}>{r.code}</td>
                        <td style={iStyle}>{r.contentType}</td>
                        <td style={iStyle}>{r.vehicleCategory}</td>
                        <td style={iStyle}>{r.difficulty}</td>
                        <td style={{ ...iStyle, maxWidth: 160 }}>{r.titleEn}</td>
                        <td style={{ ...iStyle, maxWidth: 120 }}>{r.titleNp}</td>
                        <td style={{ ...iStyle, color: r.status === 'Published' ? '#16a34a' : '#a16207' }}>{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 5 && <p style={{ fontSize: 11, color: '#5c3f3f', padding: '6px 12px', borderTop: '1px solid #e6bdbc20', textAlign: 'center' }}>… and {rows.length - 5} more rows</p>}
            </div>
          )}

          {error && (
            <div style={{ backgroundColor: '#ffdad9', border: '1px solid #b1002c40', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined text-sm" style={{ color: P, fontVariationSettings: "'FILL' 1" }}>error</span>
              <span style={{ fontSize: 13, color: P, fontWeight: 600 }}>{error}</span>
            </div>
          )}

          {result && (
            <div style={{ backgroundColor: result.written > 0 ? '#f0fdf4' : '#fef9c3', border: `1px solid ${result.written > 0 ? '#16a34a' : '#a16207'}40`, borderRadius: 8, padding: '14px 16px', marginBottom: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: result.written > 0 ? '#16a34a' : '#a16207', margin: '0 0 8px' }}>
                {result.written > 0 ? `✔ ${result.written} material${result.written > 1 ? 's' : ''} imported successfully!` : 'No materials were imported.'}
                {result.skipped > 0 && ` (${result.skipped} rows had errors)`}
              </p>
              {result.errors.map((e, i) => <p key={i} style={{ fontSize: 12, color: P, margin: 0 }}>Row {e.row}: {e.message}</p>)}
            </div>
          )}

          <button onClick={handleUpload} disabled={rows.length === 0 || uploading}
            style={{ backgroundColor: P, color: '#fff', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 700, border: 'none', cursor: rows.length > 0 ? 'pointer' : 'default', opacity: rows.length === 0 || uploading ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', gap: 8 }}
            className="hover:opacity-90 transition-opacity disabled:cursor-not-allowed">
            {uploading && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
            <span className="material-symbols-outlined text-base" style={{ display: uploading ? 'none' : 'block', fontVariationSettings: "'FILL' 1" }}>upload</span>
            {uploading ? 'Uploading...' : `Import ${rows.length > 0 ? rows.length : ''} Material${rows.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #e6bdbc', borderRadius: 8,
  padding: '9px 12px', fontSize: 13, color: '#1c1b1b',
  backgroundColor: '#f6f3f2', outline: 'none', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5c3f3f', marginBottom: 6,
};

function Section({ icon, title, children, accent }: { icon: string; title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 16 }} className="shadow-sm overflow-hidden">
      <div style={{ borderBottom: '1px solid #e6bdbc', padding: '14px 24px' }} className="flex items-center gap-2">
        <span className="material-symbols-outlined text-base" style={{ color: accent ?? P, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        <h3 style={{ fontWeight: 700, fontSize: 14, color: '#1c1b1b', margin: 0 }}>{title}</h3>
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  );
}

function LivePreview({ image, titleEn, descEn }: { image: string | null; titleEn: string; descEn: string }) {
  return (
    <div style={{ border: '1px solid #e6bdbc', borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff' }} className="shadow-sm">
      <div style={{ height: 180, backgroundColor: '#1a2e1a', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#f6f3f2' }} />
        ) : (
          <div style={{ background: 'linear-gradient(135deg,#1a3a1a,#2d5a2d,#1a3a1a)', width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', padding: 16 }}>
            <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined text-sm" style={{ color: '#fff' }}>visibility</span>
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>Live Preview will appear here once content is added</span>
            </div>
          </div>
        )}
      </div>
      {(titleEn || descEn) && (
        <div style={{ padding: '14px 18px' }}>
          {titleEn && <p style={{ fontWeight: 700, fontSize: 14, color: '#1c1b1b', margin: '0 0 4px' }}>{titleEn}</p>}
          {descEn  && <p style={{ fontSize: 12, color: '#5c3f3f', margin: 0, lineHeight: 1.5 }}>{descEn}</p>}
        </div>
      )}
    </div>
  );
}

export default function AddStudyMaterialPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const editId       = searchParams.get('edit');
  const isEdit       = Boolean(editId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [mode, setMode] = useState<Mode>('single');
  const [imgSourceTab, setImgSourceTab] = useState<ImageSource>('upload');

  // Form state
  const [code, setCode] = useState('');
  const [contentType, setContentType] = useState<ContentType>('Traffic Sign');
  const [vehicleCategory, setVehicleCategory] = useState('A - Motorcycle/Bike');
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [titleEn, setTitleEn] = useState('');
  const [descEn, setDescEn] = useState('');
  const [titleNp, setTitleNp] = useState('');
  const [descNp, setDescNp] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [dotmRef, setDotmRef] = useState('');
  const [topicEn, setTopicEn] = useState('');
  const [topicNp, setTopicNp] = useState('');
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  // UI state
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // Load existing material for edit mode
  const loadMaterial = useCallback(async () => {
    if (!editId) return;
    try {
      const res = await fetch(`/api/materials/${editId}`);
      if (!res.ok) throw new Error('Not found');
      const d = await res.json();
      setCode(d.code ?? '');
      setContentType(d.contentType ?? 'Traffic Sign');
      setVehicleCategory(d.vehicleCategory ?? 'A - Motorcycle/Bike');
      setDifficulty(d.difficulty ?? 'Easy');
      setTitleEn(d.titleEn ?? '');
      setDescEn(d.descEn ?? '');
      setTitleNp(d.titleNp ?? '');
      setDescNp(d.descNp ?? '');
      setSectionId(d.sectionId ?? '');
      setDotmRef(d.dotmRef ?? '');
      setTopicEn(d.topicEn ?? '');
      setTopicNp(d.topicNp ?? '');
      if (d.imageUrl) {
        setExistingImageUrl(d.imageUrl);
        setImagePreview(d.imageUrl);
        // Fallback check to preset input field if it looks like an external URL string
        if (d.imageUrl.startsWith('http')) {
          setImageUrlInput(d.imageUrl);
          setImgSourceTab('url');
        }
      }
    } catch { showToast('Failed to load material', false); }
    finally { setLoading(false); }
  }, [editId]);

  useEffect(() => { if (isEdit) loadMaterial(); }, [isEdit, loadMaterial]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Image must be under 2MB', false); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setExistingImageUrl(null);
    setImageUrlInput('');
  }

  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const url = e.target.value;
    setImageUrlInput(url);
    setImagePreview(url.trim() || null);
    setImageFile(null);
    setExistingImageUrl(null);
  }

  function clearImage() {
    setImageFile(null);
    setImageUrlInput('');
    setImagePreview(null);
    setExistingImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function uploadImage(file: File): Promise<string> {
    const { uploadImage: up } = await import('@/lib/uploadImage');
    return up(file, 'study_materials');
  }

  async function handleSubmit(status: 'Published' | 'Draft') {
    if (!titleEn.trim()) { showToast('English title is required', false); return; }
    if (!code.trim())    { showToast('Material code is required', false); return; }

    setSaving(true);
    try {
      let finalImageUrl: string | null = existingImageUrl;
      
      if (imgSourceTab === 'upload' && imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      } else if (imgSourceTab === 'url' && imageUrlInput.trim()) {
        finalImageUrl = imageUrlInput.trim();
      }

      const payload = {
        code, contentType, vehicleCategory, difficulty,
        titleEn, descEn, titleNp, descNp,
        topicEn: topicEn || null,
        topicNp: topicNp || null,
        sectionId: sectionId || null,
        dotmRef:    dotmRef   || null,
        imageUrl:  finalImageUrl || null,
        status,
      };

      const res = await fetch(
        isEdit ? `/api/materials/${editId}` : '/api/materials',
        { method: isEdit ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      );

      if (!res.ok) {
        const err = await res.json();
        showToast(err.error ?? 'Failed to save', false);
        return;
      }

      showToast(isEdit ? 'Material updated successfully' : `Material ${status === 'Published' ? 'published' : 'saved as draft'}`);
      setTimeout(() => router.push('/study-library'), 1200);
    } catch (err) {
      console.error(err);
      showToast('An error occurred while saving', false);
    } finally {
      setSaving(false);
    }
  }

  const CONTENT_TYPES: ContentType[] = ['Traffic Sign', 'Road Rule', 'Law', 'Vehicle Knowledge'];
  const VEHICLE_CATEGORIES = ['A - Motorcycle/Bike', 'B - Car / Jeep / Van', 'K - Scooter / Moped', 'G - Tractor', 'All'];
  const diffColors: Record<Difficulty, string> = { Easy: '#16a34a', Medium: '#a16207', Hard: P };

  if (loading) {
    return (
      <Layout title="Study Library">
        <div className="p-6 flex items-center justify-center h-64">
          <span className="material-symbols-outlined animate-spin text-3xl" style={{ color: P }}>progress_activity</span>
        </div>
      </Layout>
    );
  }

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

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-1 text-sm">
          <Link href="/study-library" style={{ color: '#5c3f3f', textDecoration: 'none', fontWeight: 600 }} className="hover:text-[#b1002c] transition-colors">Study Library</Link>
          <span className="material-symbols-outlined text-base text-[#5c3f3f]">chevron_right</span>
          <span style={{ color: P, fontWeight: 700 }}>{isEdit ? 'Edit Material' : 'Add New Material'}</span>
        </div>

        {/* Heading + mode toggle */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="font-display font-bold text-[24px] text-[#1c1b1b]">{isEdit ? 'Edit Study Material' : 'Add New Study Material'}</h1>
            <p className="text-sm text-[#5c3f3f] mt-1">Create and publish new educational content for the Nepal Driving License prep.</p>
          </div>
          {!isEdit && (
            <div style={{ display: 'inline-flex', border: '1px solid #e6bdbc', borderRadius: 10, overflow: 'hidden', backgroundColor: '#f6f3f2', flexShrink: 0 }}>
              {([['single','edit','Single Material'],['bulk','upload_file','Bulk CSV Upload']] as const).map(([m, icon, label]) => {
                const active = mode === m;
                return (
                  <button key={m} onClick={() => setMode(m)}
                    style={{ padding: '8px 16px', fontSize: 13, fontWeight: active ? 700 : 500, color: active ? P : '#5c3f3f', backgroundColor: active ? '#fff' : 'transparent', border: 'none', borderRight: '1px solid #e6bdbc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                    <span className="material-symbols-outlined text-base">{icon}</span>
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── BULK MODE ── */}
        {mode === 'bulk' && !isEdit && <BulkUploadPanel />}

        {/* ── SINGLE MODE ── */}
        {(mode === 'single' || isEdit) && (
          <div className="flex gap-6 items-start">
            {/* ── Left column ── */}
            <div className="flex-1 space-y-5 min-w-0">

              {/* 1. Material Type & Category */}
              <Section icon="category" title="Material Type & Category">
                {/* Code */}
                <div className="mb-4">
                  <label style={labelStyle}>Material Code <span style={{ color: P }}>*</span></label>
                  <input style={inputStyle} placeholder="e.g. TS-004, RR-012" value={code} onChange={e => setCode(e.target.value)} />
                  <p style={{ fontSize: 10, color: '#5c3f3f', marginTop: 4 }}>Unique code for this material (TS = Traffic Sign, RR = Road Rule, VK = Vehicle Knowledge)</p>
                </div>

                {/* Content Type tabs */}
                <div className="mb-4">
                  <label style={labelStyle}>Content Type</label>
                  <div style={{ display: 'inline-flex', border: '1px solid #e6bdbc', borderRadius: 10, overflow: 'hidden', backgroundColor: '#f6f3f2' }}>
                    {CONTENT_TYPES.map(t => {
                      const active = contentType === t;
                      return (
                        <button key={t} type="button" onClick={() => setContentType(t)}
                          style={{ padding: '8px 20px', fontSize: 13, fontWeight: active ? 700 : 500, color: active ? P : '#5c3f3f', backgroundColor: active ? '#fff' : 'transparent', border: 'none', borderRight: '1px solid #e6bdbc', cursor: 'pointer', transition: 'all 0.15s', boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Vehicle Category + Difficulty */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Vehicle Category</label>
                    <select style={inputStyle} value={vehicleCategory} onChange={e => setVehicleCategory(e.target.value)}>
                      {VEHICLE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Difficulty Level</label>
                    <select style={{ ...inputStyle, color: diffColors[difficulty], fontWeight: 700 }} value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)}>
                      {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              </Section>

              {/* 2. Bilingual Content */}
              <Section icon="translate" title="Bilingual Content">
                {/* English */}
                <div style={{ border: `2px solid ${S}20`, borderLeft: `3px solid ${S}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: S, display: 'inline-block' }} />
                    <span style={{ color: S, fontWeight: 700, fontSize: 12 }}>English Version</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label style={labelStyle}>Material Title <span style={{ color: P }}>*</span></label>
                      <input style={inputStyle} placeholder="e.g., Speed Limit Ahead (50km/h)" value={titleEn} onChange={e => setTitleEn(e.target.value)} />
                    </div>
                    <div>
                      <label style={labelStyle}>Description / Explanation</label>
                      <textarea rows={4} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Explain the rule or sign in detail..." value={descEn} onChange={e => setDescEn(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Nepali */}
                <div style={{ border: `2px solid ${P}20`, borderLeft: `3px solid ${P}`, borderRadius: 10, padding: 16 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: P, display: 'inline-block' }} />
                    <span style={{ color: P, fontWeight: 700, fontSize: 12 }}>Nepali Version</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label style={labelStyle}>सामग्रीको शीर्षक (Title)</label>
                      <input style={inputStyle} placeholder="उदा, गति सीमा ५० कि.मि. प्रति घण्टा" value={titleNp} onChange={e => setTitleNp(e.target.value)} />
                    </div>
                    <div>
                      <label style={labelStyle}>विवरण / व्याख्या (Description)</label>
                      <textarea rows={4} style={{ ...inputStyle, resize: 'vertical' }} placeholder="नियम वा चिन्हको विस्तृत व्याख्या गर्नुहोस्..." value={descNp} onChange={e => setDescNp(e.target.value)} />
                    </div>
                  </div>
                </div>
              </Section>

              {/* Dynamic Meta Conditions */}
              {contentType === 'Law' && (
                <Section icon="gavel" title="Law Details">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle}>Topic (English) <span style={{ color: P }}>*</span></label>
                      <select style={inputStyle} value={topicEn} onChange={e => setTopicEn(e.target.value)}>
                        <option value="">— Select topic —</option>
                        <option value="general">General Traffic Rules</option>
                        <option value="drink_driving">Drink Driving (DUI)</option>
                        <option value="right_of_way">Right of Way</option>
                        <option value="penalty">Fines & Penalties</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Topic (Nepali)</label>
                      <input style={inputStyle} placeholder="उदा, मादक पदार्थ सेवन" value={topicNp} onChange={e => setTopicNp(e.target.value)} />
                    </div>
                  </div>
                </Section>
              )}

              {contentType === 'Road Rule' && (
                <Section icon="rule" title="Reference Specifications">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle}>Section ID</label>
                      <input style={inputStyle} placeholder="e.g. SEC-42" value={sectionId} onChange={e => setSectionId(e.target.value)} />
                    </div>
                    <div>
                      <label style={labelStyle}>DOTM Reference</label>
                      <input style={inputStyle} placeholder="e.g. DOTM-V3-2026" value={dotmRef} onChange={e => setDotmRef(e.target.value)} />
                    </div>
                  </div>
                </Section>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => handleSubmit('Published')} disabled={saving}
                  style={{ backgroundColor: P, color: '#fff', borderRadius: 8, padding: '12px 28px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}
                  className="hover:opacity-90 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Publish Material'}
                </button>
                <button type="button" onClick={() => handleSubmit('Draft')} disabled={saving}
                  style={{ backgroundColor: '#f6f3f2', color: '#5c3f3f', border: '1px solid #e6bdbc', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  className="hover:bg-[#eee] disabled:opacity-50">
                  Save as Draft
                </button>
              </div>
            </div>

            {/* ── Right Column (Sidebar Preview & Dynamic Tool) ── */}
            <div className="w-[340px] space-y-5 flex-shrink-0 sticky top-6">
              <div>
                <p style={labelStyle}>Form Live Preview</p>
                <LivePreview image={imagePreview} titleEn={titleEn} descEn={descEn} />
              </div>

              {/* Media Upload Container with Tab Switcher */}
              <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 16, padding: 18 }} className="space-y-4">
                <label style={labelStyle}>Visual Reference Asset</label>
                
                {/* Image Source Tab Selector */}
                <div style={{ display: 'flex', border: '1px solid #e6bdbc', borderRadius: 8, overflow: 'hidden', backgroundColor: '#f6f3f2' }}>
                  <button type="button" onClick={() => setImgSourceTab('upload')}
                    style={{ flex: 1, padding: '6px 12px', fontSize: 12, fontWeight: imgSourceTab === 'upload' ? 700 : 500, color: imgSourceTab === 'upload' ? P : '#5c3f3f', backgroundColor: imgSourceTab === 'upload' ? '#fff' : 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>
                    Upload File
                  </button>
                  <button type="button" onClick={() => setImgSourceTab('url')}
                    style={{ flex: 1, padding: '6px 12px', fontSize: 12, fontWeight: imgSourceTab === 'url' ? 700 : 500, color: imgSourceTab === 'url' ? P : '#5c3f3f', backgroundColor: imgSourceTab === 'url' ? '#fff' : 'transparent', border: 'none', borderLeft: '1px solid #e6bdbc', cursor: 'pointer', transition: 'all 0.15s' }}>
                    Paste URL
                  </button>
                </div>

                {/* Conditional View Rendering Based on Selector Tab */}
                {imgSourceTab === 'upload' ? (
                  <div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    {imageFile || (existingImageUrl && !imageUrlInput) ? (
                      <div style={{ border: '1px solid #e6bdbc', borderRadius: 8, backgroundColor: '#f6f3f2', padding: '10px 12px' }} className="flex items-center justify-between gap-2">
                        <span style={{ fontSize: 12, color: '#1c1b1b' }} className="truncate flex-1">
                          {imageFile ? imageFile.name : 'Loaded Asset Resource'}
                        </span>
                        <button type="button" onClick={clearImage} style={{ background: 'none', border: 'none', color: P, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
                          Clear
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        style={{ width: '100%', height: 90, border: '2px dashed #e6bdbc', backgroundColor: '#f6f3f2', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}
                        className="hover:border-[#b1002c]">
                        <span className="material-symbols-outlined text-gray-400 text-xl">add_a_photo</span>
                        <span style={{ fontSize: 11, color: '#5c3f3f', fontWeight: 600 }}>Choose Local File (Max 2MB)</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input type="text" style={inputStyle} placeholder="https://example.com/image.png" value={imageUrlInput} onChange={handleUrlChange} />
                    {imageUrlInput.trim() && (
                      <div className="flex justify-end">
                        <button type="button" onClick={clearImage} style={{ background: 'none', border: 'none', color: P, fontWeight: 600, cursor: 'pointer', fontSize: 11 }}>
                          Clear URL
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}