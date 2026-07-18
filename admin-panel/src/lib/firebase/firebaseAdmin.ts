import path from 'path';
import fs from 'fs';
import { initializeApp, getApps, getApp, cert, type App, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getCredential() {
  // Option A: full JSON string in env var (recommended for production / Vercel)
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw && raw.trim() !== '{}' && raw.trim() !== '') {
    try {
      const parsed = JSON.parse(raw) as ServiceAccount;
      console.log('[firebaseAdmin] Using FIREBASE_SERVICE_ACCOUNT_KEY env var');
      return cert(parsed);
    } catch (e) {
      console.error('[firebaseAdmin] FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON:', e);
    }
  }

  // Option B: path to key file (local dev)
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (keyPath && keyPath.trim()) {
    const absPath = path.resolve(process.cwd(), keyPath.trim());
    try {
      const content = fs.readFileSync(absPath, 'utf-8');
      const parsed = JSON.parse(content) as ServiceAccount;
      console.log(`[firebaseAdmin] Using service account key from: ${absPath}`);
      return cert(parsed);
    } catch (e) {
      console.error(`[firebaseAdmin] Could not load service account from: ${absPath}`, e);
    }
  }

  throw new Error(
    '[firebaseAdmin] No Firebase service account configured.\n' +
    'Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_KEY in .env.local'
  );
}

// Lazy initialization — only runs at request time, NOT during build
function getAdminApp(): App {
  if (getApps().length > 0) return getApp();
  return initializeApp({
    credential: getCredential(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

export const adminAuth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(_, prop) {
    return (getAuth(getAdminApp()) as never)[prop as keyof ReturnType<typeof getAuth>];
  },
});

export const adminDb = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(_, prop) {
    return (getFirestore(getAdminApp()) as never)[prop as keyof ReturnType<typeof getFirestore>];
  },
});

export default { get app() { return getAdminApp(); } };
