"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';

const P = '#b1002c';
const S = '#335ab4';

const BAR_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

interface DifficultQuestion {
  id: string;
  label: string;
  snippet: string;
}

interface RecentUserActivity {
  name: string;
  avatar: string;
  lastExam: string;
  attempts: number;
  readiness: string;
  readColor: string;
  readBg: string;
}

interface AnalyticsData {
  avgReadiness: number;
  readinessGrowth: number;
  passCount: number;
  failCount: number;
  activeUsersCount: number;
  newUsersTodayCount: number;
  difficultQuestions: DifficultQuestion[];
  weeklyDistribution: {
    Pass: number[];
    Fail: number[];
  };
  recentActivity: RecentUserActivity[];
}

export default function AnalyticsPage() {
  const [scoreTab, setScoreTab] = useState<'Pass' | 'Fail'>('Pass');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/analytics/summary');
      if (!res.ok) throw new Error('Failed to retrieve server telemetry metrics');
      const payload: AnalyticsData = await res.json();
      setData(payload);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'An unexpected network error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <Layout title="User Performance Analytics">
        <div className="p-6 flex flex-col items-center justify-center h-96 gap-3">
          <span className="material-symbols-outlined animate-spin text-4xl" style={{ color: P }}>progress_activity</span>
          <p className="text-sm font-medium text-[#5c3f3f]">Compiling system performance matrices...</p>
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout title="User Performance Analytics">
        <div className="p-6 max-w-md mx-auto mt-12">
          <div style={{ backgroundColor: '#ffdad9', border: `1px solid ${P}40`, borderRadius: 16, padding: 24 }} className="text-center space-y-4">
            <span className="material-symbols-outlined text-4xl" style={{ color: P }}>error</span>
            <h3 className="font-bold text-lg text-[#1c1b1b]">Analytics Sync Failed</h3>
            <p className="text-xs text-[#5c3f3f] leading-relaxed">{error || 'No database telemetry state parsed.'}</p>
            <button type="button" onClick={fetchAnalytics}
              style={{ backgroundColor: P, color: '#fff', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}
              className="hover:opacity-90 transition-opacity">
              Retry Connection
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const passPercent = data.passCount + data.failCount > 0 
    ? Math.round((data.passCount / (data.passCount + data.failCount)) * 100) 
    : 0;

  return (
    <Layout title="User Performance Analytics">
      <div className="p-6">
        {/* Sub-header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div style={{ backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '99px', padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>LIVE UPDATES</div>
            <span className="text-sm text-[#5c3f3f]">Connected directly to system database storage</span>
          </div>
          <div className="flex gap-2">
            <button style={{ border: '1px solid #e6bdbc', borderRadius: '8px', backgroundColor: '#f6f3f2' }} className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold text-[#1c1b1b] hover:bg-[#eae7e7]">
              <span className="material-symbols-outlined text-base">filter_list</span> Filter
            </button>
            <button style={{ backgroundColor: P, color: '#fff', borderRadius: '8px' }} className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold hover:opacity-90">
              <span className="material-symbols-outlined text-base">download</span> Export Reports
            </button>
          </div>
        </div>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Avg Readiness Score */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e6bdbc', borderRadius: '12px' }} className="p-5 shadow-sm">
            <div style={{ backgroundColor: '#ffdad9', borderRadius: '10px', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="mb-3">
              <span className="material-symbols-outlined text-xl" style={{ color: P, fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#5c3f3f] mb-1">AVG. READINESS SCORE</p>
            <h3 className="font-display font-bold text-3xl text-[#1c1b1b]">{data.avgReadiness.toFixed(1)} <span className="text-lg">%</span></h3>
            <p className="text-xs font-semibold mt-1" style={{ color: data.readinessGrowth >= 0 ? '#16a34a' : P }}>
              {data.readinessGrowth >= 0 ? `↑ ${data.readinessGrowth}%` : `↓ ${Math.abs(data.readinessGrowth)}%`} vs last month
            </p>
          </div>

          {/* Pass / Fail Ratio */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e6bdbc', borderRadius: '12px' }} className="p-5 shadow-sm flex items-center gap-4">
            {/* Donut Chart */}
            <div className="relative flex-shrink-0" style={{ width: 80, height: 80 }}>
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="30" fill="none" stroke="#e6bdbc" strokeWidth="10"/>
                <circle cx="40" cy="40" r="30" fill="none" stroke={S} strokeWidth="10"
                  strokeDasharray={`${Math.PI * 60 * (passPercent / 100)} ${Math.PI * 60 * (1 - passPercent / 100)}`}
                  strokeDashoffset={Math.PI * 60 * 0.25}
                  strokeLinecap="round"/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display font-bold text-base text-[#1c1b1b]">{passPercent}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#5c3f3f] mb-2">PASS / FAIL RATIO</p>
              <div className="flex items-center gap-2 mb-1">
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: S }}></div>
                <span className="text-xs text-[#1c1b1b] font-semibold">Passed: <strong>{data.passCount.toLocaleString()}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#e6bdbc' }}></div>
                <span className="text-xs text-[#1c1b1b] font-semibold">Failed: <strong>{data.failCount.toLocaleString()}</strong></span>
              </div>
            </div>
          </div>

          {/* Active Users */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e6bdbc', borderRadius: '12px' }} className="p-5 shadow-sm">
            <div style={{ backgroundColor: '#dae1ff', borderRadius: '10px', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="mb-3">
              <span className="material-symbols-outlined text-xl" style={{ color: S, fontVariationSettings: "'FILL' 1" }}>group</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#5c3f3f] mb-1">ACTIVE USERS</p>
            <h3 className="font-display font-bold text-3xl text-[#1c1b1b]">{data.activeUsersCount.toLocaleString()}</h3>
            <p className="text-xs font-semibold mt-1" style={{ color: '#16a34a' }}>+ {data.newUsersTodayCount} new today</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-12 gap-4 mb-6">
          {/* Critical Drop-off */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e6bdbc', borderRadius: '16px' }} className="col-span-4 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-base text-[#1c1b1b]">Critical Drop-off</h3>
              <span className="material-symbols-outlined text-xl" style={{ color: '#a16207' }}>warning</span>
            </div>
            <div className="space-y-3">
              {data.difficultQuestions.map((q, i) => (
                <div key={q.id} style={{ backgroundColor: i === 0 ? '#ffdad9' : '#f6f3f2', borderRadius: '10px', padding: '10px 12px', border: `1px solid ${i === 0 ? '#e6bdbc' : 'transparent'}` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ backgroundColor: i === 0 ? P : '#5c3f3f', color: '#fff', borderRadius: '4px', fontSize: 10, padding: '1px 6px', fontWeight: 700 }}>ERROR RATE:</span>
                    <span className="text-xs font-bold" style={{ color: P }}>{q.label}</span>
                  </div>
                  <p className="text-xs text-[#5c3f3f] leading-relaxed line-clamp-2">{q.snippet}</p>
                </div>
              ))}
            </div>
            <button style={{ border: `1px solid ${P}30`, color: P, borderRadius: '10px' }} className="w-full mt-4 py-2 text-xs font-bold hover:bg-[#ffdad9] transition-colors">
              View All Difficult Questions
            </button>
          </div>

          {/* Weekly Score Distribution */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e6bdbc', borderRadius: '16px' }} className="col-span-8 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-base text-[#1c1b1b]">Weekly Score Distribution</h3>
              <div style={{ backgroundColor: '#f0eded', borderRadius: '8px' }} className="flex p-0.5 gap-0.5">
                {(['Pass', 'Fail'] as const).map((tab) => (
                  <button key={tab} type="button" onClick={() => setScoreTab(tab)}
                    style={{
                      backgroundColor: scoreTab === tab ? (tab === 'Pass' ? S : P) : 'transparent',
                      color: scoreTab === tab ? '#fff' : '#5c3f3f',
                      borderRadius: '6px',
                    }}
                    className="px-4 py-1 text-xs font-bold transition-all">
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-48 flex items-end justify-between gap-2 pb-4" style={{ borderBottom: '1px solid #e6bdbc30' }}>
              {data.weeklyDistribution[scoreTab].map((value, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div style={{ 
                    height: `${Math.min(value, 100)}%`, 
                    backgroundColor: scoreTab === 'Pass' ? S : P, 
                    borderRadius: '4px 4px 0 0', 
                    width: '100%', 
                    opacity: 0.85 + i * 0.02 
                  }} title={`${value}%`}></div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3">
              {BAR_DAYS.map((d) => (
                <span key={d} className="text-[10px] font-bold text-[#5c3f3f] uppercase tracking-wider flex-1 text-center">{d}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Recent User Activity Table */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e6bdbc', borderRadius: '16px' }} className="overflow-hidden shadow-sm">
          <div style={{ borderBottom: '1px solid #e6bdbc' }} className="flex items-center justify-between px-5 py-4">
            <h3 className="font-display font-semibold text-base text-[#1c1b1b]">Recent User Activity</h3>
            <button className="text-sm font-semibold flex items-center gap-1" style={{ color: P }}>
              View All Users <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
          <div style={{ backgroundColor: '#f6f3f2', borderBottom: '1px solid #e6bdbc' }} className="grid grid-cols-5 px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#5c3f3f]">
            <span className="col-span-2">User</span>
            <span>Last Exam</span>
            <span>Attempts</span>
            <span>Readiness</span>
          </div>
          {data.recentActivity.map((u, i) => (
            <div key={i} style={{ borderBottom: '1px solid #e6bdbc20' }} className="grid grid-cols-5 items-center px-5 py-4">
              <div className="col-span-2 flex items-center gap-3">
                <div style={{ backgroundColor: '#ffdad9', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="text-xs font-bold" style={{ color: P }}>{u.avatar}</span>
                </div>
                <span className="text-sm font-bold text-[#1c1b1b]">{u.name}</span>
              </div>
              <span className="text-sm text-[#5c3f3f]">{u.lastExam}</span>
              <span className="text-sm font-semibold text-[#1c1b1b]">{u.attempts}</span>
              <span style={{ backgroundColor: u.readBg, color: u.readColor, borderRadius: '99px', padding: '2px 10px', fontSize: 12, fontWeight: 700, width: 'fit-content' }}>{u.readiness}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}