import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/firebaseAdmin';

const SESSION_COOKIE = 'admin_session';

async function requireAdmin(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    return await adminAuth.verifySessionCookie(cookie, true);
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch all needed data in parallel
    const [
      activeUsersSnap,
      newUsersSnap,
      passSnap,
      failSnap,
      last200Snap,
      questionStatsSnap,
      recentExamsSnap,
    ] = await Promise.all([
      adminDb.collection('users').where('status', '==', 'Active').count().get(),
      adminDb.collection('users')
        .where('createdAt', '>=', new Date(Date.now() - 86_400_000))
        .count().get(),
      adminDb.collection('exam_results').where('passed', '==', true).count().get(),
      adminDb.collection('exam_results').where('passed', '==', false).count().get(),
      // Last 200 results for readiness avg + weekly distribution
      adminDb.collection('exam_results').orderBy('createdAt', 'desc').limit(200).get(),
      // Most-missed questions via wrongAnswers field (if tracked), fallback to all questions
      adminDb.collection('questions')
        .where('status', '==', 'Active')
        .orderBy('wrongCount', 'desc')
        .limit(5)
        .get()
        .catch(() =>
          adminDb.collection('questions').where('status', '==', 'Active').limit(5).get()
        ),
      // Recent 10 exam results for activity table
      adminDb.collection('exam_results').orderBy('createdAt', 'desc').limit(10).get(),
    ]);

    const activeUsersCount = activeUsersSnap.data().count;
    const newUsersTodayCount = newUsersSnap.data().count;
    const passCount = passSnap.data().count;
    const failCount = failSnap.data().count;

    // --- Avg readiness score & growth from last 200 exams ---
    const last200 = last200Snap.docs.map(d => d.data());
    const avgReadiness =
      last200.length > 0
        ? parseFloat(
            (
              last200.reduce(
                (sum, e) =>
                  sum + (e.totalQuestions > 0 ? (e.score / e.totalQuestions) * 100 : 0),
                0
              ) / last200.length
            ).toFixed(1)
          )
        : 0;

    // Growth: compare first half vs second half of sample as a simple proxy
    let readinessGrowth = 0;
    if (last200.length >= 20) {
      const half = Math.floor(last200.length / 2);
      const recent = last200.slice(0, half);
      const older = last200.slice(half);
      const recentAvg =
        recent.reduce((s, e) => s + (e.totalQuestions > 0 ? (e.score / e.totalQuestions) * 100 : 0), 0) /
        recent.length;
      const olderAvg =
        older.reduce((s, e) => s + (e.totalQuestions > 0 ? (e.score / e.totalQuestions) * 100 : 0), 0) /
        older.length;
      readinessGrowth = parseFloat((recentAvg - olderAvg).toFixed(1));
    }

    // --- Weekly distribution (last 7 days, indexed Mon=0 … Sun=6) ---
    const passWeekly = Array(7).fill(0);
    const failWeekly = Array(7).fill(0);
    const weekAgo = Date.now() - 7 * 86_400_000;

    for (const doc of last200Snap.docs) {
      const data = doc.data();
      const ts: Date | undefined = data.createdAt?.toDate?.();
      if (!ts || ts.getTime() < weekAgo) continue;
      // getDay() returns 0=Sun…6=Sat; remap to Mon=0…Sun=6
      const dow = (ts.getDay() + 6) % 7;
      if (data.passed) passWeekly[dow]++;
      else failWeekly[dow]++;
    }

    // Convert raw counts to percentages of that day's total (or raw count if 0)
    const weeklyDistribution = {
      Pass: passWeekly.map((p, i) => {
        const total = p + failWeekly[i];
        return total > 0 ? Math.round((p / total) * 100) : 0;
      }),
      Fail: failWeekly.map((f, i) => {
        const total = passWeekly[i] + f;
        return total > 0 ? Math.round((f / total) * 100) : 0;
      }),
    };

    // --- Difficult questions ---
    const difficultQuestions = questionStatsSnap.docs.map((doc) => {
      const d = doc.data();
      const snippet = d.questionEn ?? d.questionNp ?? 'Question text unavailable';
      return {
        id: doc.id,                                                      // full doc ID — always unique
        label: `#${doc.id.slice(-6).toUpperCase()}`,                     // short display label
        snippet: snippet.length > 120 ? snippet.slice(0, 120) + '…' : snippet,
      };
    });

    // --- Recent user activity ---
    const recentActivity = await Promise.all(
      recentExamsSnap.docs.map(async (doc) => {
        const data = doc.data();
        let name = 'Unknown User';
        try {
          const userDoc = await adminDb.collection('users').doc(data.userId).get();
          if (userDoc.exists) {
            const u = userDoc.data();
            name = u?.name ?? u?.fullName ?? name;
          }
        } catch { /* ignore */ }

        const scorePercent =
          data.totalQuestions > 0
            ? Math.round((data.score / data.totalQuestions) * 100)
            : 0;

        let readiness: string;
        let readColor: string;
        let readBg: string;
        if (scorePercent >= 80) {
          readiness = 'High';
          readColor = '#16a34a';
          readBg = '#dcfce7';
        } else if (scorePercent >= 50) {
          readiness = 'Medium';
          readColor = '#d97706';
          readBg = '#fef3c7';
        } else {
          readiness = 'Low';
          readColor = '#b1002c';
          readBg = '#ffdad9';
        }

        const ts: Date | undefined = data.createdAt?.toDate?.();
        const lastExam = ts
          ? ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '—';

        // Count total attempts by this user
        const attemptsSnap = await adminDb
          .collection('exam_results')
          .where('userId', '==', data.userId)
          .count()
          .get();

        const initials = name
          .split(' ')
          .map((w: string) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return {
          name,
          avatar: initials,
          lastExam,
          attempts: attemptsSnap.data().count,
          readiness,
          readColor,
          readBg,
        };
      })
    );

    return NextResponse.json({
      avgReadiness,
      readinessGrowth,
      passCount,
      failCount,
      activeUsersCount,
      newUsersTodayCount,
      difficultQuestions,
      weeklyDistribution,
      recentActivity,
    });
  } catch (err) {
    console.error('[GET /api/analytics/summary]', err);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}
