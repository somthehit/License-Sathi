'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import Layout from '@/components/Layout';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsData {
  totalQuestions: number;
  totalQuestionsToday: number;
  cacheHitRate: number;
  totalAiCostToday: number;
  trafficLabels: string[];
  trafficData: number[];
  topQuestions: { question_text: string; hit_count: number; content_category: string }[];
  categoryBreakdown: Record<string, number>;
}

const P = '#b1002c';
const S = '#335ab4';

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ask-expert/analytics');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) return (
    <Layout title="Ask Expert Analytics">
      <div className="p-8 flex items-center gap-3 text-[#5c3f3f]">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        Loading real-time analytics…
      </div>
    </Layout>
  );

  if (error || !data) return (
    <Layout title="Ask Expert Analytics">
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <strong>Error loading analytics:</strong> {error}
        </div>
        <button onClick={fetchAnalytics} className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: P }}>
          Retry
        </button>
      </div>
    </Layout>
  );

  const lineChartData = {
    labels: data.trafficLabels,
    datasets: [
      {
        label: 'Questions Asked',
        data: data.trafficData,
        borderColor: P,
        backgroundColor: `${P}22`,
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const doughnutData = {
    labels: ['Cache Hits', 'AI Generations'],
    datasets: [
      {
        data: [data.cacheHitRate, 100 - data.cacheHitRate],
        backgroundColor: ['rgba(34, 197, 94, 0.85)', `${S}CC`],
        borderColor: ['rgba(34, 197, 94, 1)', S],
        borderWidth: 2,
      }
    ]
  };

  const kpiCards = [
    {
      label: 'Total Questions',
      value: data.totalQuestions.toLocaleString(),
      color: '#1c1b1b',
      icon: 'forum',
      bg: '#f6f3f2',
    },
    {
      label: 'Questions Today',
      value: data.totalQuestionsToday.toLocaleString(),
      color: S,
      icon: 'today',
      bg: '#dae1ff',
    },
    {
      label: 'Cache Hit Rate',
      value: `${data.cacheHitRate}%`,
      color: '#16a34a',
      icon: 'cached',
      bg: '#dcfce7',
    },
    {
      label: 'AI Cost Today',
      value: `$${data.totalAiCostToday.toFixed(4)}`,
      color: data.totalAiCostToday > 1 ? P : '#5c3f3f',
      icon: 'attach_money',
      bg: data.totalAiCostToday > 1 ? '#ffdad9' : '#f6f3f2',
    },
  ];

  return (
    <Layout title="Ask Expert Analytics">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1c1b1b]">Ask the Expert — Analytics</h1>
            <p className="text-sm text-[#5c3f3f] mt-0.5">Live usage data from Firestore</p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border border-[#e6bdbc] hover:bg-[#ffdad9]/30 transition-colors"
            style={{ color: P }}
          >
            <span className="material-symbols-outlined text-base">refresh</span> Refresh
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-[#e6bdbc] p-4 shadow-sm flex items-center gap-3">
              <div style={{ backgroundColor: card.bg, borderRadius: 10, padding: 10 }}>
                <span className="material-symbols-outlined text-2xl" style={{ color: card.color, fontVariationSettings: "'FILL' 1" }}>
                  {card.icon}
                </span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#5c3f3f] uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl font-bold leading-tight" style={{ color: card.color }}>{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#e6bdbc] p-5 shadow-sm">
            <h2 className="text-base font-bold text-[#1c1b1b] mb-4">Traffic — Last 7 Days</h2>
            <div className="h-56">
              <Line
                data={lineChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 } }
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e6bdbc] p-5 shadow-sm">
            <h2 className="text-base font-bold text-[#1c1b1b] mb-4">Cache vs AI Generation</h2>
            <div className="h-56 flex flex-col items-center justify-center">
              {data.totalQuestionsToday === 0 ? (
                <p className="text-sm text-[#5c3f3f] text-center">No questions asked today yet</p>
              ) : (
                <>
                  <Doughnut
                    data={doughnutData}
                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        {Object.keys(data.categoryBreakdown).length > 0 && (
          <div className="bg-white rounded-xl border border-[#e6bdbc] p-5 shadow-sm">
            <h2 className="text-base font-bold text-[#1c1b1b] mb-4">Questions by Category</h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(data.categoryBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => (
                  <div key={cat} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#e6bdbc] bg-[#f6f3f2]">
                    <span className="text-xs font-bold text-[#5c3f3f] uppercase">{cat}</span>
                    <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: P }}>{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Top Cached Questions */}
        <div className="bg-white rounded-xl border border-[#e6bdbc] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#e6bdbc] flex items-center gap-2">
            <span className="material-symbols-outlined text-lg" style={{ color: P, fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            <h2 className="text-base font-bold text-[#1c1b1b]">Top Cached Questions</h2>
          </div>
          {data.topQuestions.length === 0 ? (
            <div className="p-8 text-center text-[#5c3f3f] text-sm">
              No cached questions yet. As users ask questions, they&apos;ll appear here.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-[#e6bdbc]">
              <thead style={{ backgroundColor: '#f6f3f2' }}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#5c3f3f] uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#5c3f3f] uppercase tracking-wider">Question</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#5c3f3f] uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#5c3f3f] uppercase tracking-wider">Hits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6bdbc]">
                {data.topQuestions.map((q, idx) => (
                  <tr key={idx} className="hover:bg-[#f6f3f2] transition-colors">
                    <td className="px-4 py-3 text-sm font-bold text-[#5c3f3f]">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm text-[#1c1b1b]">{q.question_text}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full" style={{ backgroundColor: '#dae1ff', color: S }}>
                        {q.content_category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold" style={{ color: P }}>{q.hit_count}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </Layout>
  );
}
