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

    // Run all counts in parallel
    const [
      usersSnap,
      questionsSnap,
      draftQuestionsSnap,
      materialsSnap,
      examResultsSnap,
      recentExamsSnap,
      recentMaterialsSnap,
      setsSnap,
    ] = await Promise.all([
      adminDb.collection('users').where('status', '==', 'Active').count().get(),
      adminDb.collection('questions').where('status', '==', 'Active').count().get(),
      adminDb.collection('questions').where('status', '==', 'Draft').count().get(),
      adminDb.collection('study_materials').count().get(),
      adminDb.collection('exam_results').count().get(),
      // Latest 5 exam results for live feed
      adminDb.collection('exam_results').orderBy('createdAt', 'desc').limit(5).get(),
      // Latest 3 study materials for recent content
      adminDb.collection('study_materials').orderBy('createdAt', 'desc').limit(3).get(),
      adminDb.collection('question_sets').count().get(),
    ]);

    const totalUsers = usersSnap.data().count;
    const activeQuestions = questionsSnap.data().count;
    const draftQuestions = draftQuestionsSnap.data().count;
    const totalMaterials = materialsSnap.data().count;
    const totalExams = examResultsSnap.data().count;
    const totalSets = setsSnap.data().count;

    // Pass rate from last 50 exams
    const last50Snap = await adminDb.collection('exam_results')
      .orderBy('createdAt', 'desc').limit(50).get();
    const last50 = last50Snap.docs.map(d => d.data());
    const passRate = last50.length > 0
      ? Math.round((last50.filter(e => e.passed).length / last50.length) * 100)
      : 0;

    // Avg score
    const avgScore = last50.length > 0
      ? Math.round(last50.reduce((s, e) => s + ((e.score / e.totalQuestions) * 100), 0) / last50.length)
      : 0;

    // Live feed: recent exam results enriched with user names
    const feedItems = await Promise.all(
      recentExamsSnap.docs.map(async (doc) => {
        const data = doc.data();
        let userName = 'Unknown User';
        try {
          const userDoc = await adminDb.collection('users').doc(data.userId).get();
          if (userDoc.exists) {
            const u = userDoc.data();
            userName = u?.name ?? u?.fullName ?? userName;
          }
        } catch { /* ignore */ }
        return {
          id: doc.id,
          userName,
          category: data.category,
          score: data.score,
          totalQuestions: data.totalQuestions,
          passed: data.passed,
          createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        };
      })
    );

    // Recent content updates from study materials
    const recentContent = recentMaterialsSnap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        title: d.titleEn,
        contentType: d.contentType,
        status: d.status,
        createdAt: d.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      };
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        activeQuestions,
        draftQuestions,
        totalMaterials,
        totalExams,
        totalSets,
        passRate,
        avgScore,
      },
      feedItems,
      recentContent,
    });
  } catch (err) {
    console.error('[GET /api/dashboard]', err);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
