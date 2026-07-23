/**
 * Directly seeds admin_api_keys and system_prompts collections.
 * Run: node scripts/seed-missing.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = resolve(__dirname, '../.env.local');
const envLines = readFileSync(envPath, 'utf8').split('\n');
for (const line of envLines) {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
}
console.log('✔ Loaded .env.local');

// Init Firebase Admin
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let db;
const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (saJson) {
  const sa = JSON.parse(saJson);
  initializeApp({ credential: cert(sa) });
  console.log('✔ Service account loaded:', sa.project_id);
  db = getFirestore();
} else {
  console.error('❌ No service account found. Set FIREBASE_SERVICE_ACCOUNT_KEY in .env.local');
  process.exit(1);
}

// ── Write admin_api_keys ───────────────────────────────────────────────────────
console.log('\n── Writing admin_api_keys ──────────────────────────');
const services = ['openai', 'gemini', 'anthropic', 'admob'];
for (const service of services) {
  const docRef = db.collection('admin_api_keys').doc(service);
  await docRef.set({
    service,
    is_configured: false,
    encrypted_key: null,
    updated_at: null,
    updated_by: null,
    note: `Set your ${service.toUpperCase()} API key from Admin Panel → Settings → API Keys`,
  });
  // Verify it was written
  const snap = await docRef.get();
  if (snap.exists) {
    console.log(`  ✔ admin_api_keys/${service} → exists: true`);
  } else {
    console.log(`  ❌ admin_api_keys/${service} → FAILED to write!`);
  }
}

// ── Write system_prompts ───────────────────────────────────────────────────────
console.log('\n── Writing system_prompts ──────────────────────────');
const promptRef = db.collection('system_prompts').doc('ask-expert-v1');
await promptRef.set({
  name: 'ask_expert_system_prompt',
  version: 'v1',
  is_active: true,
  created_at: new Date().toISOString(),
  prompt_text: `You are License Sathi's AI driving expert assistant, specializing in Nepal's traffic laws, road signs, and vehicle regulations as defined by the Department of Transport Management (DoTM).

Your role:
- Answer questions clearly and accurately in the same language the user asks (Nepali or English).
- Base your answers ONLY on the provided context from the knowledge base.
- If the context does not contain enough information, say "I don't have specific information on that, please consult the DoTM website or a licensed driving instructor."
- Keep answers concise and practical — users are preparing for their driving license exam.
- Format answers with bullet points when listing rules or steps.
- Always be polite and encouraging.

Context from knowledge base:
{context}

User question:
{question}`,
});
const promptSnap = await promptRef.get();
console.log(`  ✔ system_prompts/ask-expert-v1 → exists: ${promptSnap.exists}`);

// ── List all collections to confirm ────────────────────────────────────────────
console.log('\n── All Firestore collections ────────────────────────');
const collections = await db.listCollections();
for (const col of collections) {
  const count = (await col.count().get()).data().count;
  console.log(`  ${col.id.padEnd(25)} ${count} docs`);
}

console.log('\n✅ Done!');
process.exit(0);
