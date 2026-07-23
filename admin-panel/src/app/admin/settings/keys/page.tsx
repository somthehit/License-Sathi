'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';

interface ApiKeyMeta {
  service: string;
  model: string;
  updated_by: string;
  updated_at: string;
  is_configured: boolean;
}

const DEFAULT_MODELS: Record<string, string> = {
  openai: 'gpt-4.1',
  anthropic: 'claude-sonnet-4',
  gemini: 'gemini-2.0-flash-lite',
  openrouter: 'openai/gpt-4o-mini',
};

const MODEL_PLACEHOLDERS: Record<string, string> = {
  openai: 'gpt-4.1, gpt-4o-mini, ...',
  anthropic: 'claude-sonnet-4, claude-haiku-3, ...',
  gemini: 'gemini-2.0-flash-lite, gemini-2.5-flash, ...',
  openrouter: 'openai/gpt-4o-mini, anthropic/claude-sonnet-4, ...',
};

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newModel, setNewModel] = useState('');

  const services = ['openai', 'anthropic', 'gemini', 'openrouter', 'admob'];

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/admin/keys');
      const data = await res.json();

      const merged = services.map(s => {
        const existing = data.keys?.find((k: any) => k.service === s);
        return existing || { service: s, model: DEFAULT_MODELS[s] || '', is_configured: false, updated_at: '', updated_by: '' };
      });
      setKeys(merged);
    } catch (error) {
      console.error("Error fetching keys", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (service: string) => {
    if (!newKeyValue) return;
    try {
      await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, key_value: newKeyValue, model: newModel, admin_user_id: 'admin@example.com' })
      });
      setNewKeyValue('');
      setNewModel('');
      setEditingService(null);
      fetchKeys();
    } catch (error) {
      console.error("Error saving key", error);
    }
  };

  const startEditing = (k: ApiKeyMeta) => {
    setEditingService(k.service);
    setNewModel(k.model || DEFAULT_MODELS[k.service] || '');
    setNewKeyValue('');
  };

  if (loading) return <Layout title="Settings"><div className="p-6">Loading API Keys...</div></Layout>;

  const P = '#b1002c';
  const SECTIONS = ['General Settings', 'Security & Auth', 'Notifications', 'Localization', 'Database & Backups', 'Admin Users'];
  const SECTION_ICONS: Record<string, string> = {
    'General Settings': 'tune', 'Security & Auth': 'shield', 'Notifications': 'notifications',
    'Localization': 'language', 'Database & Backups': 'database', 'Admin Users': 'manage_accounts',
  };

  return (
    <Layout title="Settings">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="font-display font-bold text-[24px] text-[#1c1b1b]">System Settings</h1>
          <p className="text-sm text-[#5c3f3f] mt-1">Configure global application parameters and security protocols.</p>
        </div>

        <div className="flex gap-6">
          <div style={{ width: 210, flexShrink: 0 }}>
            <div className="space-y-1">
              {SECTIONS.map(s => (
                <a key={s} href="/settings"
                  style={{ color: '#5c3f3f', borderRadius: 8, textDecoration: 'none' }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-semibold text-left transition-colors hover:bg-[#f0eded]">
                  <span className="material-symbols-outlined text-base">{SECTION_ICONS[s]}</span>
                  {s}
                </a>
              ))}
              <div style={{ height: 1, backgroundColor: '#e6bdbc30', margin: '12px 0' }} />

              <a href="/admin/settings/keys"
                style={{ backgroundColor: '#ffdad9', color: P, borderRadius: 8, textDecoration: 'none' }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-semibold text-left transition-colors">
                <span className="material-symbols-outlined text-base">key</span>
                API Keys
              </a>

              <a href="/admin/settings/flags"
                style={{ color: '#5c3f3f', borderRadius: 8, textDecoration: 'none' }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-semibold text-left transition-colors hover:bg-[#f0eded]">
                <span className="material-symbols-outlined text-base">toggle_on</span>
                Feature Flags
              </a>

              <a href="/admin/prompts"
                style={{ color: '#5c3f3f', borderRadius: 8, textDecoration: 'none' }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-semibold text-left transition-colors hover:bg-[#f0eded]">
                <span className="material-symbols-outlined text-base">chat</span>
                System Prompts
              </a>
            </div>
          </div>

          <div className="flex-1 space-y-5">
            <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 16 }} className="p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5" style={{ borderBottom: '1px solid #e6bdbc30', paddingBottom: 16 }}>
                <span className="material-symbols-outlined text-xl" style={{ color: P, fontVariationSettings: "'FILL' 1" }}>key</span>
                <div>
                  <h3 className="font-display font-bold text-base text-[#1c1b1b]">Integration Keys Management</h3>
                  <p className="text-xs text-[#5c3f3f] mt-0.5">Keys are stored securely using AES-256 encryption. Configure the model name for each provider.</p>
                </div>
              </div>

              <div className="space-y-3">
                {keys.map(k => (
                  <div key={k.service} style={{ border: '1px solid #e6bdbc', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#1c1b1b', margin: 0, textTransform: 'capitalize' }}>{k.service}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span style={{ backgroundColor: k.is_configured ? '#dcfce7' : '#fee2e2', color: k.is_configured ? '#16a34a' : '#dc2626', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '2px 8px' }}>
                          {k.is_configured ? 'Configured' : 'Not Configured'}
                        </span>
                        {k.model && (
                          <span style={{ fontSize: 11, color: '#5c3f3f', fontFamily: 'monospace' }}>{k.model}</span>
                        )}
                        {k.updated_at && (
                          <span style={{ fontSize: 11, color: '#5c3f3f' }}>Updated {new Date(k.updated_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div>
                      {editingService === k.service ? (
                        <div className="flex flex-col gap-2 items-end">
                          <input
                            type="text"
                            value={newModel}
                            onChange={e => setNewModel(e.target.value)}
                            placeholder={MODEL_PLACEHOLDERS[k.service] || 'Model name'}
                            style={{ border: '1px solid #e6bdbc', borderRadius: 8, padding: '6px 10px', fontSize: 13, outline: 'none', width: 220, fontFamily: 'monospace' }}
                          />
                          <div className="flex gap-2">
                            <input
                              type="password"
                              value={newKeyValue}
                              onChange={e => setNewKeyValue(e.target.value)}
                              placeholder="Enter new key..."
                              style={{ border: '1px solid #e6bdbc', borderRadius: 8, padding: '6px 10px', fontSize: 13, outline: 'none', width: 220 }}
                            />
                            <button onClick={() => handleSave(k.service)} style={{ backgroundColor: P, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Save</button>
                            <button onClick={() => { setEditingService(null); setNewKeyValue(''); setNewModel(''); }} style={{ backgroundColor: '#f6f3f2', color: '#1c1b1b', border: '1px solid #e6bdbc', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(k)}
                          style={{ backgroundColor: '#f6f3f2', color: '#1c1b1b', border: '1px solid #e6bdbc', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          {k.is_configured ? 'Rotate Key' : 'Set Key'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
