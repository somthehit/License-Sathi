'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';

const P = '#b1002c';
const S = '#335ab4';

const CATEGORIES = ['ALL', 'A', 'B'];

export default function AddVideoGuidePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    titleEn: '',
    titleNp: '',
    descriptionEn: '',
    descriptionNp: '',
    videoUrl: '',
    durationSeconds: '',
    category: 'ALL',
    status: 'Draft',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titleEn.trim()) { setError('English title is required'); return; }
    if (!form.videoUrl.trim()) { setError('Video URL is required'); return; }

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/video-guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, durationSeconds: Number(form.durationSeconds || 0) }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to save');
      }
      router.push('/video-guides');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout title="Add Video Guide">
      <div className="p-6 max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/video-guides" style={{ color: S, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Video Guides
          </Link>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1c1b1b', marginBottom: 4 }}>Add Video Guide</h1>
        <p style={{ fontSize: 13, color: '#5c3f3f', marginBottom: 24 }}>Create a new video tutorial for the License Sathi app</p>

        {error && (
          <div style={{ backgroundColor: '#ffdad9', border: `1px solid ${P}`, borderRadius: 10, padding: '10px 16px', marginBottom: 20, color: P, fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Titles */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#5c3f3f', display: 'block', marginBottom: 6 }}>Title (English) *</label>
                <input
                  name="titleEn" value={form.titleEn} onChange={handleChange}
                  placeholder="e.g. Road Sign Basics"
                  style={{ width: '100%', border: '1px solid #e6bdbc', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#5c3f3f', display: 'block', marginBottom: 6 }}>Title (Nepali)</label>
                <input
                  name="titleNp" value={form.titleNp} onChange={handleChange}
                  placeholder="e.g. सडक संकेत आधारहरू"
                  style={{ width: '100%', border: '1px solid #e6bdbc', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#5c3f3f', display: 'block', marginBottom: 6 }}>Description (English)</label>
                <textarea
                  name="descriptionEn" value={form.descriptionEn} onChange={handleChange}
                  rows={3} placeholder="Brief description of this video..."
                  style={{ width: '100%', border: '1px solid #e6bdbc', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#5c3f3f', display: 'block', marginBottom: 6 }}>Description (Nepali)</label>
                <textarea
                  name="descriptionNp" value={form.descriptionNp} onChange={handleChange}
                  rows={3} placeholder="संक्षिप्त विवरण..."
                  style={{ width: '100%', border: '1px solid #e6bdbc', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Video URL */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#5c3f3f', display: 'block', marginBottom: 6 }}>Video URL *</label>
              <input
                name="videoUrl" value={form.videoUrl} onChange={handleChange}
                type="url" placeholder="https://storage.googleapis.com/... or https://youtube.com/..."
                style={{ width: '100%', border: '1px solid #e6bdbc', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
              <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Use a direct video URL (mp4) or a streaming link supported by ExoPlayer</p>
            </div>

            {/* Duration, Category, Status */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#5c3f3f', display: 'block', marginBottom: 6 }}>Duration (seconds)</label>
                <input
                  name="durationSeconds" value={form.durationSeconds} onChange={handleChange}
                  type="number" min="0" placeholder="e.g. 300"
                  style={{ width: '100%', border: '1px solid #e6bdbc', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#5c3f3f', display: 'block', marginBottom: 6 }}>Category</label>
                <select
                  name="category" value={form.category} onChange={handleChange}
                  style={{ width: '100%', border: '1px solid #e6bdbc', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : `Category ${c}`}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#5c3f3f', display: 'block', marginBottom: 6 }}>Status</label>
                <select
                  name="status" value={form.status} onChange={handleChange}
                  style={{ width: '100%', border: '1px solid #e6bdbc', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}
                >
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </div>
            </div>

          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <Link
              href="/video-guides"
              style={{ flex: 1, backgroundColor: '#f0eaea', color: '#5c3f3f', borderRadius: 10, padding: '11px 0', fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >Cancel</Link>
            <button
              type="submit" disabled={saving}
              style={{ flex: 2, backgroundColor: saving ? '#aaa' : S, color: '#fff', borderRadius: 10, padding: '11px 0', fontWeight: 700, fontSize: 14, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{saving ? 'hourglass_empty' : 'save'}</span>
              {saving ? 'Saving...' : 'Save Video Guide'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
