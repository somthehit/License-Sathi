'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/firebaseClient'; // Assuming this exists
import { COLLECTIONS } from '@/lib/firebase/collections';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import Layout from '@/components/Layout';

interface FeatureFlag {
  id: string;
  is_enabled: boolean;
  updated_at: string;
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultFlags = ['ask_expert_enabled', 'provider_openai_enabled', 'provider_gemini_enabled', 'provider_openrouter_enabled', 'cache_enabled', 'feedback_enabled'];

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.FEATURE_FLAGS));
      const fetchedFlags = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeatureFlag));
      
      // Merge with default flags to ensure they show up in UI even if not in DB yet
      const merged = defaultFlags.map(key => {
        const existing = fetchedFlags.find(f => f.id === key);
        return existing || { id: key, is_enabled: false, updated_at: new Date().toISOString() };
      });
      
      setFlags(merged);
    } catch (error) {
      console.error("Error fetching feature flags", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (id: string, currentStatus: boolean) => {
    try {
      const flagRef = doc(db, COLLECTIONS.FEATURE_FLAGS, id);
      await setDoc(flagRef, {
        is_enabled: !currentStatus,
        updated_at: new Date().toISOString(),
        updated_by: 'admin_user' // In real app, get from auth context
      }, { merge: true });
      
      setFlags(flags.map(f => f.id === id ? { ...f, is_enabled: !currentStatus } : f));
    } catch (error) {
      console.error("Error toggling feature flag", error);
    }
  };

  if (loading) return <Layout title="Settings"><div className="p-6">Loading Feature Flags...</div></Layout>;

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
                style={{ backgroundColor: '#ffdad9', color: P, borderRadius: 8, textDecoration: 'none' }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-semibold text-left transition-colors">
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

          {/* Content panel */}
          <div className="flex-1 space-y-5">
            <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 16 }} className="p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5" style={{ borderBottom: '1px solid #e6bdbc30', paddingBottom: 16 }}>
                <span className="material-symbols-outlined text-xl" style={{ color: P, fontVariationSettings: "'FILL' 1" }}>toggle_on</span>
                <div>
                  <h3 className="font-display font-bold text-base text-[#1c1b1b]">Feature Flags Management</h3>
                  <p className="text-xs text-[#5c3f3f] mt-0.5">Toggle system features on or off without redeploying the application.</p>
                </div>
              </div>

              <div className="space-y-3">
                {flags.map(flag => (
                  <div key={flag.id} style={{ border: '1px solid #e6bdbc', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#1c1b1b', margin: 0 }}>{flag.id}</p>
                      <p style={{ fontSize: 11, color: '#5c3f3f', margin: 0, marginTop: 4 }}>Last updated: {new Date(flag.updated_at).toLocaleString()}</p>
                    </div>
                    
                    <button
                      onClick={() => toggleFlag(flag.id, flag.is_enabled)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        flag.is_enabled ? 'bg-[#b1002c]' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          flag.is_enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
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
