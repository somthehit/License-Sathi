import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin';
import { COLLECTIONS } from '@/lib/firebase/collections';

export async function GET() {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // "YYYY-MM-DD"

    // ── 1. All-time total questions ────────────────────────────────────────────
    const allQuestionsSnap = await adminDb
      .collection(COLLECTIONS.ASK_EXPERT_QUESTIONS)
      .count()
      .get();
    const totalQuestions = allQuestionsSnap.data().count;

    // ── 2. Today's questions (single query, compute cache hits in-memory) ────
    const todayQuestionsSnap = await adminDb
      .collection(COLLECTIONS.ASK_EXPERT_QUESTIONS)
      .where('created_at', '>=', todayStr)
      .get();

    const totalQuestionsToday = todayQuestionsSnap.size;
    const cacheHitsToday = todayQuestionsSnap.docs.filter(d => d.data().cache_hit === true).length;
    const cacheHitRate = totalQuestionsToday > 0
      ? Math.round((cacheHitsToday / totalQuestionsToday) * 100)
      : 0;

    // ── 3. AI cost today (filter from the same today snapshot) ────────────────
    const totalAiCostToday = todayQuestionsSnap.docs
      .filter(d => d.data().cache_hit !== true)
      .reduce((sum, d) => sum + (d.data().ai_cost_estimate ?? 0), 0);

    // ── 5. Last 7 days traffic (count per day) ─────────────────────────────────
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const recentQSnap = await adminDb
      .collection(COLLECTIONS.ASK_EXPERT_QUESTIONS)
      .where('created_at', '>=', sevenDaysAgoStr)
      .get();

    // Build day-bucket counts
    const dayCounts: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      dayCounts[d.toISOString().split('T')[0]] = 0;
    }
    recentQSnap.docs.forEach(doc => {
      const day = (doc.data().created_at as string).split('T')[0];
      if (dayCounts[day] !== undefined) dayCounts[day]++;
    });

    const trafficLabels = Object.keys(dayCounts).map(d => {
      const dt = new Date(d);
      return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    });
    const trafficData = Object.values(dayCounts);

    // ── 6. Top cached questions ────────────────────────────────────────────────
    const topCacheSnap = await adminDb
      .collection(COLLECTIONS.AI_CACHE)
      .orderBy('hit_count', 'desc')
      .limit(8)
      .get();
    const topQuestions = topCacheSnap.docs.map(d => ({
      question_text: d.data().question_text,
      hit_count: d.data().hit_count ?? 0,
      content_category: d.data().content_category ?? '-',
    }));

    // ── 7. Questions by category breakdown ───────────────────────────────────
    const allCacheSnap = await adminDb.collection(COLLECTIONS.AI_CACHE).get();
    const categoryMap: Record<string, number> = {};
    allCacheSnap.docs.forEach(doc => {
      const cat = doc.data().content_category ?? 'unknown';
      categoryMap[cat] = (categoryMap[cat] ?? 0) + 1;
    });

    return NextResponse.json({
      totalQuestions,
      totalQuestionsToday,
      cacheHitRate,
      totalAiCostToday: parseFloat(totalAiCostToday.toFixed(4)),
      trafficLabels,
      trafficData,
      topQuestions,
      categoryBreakdown: categoryMap,
    });
  } catch (error: any) {
    console.error('[Analytics] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
