"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';

const P = '#b1002c';
const S = '#335ab4';
const T = '#705d00';

// ── Types ─────────────────────────────────────────────────────────────────────
interface DashboardStats {
  totalUsers: number;
  activeQuestions: number;
  draftQuestions: number;
  totalMaterials: number;
  totalExams: number;
  totalSets: number;
  passRate: number;
  avgScore: number;
}

interface FeedItem {
  id: string;
  userName: string;
  category: string;
  score: number;
  totalQuestions: number;
  passed: boolean;
  createdAt: string;
}

interface ContentItem {
  id: string;
  title: string;
  contentType: string;
  status: string;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ icon, iconBg, iconColor, badge, badgeColor, label, value, sub }: {
  icon: string; iconBg: string; iconColor: string;
  badge: string; badgeColor: string; label: string; value: string;
  sub?: React.ReactNode;
}) {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 12 }} className="p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div style={{ backgroundColor: iconBg, borderRadius: 10 }} className="w-10 h-10 flex items-center justify-center">
          <span className="material-symbols-outlined text-xl" style={{ color: iconColor, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        <span className="text-xs font-bold" style={{ color: badgeColor }}>{badge}</span>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#5c3f3f] mb-1">{label}</p>
        <h3 className="font-display font-bold text-3xl text-[#1c1b1b]">{value}</h3>
      </div>
      {sub && <div>{sub}</div>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 12 }} className="p-5 animate-pulse">
      <div style={{ backgroundColor: '#f0eded', borderRadius: 10, height: 40, width: 40, marginBottom: 12 }} />
      <div style={{ backgroundColor: '#f0eded', borderRadius: 4, height: 10, width: '60%', marginBottom: 8 }} />
      <div style={{ backgroundColor: '#f0eded', borderRadius: 4, height: 28, width: '40%' }} />
    </div>
  );
}

