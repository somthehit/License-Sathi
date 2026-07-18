import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const DOC = () => adminDb.collection('app_settings').doc('config');
const SESSION_COOKIE = 'admin_session';

async function getAdminUid(req: NextRequest): Promise<string | null> {
  try {
    const cookie = req.cookies.get(SESSION_COOKIE)?.value;
    if (!cookie) return null;
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    return decoded.uid;
  } catch {
    return null;
  }
}

// GET /api/settings
export async function GET(req: NextRequest) {
  try {
    const uid = await getAdminUid(req);
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const snap = await DOC().get();
    if (!snap.exists) {
      // Return sensible defaults if doc doesn't exist yet
      return NextResponse.json({
        appName: 'License Sathi',
        supportEmail: 'support@licensesathi.com.np',
        maintenanceMode: false,
        version: '2.4.1',
        passingScore: 60,
        examDuration: 1800,
        questionsPerExam: 50,
        categories: ['A', 'B', 'K', 'G'],
        // Security
        twoFaEnforced: false,
        ipWhitelistEnabled: false,
        ipWhitelist: '',
        maxLoginAttempts: 5,
        // Notifications
        notifyCriticalAlerts: true,
        notifyNewUsers: false,
        notifyExamCompletion: true,
        notifyAdminEmail: 'support@licensesathi.com.np',
        // Localization
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'np'],
        timezone: 'Asia/Kathmandu',
        dateFormat: 'DD/MM/YYYY',
      });
    }
    return NextResponse.json({ id: snap.id, ...snap.data() });
  } catch (err) {
    console.error('[GET /api/settings]', err);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PATCH /api/settings
export async function PATCH(req: NextRequest) {
  try {
    const uid = await getAdminUid(req);
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    // Remove server-managed fields from client payload
    const { id: _id, updatedAt: _u, updatedBy: _ub, ...fields } = body;

    await DOC().set(
      { ...fields, updatedAt: FieldValue.serverTimestamp(), updatedBy: uid },
      { merge: true }
    );

    const updated = await DOC().get();
    return NextResponse.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error('[PATCH /api/settings]', err);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
