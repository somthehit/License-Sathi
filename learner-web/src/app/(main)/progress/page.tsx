'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaChartLine, FaTrophy, FaCalendarCheck, FaCheckCircle, FaTimesCircle, FaClipboardList, FaSignInAlt } from 'react-icons/fa';
import Link from 'next/link';

interface Attempt {
  id: string;
  mode: string;
  categoryId: string;
  score: number;
  totalQuestions: number;
  passed: boolean;
  topic: string | null;
  correctAnswersCount: number;
  completedAt: number;
}

interface Stats {
  totalAttempts: number;
  passedAttempts: number;
  avgScore: number;
  mockPassRate: number;
  streak: number;
}

function fmtDate(ts: number) {
  if (!ts) return '—';
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [stats, setStats] = useState<Stats>({ totalAttempts: 0, passedAttempts: 0, avgScore: 0, mockPassRate: 0, streak: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      try {
        const res = await fetch(`/api/progress?uid=${user.uid}`);
        const data = await res.json();
        if (data.ok) {
          setAttempts(data.recent ?? []);
          setStats(data.stats ?? { totalAttempts: 0, passedAttempts: 0, avgScore: 0, mockPassRate: 0, streak: 0 });
        }
      } catch (err) {
        console.error('Failed to fetch progress:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user, authLoading]);

  // ── Loading state ──────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold font-poppins flex items-center gap-2">
            <FaChartLine className="text-indigo-600" /> My Progress
          </h1>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-100 rounded-full" />
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-20" />
                  <div className="h-7 bg-slate-100 rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Not logged in ──────────────────────────────────────────
  if (!user) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaChartLine size={36} />
        </div>
        <h1 className="text-2xl font-bold font-poppins mb-2">Track Your Progress</h1>
        <p className="text-slate-500 mb-6">Sign in to see your mock exam scores, study streaks, and attempt history.</p>
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
        >
          <FaSignInAlt size={16} />
          Sign In
        </Link>
      </div>
    );
  }

  // ── Stats cards ────────────────────────────────────────────
  const passRate = stats.totalAttempts > 0
    ? Math.round((stats.passedAttempts / stats.totalAttempts) * 100)
    : 0;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold font-poppins flex items-center gap-2">
          <FaChartLine className="text-indigo-600" /> My Progress
        </h1>
        <p className="text-slate-500">Track your mock exam scores and study streaks.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
            <FaTrophy size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Avg Score</p>
            <p className="text-2xl font-bold">{stats.avgScore}%</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
            <FaCalendarCheck size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Study Streak</p>
            <p className="text-2xl font-bold">{stats.streak} Days</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <FaClipboardList size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Exams</p>
            <p className="text-2xl font-bold">{stats.totalAttempts}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
            <FaCheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Pass Rate</p>
            <p className="text-2xl font-bold">{passRate}%</p>
          </div>
        </div>
      </div>

      {/* Mock Exam Pass Rate */}
      {stats.totalAttempts > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold mb-4">Performance Overview</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Overall Pass Rate</span>
                <span className="font-semibold">{stats.passedAttempts}/{stats.totalAttempts} ({passRate}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-indigo-500 h-3 rounded-full transition-all" style={{ width: `${passRate}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Mock Exam Pass Rate</span>
                <span className="font-semibold">{stats.mockPassRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-emerald-500 h-3 rounded-full transition-all" style={{ width: `${stats.mockPassRate}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Exams */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold mb-4">Recent Exams</h2>
        {attempts.length === 0 ? (
          <div className="text-center py-10">
            <FaClipboardList size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No exams taken yet</p>
            <p className="text-sm text-slate-400 mt-1">Complete a quiz or mock exam to see your history here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.map((exam) => (
              <div key={exam.id} className="flex justify-between items-center p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  {exam.passed ? (
                    <FaCheckCircle className="text-emerald-500" size={20} />
                  ) : (
                    <FaTimesCircle className="text-red-400" size={20} />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{exam.topic || exam.mode}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        exam.mode === 'Mock' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {exam.mode}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        Cat {exam.categoryId}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{fmtDate(exam.completedAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{exam.correctAnswersCount}/{exam.totalQuestions}</p>
                  <p className={`text-xs font-medium ${exam.passed ? 'text-emerald-600' : 'text-red-500'}`}>
                    {exam.passed ? 'Passed' : 'Failed'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
