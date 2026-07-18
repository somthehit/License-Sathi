import path from 'path';
import fs from 'fs';
import { initializeApp, getApps, cert, type App, type ServiceAccount } from 'firebase-admin/app';
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
    // Resolve relative to the project root (where package.json lives)
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

let app: App;

if (!getApps().length) {
  app = initializeApp({
    credential: getCredential(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
} else {
  app = getApps()[0];
}

export const adminAuth = getAuth(app);
export const adminDb   = getFirestore(app);
export default app;
