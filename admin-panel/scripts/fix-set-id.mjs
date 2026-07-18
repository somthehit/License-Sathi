import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

const saPath = resolve(__dirname, 'license-sathi-firebase-adminsdk-fbsvc-ff25be4e81.json');
const serviceAccount = JSON.parse(readFileSync(saPath, 'utf-8'));

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

async function run() {
  const snap = await db.collection('questions').get();
  const batch = db.batch();
  let count = 0;
  snap.forEach(doc => {
    if (doc.data().setId === undefined || doc.data().setId === null) {
      batch.update(doc.ref, { setId: '' });
      count++;
    }
  });
  if (count > 0) await batch.commit();
  console.log('Fixed ' + count + ' questions missing setId.');
}

run();
