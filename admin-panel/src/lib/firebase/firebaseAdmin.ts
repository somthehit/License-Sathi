import path from 'path';
import fs from 'fs';
import { initializeApp, getApps, getApp, cert, type App, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export function getCredential() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw || raw.trim() === '{}' || raw.trim() === '') {
    throw new Error(
      '[firebaseAdmin] No Firebase service account configured.\n' +
      'Set FIREBASE_SERVICE_ACCOUNT_KEY in .env.local or Vercel environment variables.'
    );
  }

  try {
    const parsed = JSON.parse(raw) as ServiceAccount;
    return cert(parsed);
  } catch (e) {
    console.error('[firebaseAdmin] FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON:', e);
    throw new Error('[firebaseAdmin] Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON format.');
  }
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
