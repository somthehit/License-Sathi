import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ ok: false, error: 'uid is required.' }, { status: 400 });
    }

    // Fetch all attempts from users/{uid}/attempts
    const snap = await adminDb
      .collection('users')
      .doc(uid)
      .collection('attempts')
      .orderBy('completedAt', 'desc')
      .get();

    const attempts = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate stats
    const totalAttempts = attempts.length;
    const passedAttempts = attempts.filter((a: Record<string, unknown>) => a.passed === true).length;
    const avgScore = totalAttempts > 0
      ? Math.round(attempts.reduce((sum: number, a: Record<string, unknown>) => sum + ((a.score as number) || 0), 0) / totalAttempts)
      : 0;

    // Mock exams only
    const mockExams = attempts.filter((a: Record<string, unknown>) => a.mode === 'Mock');
    const mockPassRate = mockExams.length > 0
      ? Math.round((mockExams.filter((a: Record<string, unknown>) => a.passed === true).length / mockExams.length) * 100)
      : 0;

    // Study streak: count consecutive days with at least one attempt
    const uniqueDays = [...new Set(
      attempts.map((a: Record<string, unknown>) => {
        const ts = a.completedAt as number;
        return ts ? new Date(ts).toDateString() : null;
      }).filter(Boolean)
    )];
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < uniqueDays.length; i++) {
      const expected = new Date(now);
      expected.setDate(expected.getDate() - i);
      if (uniqueDays[i] === expected.toDateString()) {
        streak++;
      } else {
        break;
      }
    }

    // Recent 10 attempts
    const recent = attempts.slice(0, 10).map((a: Record<string, unknown>) => ({
      id: a.id,
      mode: a.mode,
      categoryId: a.categoryId,
      score: a.score,
      totalQuestions: a.totalQuestions,
      passed: a.passed,
      topic: a.topic,
      correctAnswersCount: a.correctAnswersCount,
      completedAt: a.completedAt,
    }));

    return NextResponse.json({
      ok: true,
      stats: {
        totalAttempts,
        passedAttempts,
        avgScore,
        mockPassRate,
        streak,
      },
      recent,
    });
  } catch (err: unknown) {
    console.error('[GET /api/progress]', err);
    return NextResponse.json({ ok: false, error: 'Failed to load progress.' }, { status: 500 });
  }
}
