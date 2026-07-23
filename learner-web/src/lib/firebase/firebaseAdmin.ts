import path from 'path';
import fs from 'fs';
import { initializeApp, getApps, getApp, cert, type App, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function getCredential() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw && raw.trim() !== '{}' && raw.trim() !== '') {
    try {
      const parsed = JSON.parse(raw) as ServiceAccount;
      return cert(parsed);
    } catch (e) {
      console.error('[firebaseAdmin] FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON:', e);
    }
  }

  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (keyPath && keyPath.trim()) {
    const absPath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), keyPath.trim());
    try {
      const content = fs.readFileSync(absPath, 'utf-8');
      const parsed = JSON.parse(content) as ServiceAccount;
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

function getAdminApp(): App {
  if (getApps().length > 0) return getApp();
  return initializeApp({
    credential: getCredential(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

let _db: Firestore | null = null;

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_, prop: string | symbol) {
    if (!_db) _db = getFirestore(getAdminApp());
    const value = (_db as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') return (value as (...args: unknown[]) => unknown).bind(_db);
    return value;
  },
});
