import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const saPath = resolve(__dirname, 'license-sathi-firebase-adminsdk-fbsvc-ff25be4e81.json');
const sa = JSON.parse(readFileSync(saPath, 'utf-8'));
const { Storage } = await import('@google-cloud/storage');
const storage = new Storage({ credentials: sa, projectId: sa.project_id });
const [buckets] = await storage.getBuckets();
console.log('Available buckets:');
buckets.forEach(b => console.log(' -', b.name));
process.exit(0);
