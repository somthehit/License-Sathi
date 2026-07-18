/**
 * Sets Firebase Storage CORS rules using the Google Cloud Storage Node.js SDK.
 * 
 * Usage:
 *   node scripts/set-storage-cors.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = resolve(__dirname, '..', '.env.local');
try {
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
} catch { /* ignore */ }

// Load service account
const saPath = resolve(__dirname, 'license-sathi-firebase-adminsdk-fbsvc-ff25be4e81.json');
const serviceAccount = JSON.parse(readFileSync(saPath, 'utf-8'));

const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'license-sathi.firebasestorage.app';

const { Storage } = await import('@google-cloud/storage');

// Try both bucket name formats Firebase uses
const BUCKET_NAMES = [
  BUCKET,
  BUCKET.replace('.firebasestorage.app', '.appspot.com'),
  `license-sathi.appspot.com`,
  `license-sathi`,
];

const storage = new Storage({
  credentials: serviceAccount,
  projectId: serviceAccount.project_id,
});

const corsConfig = [
  {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://license-sathi.web.app',
      'https://license-sathi.firebaseapp.com',
    ],
    method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
    responseHeader: ['Content-Type', 'Authorization', 'Content-Length', 'User-Agent', 'x-goog-resumable'],
    maxAgeSeconds: 3600,
  },
];

try {
  const bucket = storage.bucket(BUCKET);
  await bucket.setCorsConfiguration(corsConfig);
  console.log(`✔ CORS rules applied to gs://${BUCKET}`);
  console.log('  Origins allowed:', corsConfig[0].origin.join(', '));
} catch (err) {
  console.error('❌ Failed to set CORS:', err.message);
  console.log('\n── Manual fix ──────────────────────────────────────────────────');
  console.log('Run this command (requires gsutil logged in with the right account):');
  console.log(`  gsutil cors set cors.json gs://${BUCKET}`);
  console.log('\nOr set CORS via Firebase Console:');
  console.log('  https://console.firebase.google.com/project/license-sathi/storage');
}

process.exit(0);
