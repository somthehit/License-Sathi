/**
 * One-time admin user seeder.
 *
 * Usage (two options — pick one):
 *
 *   Option A — pass the path to your serviceAccountKey.json:
 *     node scripts/seed-admin.mjs path/to/serviceAccountKey.json
 *
 *   Option B — set FIREBASE_SERVICE_ACCOUNT_KEY in .env.local as stringified JSON
 *     node scripts/seed-admin.mjs
 *
 * The script is safe to run multiple times — it skips creation if the user
 * already exists and just ensures the Firestore doc + custom claims are correct.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ───────────────────────────────────────────────────────────
const envPath = resolve(__dirname, '..', '.env.local');
try {
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key   = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
  console.log('✔ Loaded .env.local');
} catch {
  console.warn('⚠  Could not load .env.local — using existing environment variables.');
}

// ── Admin credentials from seed-admin.json ───────────────────────────────────
const credPath = resolve(__dirname, 'seed-admin.json');
let adminCreds;
try {
  adminCreds = JSON.parse(readFileSync(credPath, 'utf-8'));
  console.log('✔ Admin credentials loaded from seed-admin.json');
} catch {
  console.error('❌  Could not read scripts/seed-admin.json');
  process.exit(1);
}

const ADMIN_EMAIL    = adminCreds.email;
const ADMIN_PASSWORD = adminCreds.password;
const ADMIN_NAME     = adminCreds.name;
const ADMIN_ROLE     = adminCreds.role ?? 'admin';
const ADMIN_STATUS   = adminCreds.status ?? 'active';

if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
  console.error('❌  seed-admin.json must have "name", "email", and "password" fields.');
  process.exit(1);
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error('❌  NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set.');
  process.exit(1);
}

// ── Resolve service account ───────────────────────────────────────────────────
let serviceAccount;

const argPath = process.argv[2]; // e.g. node seed-admin.mjs path/to/key.json
if (argPath) {
  // Option A: path passed as CLI argument — highest priority
  const absPath = resolve(process.cwd(), argPath);
  try {
    serviceAccount = JSON.parse(readFileSync(absPath, 'utf-8'));
    console.log(`✔ Service account loaded from: ${absPath}`);
  } catch {
    console.error(`❌  Could not read service account file: ${absPath}`);
    process.exit(1);
  }
} else {
  // Option B: path in env var
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (keyPath && keyPath.trim()) {
    const absPath = resolve(process.cwd(), keyPath.trim());
    try {
      serviceAccount = JSON.parse(readFileSync(absPath, 'utf-8'));
      console.log(`✔ Service account loaded from path env: ${absPath}`);
    } catch {
      console.error(`❌  Could not read FIREBASE_SERVICE_ACCOUNT_PATH: ${absPath}`);
      process.exit(1);
    }
  } else {
    // Option C: full JSON string in env var
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw || raw.trim() === '{}' || raw.trim() === '') {
      console.error(
        '❌  No service account provided.\n\n' +
        '    Option A — pass the path to your key file as a CLI argument:\n' +
        '      node scripts/seed-admin.mjs path/to/serviceAccountKey.json\n\n' +
        '    Option B — set path in .env.local:\n' +
        '      FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json\n\n' +
        '    Option C — paste full JSON in .env.local:\n' +
        "      FIREBASE_SERVICE_ACCOUNT_KEY='{...full JSON...}'"
      );
      process.exit(1);
    }
    try {
      serviceAccount = JSON.parse(raw);
      console.log('✔ Service account loaded from FIREBASE_SERVICE_ACCOUNT_KEY env var');
    } catch {
      console.error('❌  FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON.');
      process.exit(1);
    }
  }
}

// ── Initialise Firebase Admin ─────────────────────────────────────────────────
const { initializeApp, cert } = await import('firebase-admin/app');
const { getAuth }              = await import('firebase-admin/auth');
const { getFirestore }         = await import('firebase-admin/firestore');

const app  = initializeApp({ credential: cert(serviceAccount), projectId });
const auth = getAuth(app);
const db   = getFirestore(app);

// ── 1. Create or fetch the Firebase Auth user ─────────────────────────────────
let uid;
try {
  const existing = await auth.getUserByEmail(ADMIN_EMAIL);
  uid = existing.uid;
  console.log(`ℹ  Auth user already exists → uid: ${uid}`);
} catch (err) {
  if (err.code === 'auth/user-not-found') {
    const created = await auth.createUser({
      email:         ADMIN_EMAIL,
      password:      ADMIN_PASSWORD,
      displayName:   ADMIN_NAME,
      emailVerified: true,
    });
    uid = created.uid;
    console.log(`✔ Created Firebase Auth user → uid: ${uid}`);
  } else {
    throw err;
  }
}

// ── 2. Set custom claims (role embedded in ID token) ─────────────────────────
await auth.setCustomUserClaims(uid, { role: ADMIN_ROLE });
console.log(`✔ Custom claim set → { role: "${ADMIN_ROLE}" }`);

// ── 3. Write Firestore admins document ───────────────────────────────────────
await db.collection('admins').doc(uid).set({
  name:      ADMIN_NAME,
  email:     ADMIN_EMAIL,
  role:      ADMIN_ROLE,
  status:    ADMIN_STATUS,
  createdAt: new Date().toISOString(),
}, { merge: true });
console.log('✔ Firestore admins doc written');

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Admin user ready');
console.log(`  Name     : ${ADMIN_NAME}`);
console.log(`  Email    : ${ADMIN_EMAIL}`);
console.log(`  Role     : ${ADMIN_ROLE}`);
console.log(`  Status   : ${ADMIN_STATUS}`);
console.log(`  UID      : ${uid}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

process.exit(0);