function FeedRow({ item }: { item: FeedItem }) {
  const dot = item.passed ? '#16a34a' : '#dc2626';
  const scoreColor = item.passed ? '#16a34a' : '#dc2626';
  const pct = Math.round((item.score / item.totalQuestions) * 100);
  return (
    <div className="flex gap-3 py-3" style={{ borderBottom: '1px solid #e6bdbc20' }}>
      <div className="mt-1 flex-shrink-0">
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: dot, boxShadow: '0 0 0 3px #fff' }} />
      </div>
      <div style={{ backgroundColor: '#f6f3f2', border: '1px solid #e6bdbc30', borderRadius: 10 }} className="flex-1 p-3">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-xs font-bold text-[#1c1b1b]">{item.userName}</span>
          <span className="text-[10px] text-[#5c3f3f]">{timeAgo(item.createdAt)}</span>
        </div>
        <p className="text-xs text-[#5c3f3f]">Completed Category {item.category} Mock Exam</p>
        <p className="text-xs font-bold mt-1" style={{ color: scoreColor }}>
          Score: {item.score}/{item.totalQuestions} ({pct}%) — {item.passed ? 'PASS' : 'FAIL'}
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setStats(data.stats);
      setFeed(data.feedItems ?? []);
      setContent(data.recentContent ?? []);
    } catch {
      setError('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const contentTypeIcon: Record<string, { icon: string; color: string }> = {
    'Traffic Sign':       { icon: 'traffic',    color: P },
    'Road Rule':          { icon: 'menu_book',  color: S },
    'Vehicle Knowledge':  { icon: 'build',      color: T },
  };

  return (
    <Layout title="Admin Panel">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="font-display font-bold text-[28px] text-[#1c1b1b] leading-tight">Console Overview</h1>
            <p className="text-sm text-[#5c3f3f] mt-1">Real-time performance monitoring for License Sathi ecosystem.</p>
          </div>
          <div className="flex gap-2">
            <button style={{ backgroundColor: '#f0eded', border: '1px solid #e6bdbc', borderRadius: 8, color: '#1c1b1b' }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold hover:bg-[#eae7e7] transition-colors"
              onClick={load}>
              <span className="material-symbols-outlined text-base">refresh</span>
              Refresh
            </button>
            <button style={{ backgroundColor: P, color: '#fff', borderRadius: 8 }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-base">download</span>
              Export Report
            </button>
          </div>
        </div>

        {error && (
          <div style={{ backgroundColor: '#ffdad9', border: '1px solid #b1002c40', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: P, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
            {error}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {loading ? (
            [1,2,3,4,5].map(i => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard icon="groups" iconBg="#dae1ff" iconColor={S}
                badge={`${fmt(stats?.totalUsers ?? 0)} users`} badgeColor={S}
                label="Total Learners" value={fmt(stats?.totalUsers ?? 0)}
                sub={<div style={{ height: 4, backgroundColor: '#f0eded', borderRadius: 99 }}><div style={{ width: `${Math.min(100, (stats?.totalUsers ?? 0) / 500 * 100)}%`, height: '100%', backgroundColor: S, borderRadius: 99 }} /></div>}
              />
              <StatCard icon="assignment_turned_in" iconBg="#ffdad9" iconColor={P}
                badge={`${stats?.totalExams ?? 0} total`} badgeColor="#16a34a"
                label="Exams Taken" value={fmt(stats?.totalExams ?? 0)}
                sub={<div className="flex items-end gap-1 h-8">
                  {[30,50,40,70,100].map((h,i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, backgroundColor: i === 4 ? P : `${P}40`, borderRadius: '3px 3px 0 0' }} />
                  ))}
                </div>}
              />
              <StatCard icon="verified_user" iconBg="#ffe16d" iconColor={T}
                badge={`${stats?.draftQuestions ?? 0} draft`} badgeColor="#5c3f3f"
                label="Active Questions" value={fmt(stats?.activeQuestions ?? 0)}
                sub={<p className="text-xs text-[#5c3f3f]">{stats?.draftQuestions ?? 0} items pending review</p>}
              />
              <StatCard icon="folder_copy" iconBg="#dae1ff" iconColor={S}
                badge={`${stats?.totalSets ?? 0} active`} badgeColor={S}
                label="Question Sets" value={fmt(stats?.totalSets ?? 0)}
                sub={<p className="text-xs text-[#5c3f3f]">Grouped questions for sets</p>}
              />
              <StatCard icon="insights" iconBg="#ffdad9" iconColor={P}
                badge={stats?.passRate !== undefined ? `${stats.passRate}% pass rate` : '—'} badgeColor={stats?.passRate && stats.passRate >= 60 ? '#16a34a' : '#dc2626'}
                label="Avg Score (last 50)" value={`${stats?.avgScore ?? 0}%`}
                sub={<div className="flex items-center gap-2">
                  <svg width="80" height="24" viewBox="0 0 100 24">
                    <polyline points="0,18 15,14 30,20 45,10 60,15 75,6 90,10 100,5"
                      fill="none" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[10px] font-bold text-[#5c3f3f]">Pass: {stats?.passRate ?? 0}%</span>
                </div>}
              />
            </>
          )}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left col */}
          <div className="col-span-8 space-y-4">

            {/* Chart widget — static bars, real label data */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 16 }} className="p-5 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="font-display font-semibold text-base text-[#1c1b1b]">User Growth &amp; Engagement</h3>
                  <p className="text-xs text-[#5c3f3f] mt-0.5">Weekly exam activity overview</p>
                </div>
                <div style={{ backgroundColor: '#f0eded', borderRadius: 8 }} className="flex p-1 gap-1">
                  <button style={{ backgroundColor: '#fff', borderRadius: 6 }} className="px-3 py-1 text-xs font-bold shadow-sm text-[#1c1b1b]">Daily</button>
                  <button className="px-3 py-1 text-xs font-semibold text-[#5c3f3f] hover:text-[#1c1b1b]">Weekly</button>
                </div>
              </div>
              <div style={{ borderBottom: '1px solid #e6bdbc40' }} className="h-48 flex items-end justify-between px-2 pb-4 gap-2">
                {[40,65,55,85,70,95,80].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    {i === 6 && <div style={{ backgroundColor: P, color: '#fff', borderRadius: 4, fontSize: 10, padding: '1px 6px' }}>{fmt(stats?.totalExams ?? 0)}</div>}
                    <div style={{ height: `${h}%`, backgroundColor: i === 6 ? P : '#ffdad9', borderRadius: '4px 4px 0 0', width: '100%' }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-3 px-2">
                {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(d => (
                  <span key={d} className="text-[10px] font-bold text-[#5c3f3f] uppercase tracking-wider flex-1 text-center">{d}</span>
                ))}
              </div>
            </div>

            {/* Analytics: Category & Difficulty */}
            <div className="grid grid-cols-2 gap-4">
              <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 16 }} className="p-5 shadow-sm">
                <h3 className="font-display font-semibold text-base text-[#1c1b1b] mb-4">Category Distribution</h3>
                <div className="space-y-3">
                  {['Category A', 'Category B', 'Category K', 'Category G'].map((cat, i) => (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold text-[#5c3f3f]">{cat}</span>
                        <span className="text-[#1c1b1b]">{[45, 30, 15, 10][i]}%</span>
                      </div>
                      <div style={{ width: '100%', height: 6, backgroundColor: '#f0eded', borderRadius: 99 }}>
                        <div style={{ width: `${[45, 30, 15, 10][i]}%`, height: '100%', backgroundColor: S, borderRadius: 99 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 16 }} className="p-5 shadow-sm">
                <h3 className="font-display font-semibold text-base text-[#1c1b1b] mb-4">Difficulty Breakdown</h3>
                <div className="flex items-end justify-center h-24 gap-4 mb-2">
                  <div className="flex flex-col items-center gap-2">
                    <div style={{ height: '40%', width: 40, backgroundColor: '#16a34a', borderRadius: '4px 4px 0 0' }} />
                    <span className="text-[10px] font-bold uppercase text-[#5c3f3f]">Easy</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div style={{ height: '70%', width: 40, backgroundColor: '#eab308', borderRadius: '4px 4px 0 0' }} />
                    <span className="text-[10px] font-bold uppercase text-[#5c3f3f]">Med</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div style={{ height: '30%', width: 40, backgroundColor: '#dc2626', borderRadius: '4px 4px 0 0' }} />
                    <span className="text-[10px] font-bold uppercase text-[#5c3f3f]">Hard</span>
                  </div>
                </div>
                <p className="text-center text-xs text-[#5c3f3f] mt-2">Questions categorized by complexity</p>
              </div>
            </div>

            {/* Recent Content Updates */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 16 }} className="overflow-hidden shadow-sm">
              <div style={{ borderBottom: '1px solid #e6bdbc' }} className="px-5 py-4 flex justify-between items-center">
                <h3 className="font-display font-semibold text-base text-[#1c1b1b]">Recent Content Updates</h3>
                <a href="/study-library" className="text-sm font-semibold flex items-center gap-1" style={{ color: P, textDecoration: 'none' }}>
                  View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>

              {loading ? (
                [1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3 animate-pulse">
                    <div style={{ backgroundColor: '#f0eded', borderRadius: 10, width: 44, height: 44, flexShrink: 0 }} />
                    <div className="flex-1">
                      <div style={{ backgroundColor: '#f0eded', borderRadius: 4, height: 10, width: '60%', marginBottom: 6 }} />
                      <div style={{ backgroundColor: '#f0eded', borderRadius: 4, height: 8, width: '80%' }} />
                    </div>
                  </div>
                ))
              ) : content.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-[#5c3f3f]">No content yet. Add study materials to see updates here.</div>
              ) : (
                content.map(item => {
                  const { icon, color } = contentTypeIcon[item.contentType] ?? { icon: 'article', color: '#5c3f3f' };
                  const isPublished = item.status === 'Published';
                  return (
                    <div key={item.id} style={{ borderBottom: '1px solid #e6bdbc30' }} className="flex items-center gap-4 px-5 py-3 hover:bg-[#f6f3f2] transition-colors">
                      <div style={{ backgroundColor: '#f0eded', borderRadius: 10 }} className="w-11 h-11 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined" style={{ color }}>{icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#1c1b1b] truncate">{item.title}</p>
                        <p className="text-xs text-[#5c3f3f] truncate">{item.contentType}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold text-[#5c3f3f] mb-1">{timeAgo(item.createdAt)}</p>
                        <span style={{ backgroundColor: isPublished ? '#dcfce7' : '#f0eded', color: isPublished ? '#16a34a' : '#5c3f3f', borderRadius: 99, fontSize: 10, padding: '2px 8px', fontWeight: 700 }}>
                          {item.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sets Table Preview */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 16 }} className="overflow-hidden shadow-sm">
              <div style={{ borderBottom: '1px solid #e6bdbc' }} className="px-5 py-4 flex justify-between items-center">
                <h3 className="font-display font-semibold text-base text-[#1c1b1b]">Recent Question Sets</h3>
                <a href="/questions/sets" className="text-sm font-semibold flex items-center gap-1" style={{ color: P, textDecoration: 'none' }}>
                  Manage Sets <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>
              <div className="p-5 flex flex-col justify-center items-center text-[#5c3f3f]">
                <span className="material-symbols-outlined text-3xl mb-2" style={{ opacity: 0.5 }}>folder_copy</span>
                <p className="text-sm font-semibold">Active Sets: {stats?.totalSets ?? 0}</p>
                <p className="text-xs mt-1">Navigate to Question Sets to manage categories and items.</p>
              </div>
            </div>
          </div>

          {/* Right col */}
          <div className="col-span-4 space-y-4">

            {/* Live Exam Feed */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 16 }} className="p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-base text-[#1c1b1b] flex items-center gap-2">
                  Recent Exams
                  <span style={{ width: 8, height: 8, backgroundColor: '#dc2626', borderRadius: '50%', display: 'inline-block' }} />
                </h3>
                <span className="text-xs font-bold text-[#5c3f3f]">{stats?.totalExams ?? 0} total</span>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {loading ? (
                  [1,2,3].map(i => (
                    <div key={i} className="flex gap-3 py-3 animate-pulse">
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f0eded', marginTop: 4, flexShrink: 0 }} />
                      <div style={{ backgroundColor: '#f6f3f2', borderRadius: 10, flex: 1, height: 52 }} />
                    </div>
                  ))
                ) : feed.length === 0 ? (
                  <p className="text-xs text-[#5c3f3f] text-center py-4">No exam results yet.</p>
                ) : (
                  feed.map(item => <FeedRow key={item.id} item={item} />)
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div style={{ backgroundColor: '#ffdad920', border: '1px solid #b1002c30', borderRadius: 16 }} className="p-5 shadow-sm">
              <h3 className="font-display font-semibold text-base flex items-center gap-2 mb-4" style={{ color: P }}>
                Quick Actions
              </h3>
              <div className="space-y-2">
                {[
                  { icon: 'quiz',         iconColor: P, title: 'Add New Question',   sub: 'Expand the question bank',      href: '/questions/add' },
                  { icon: 'library_books',iconColor: S, title: 'Add Study Material', sub: 'Upload a traffic sign or rule', href: '/study-library/add' },
                  { icon: 'person_add',   iconColor: T, title: 'Register Learner',   sub: 'Add a new app user',            href: '/users/add' },
                ].map(task => (
                  <a key={task.href} href={task.href}
                    style={{ backgroundColor: '#fff', border: '1px solid #e6bdbc', borderRadius: 10, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px' }}
                    className="hover:border-[#b1002c] transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-base" style={{ color: task.iconColor }}>{task.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-[#1c1b1b]">{task.title}</p>
                        <p className="text-[10px] text-[#5c3f3f]">{task.sub}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-sm text-[#5c3f3f] opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
