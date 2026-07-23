'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/firebaseClient';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { collection, getDocs, doc, setDoc, addDoc } from 'firebase/firestore';
import Layout from '@/components/Layout';

interface SystemPrompt {
  id: string;
  name: string;
  version: string;
  prompt_text: string;
  is_active: boolean;
  created_at: string;
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [newPromptText, setNewPromptText] = useState('');

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.SYSTEM_PROMPTS));
      const fetchedPrompts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemPrompt));
      // Sort by created_at descending
      fetchedPrompts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPrompts(fetchedPrompts);
    } catch (error) {
      console.error("Error fetching prompts", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newVersion || !newPromptText) return;
    try {
      const newPrompt = {
        name: 'ask_expert_system_prompt',
        version: newVersion,
        prompt_text: newPromptText,
        is_active: false,
        created_at: new Date().toISOString()
      };
      
      await addDoc(collection(db, COLLECTIONS.SYSTEM_PROMPTS), newPrompt);
      setIsCreating(false);
      setNewVersion('');
      setNewPromptText('');
      fetchPrompts();
    } catch (error) {
      console.error("Error creating prompt", error);
    }
  };

  const handleActivate = async (targetPrompt: SystemPrompt) => {
    try {
      // Deactivate all others
      const activePrompts = prompts.filter(p => p.is_active && p.name === targetPrompt.name);
      for (const p of activePrompts) {
        await setDoc(doc(db, COLLECTIONS.SYSTEM_PROMPTS, p.id), { is_active: false }, { merge: true });
      }
      
      // Activate the target
      await setDoc(doc(db, COLLECTIONS.SYSTEM_PROMPTS, targetPrompt.id), { is_active: true }, { merge: true });
      fetchPrompts();
    } catch (error) {
      console.error("Error activating prompt", error);
    }
  };

  if (loading) return <Layout title="Settings"><div className="p-6">Loading Prompts...</div></Layout>;

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
          {/* Left nav (Static links back to main settings) */}
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
                style={{ color: '#5c3f3f', borderRadius: 8, textDecoration: 'none' }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-semibold text-left transition-colors hover:bg-[#f0eded]">
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
                style={{ backgroundColor: '#ffdad9', color: P, borderRadius: 8, textDecoration: 'none' }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-semibold text-left transition-colors">
                <span className="material-symbols-outlined text-base">chat</span>
                System Prompts
              </a>
            </div>
          </div>

          {/* Content panel */}
          <div className="flex-1 space-y-5">
            <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 16 }} className="p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5" style={{ borderBottom: '1px solid #e6bdbc30', paddingBottom: 16 }}>
                <span className="material-symbols-outlined text-xl" style={{ color: P, fontVariationSettings: "'FILL' 1" }}>chat</span>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-base text-[#1c1b1b]">System Prompts Management</h3>
                  <p className="text-xs text-[#5c3f3f] mt-0.5">Manage and version the AI behavior instructions.</p>
                </div>
                <button 
                  onClick={() => setIsCreating(true)}
                  style={{ backgroundColor: P, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  + New Version
                </button>
              </div>

              {isCreating && (
                <div style={{ border: '1px dashed #b1002c', backgroundColor: '#fffbfa', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: 14, fontWeight: 700, color: '#1c1b1b' }}>Create New Prompt Version</h4>
                  <div className="space-y-4">
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5c3f3f', marginBottom: 6 }}>Version (e.g. v2, v2.1)</label>
                      <input 
                        type="text" 
                        value={newVersion} 
                        onChange={e => setNewVersion(e.target.value)}
                        style={{ width: '100%', border: '1px solid #e6bdbc', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }}
                        placeholder="v1.0"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5c3f3f', marginBottom: 6 }}>Prompt Text</label>
                      <textarea 
                        value={newPromptText} 
                        onChange={e => setNewPromptText(e.target.value)}
                        style={{ width: '100%', border: '1px solid #e6bdbc', borderRadius: 8, padding: '12px', fontSize: 13, minHeight: 120, fontFamily: 'monospace', outline: 'none' }}
                        placeholder="You are a study assistant..."
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button onClick={() => setIsCreating(false)} style={{ backgroundColor: '#f6f3f2', color: '#1c1b1b', border: '1px solid #e6bdbc', borderRadius: 8, padding: '6px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                      <button onClick={handleCreate} style={{ backgroundColor: P, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save Prompt</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {prompts.map(prompt => (
                  <div key={prompt.id} style={{ border: `1px solid ${prompt.is_active ? '#4ade80' : '#e6bdbc'}`, borderLeft: `4px solid ${prompt.is_active ? '#22c55e' : '#e6bdbc'}`, borderRadius: 10, padding: '16px', backgroundColor: '#fff' }}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1c1b1b' }}>{prompt.name} - {prompt.version}</h3>
                          {prompt.is_active && <span style={{ backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '2px 8px' }}>ACTIVE</span>}
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#5c3f3f' }}>Created on {new Date(prompt.created_at).toLocaleString()}</p>
                      </div>
                      {!prompt.is_active && (
                        <button 
                          onClick={() => handleActivate(prompt)}
                          style={{ backgroundColor: '#f6f3f2', color: '#1c1b1b', border: '1px solid #e6bdbc', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Set Active
                        </button>
                      )}
                    </div>
                    <div style={{ backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, border: '1px solid #eee' }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 12, color: '#333' }}>{prompt.prompt_text}</pre>
                    </div>
                  </div>
                ))}
                {prompts.length === 0 && !isCreating && (
                  <div style={{ textAlign: 'center', padding: 32, border: '1px dashed #e6bdbc', borderRadius: 12, color: '#5c3f3f', fontSize: 14 }}>
                    No prompts configured yet. Create your first version.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
