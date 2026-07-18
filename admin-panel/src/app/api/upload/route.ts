/**
 * POST /api/upload
 * Accepts a multipart/form-data file upload and stores it in Firebase Storage
 * server-side (bypasses browser CORS restrictions entirely).
 *
 * Body: FormData with a field named "file" and a field named "path" (storage path prefix)
 * Returns: { url: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/firebaseAdmin';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import path from 'path';
import fs from 'fs';

const SESSION_COOKIE = 'admin_session';

async function requireAdmin(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try { return await adminAuth.verifySessionCookie(cookie, true); }
  catch { return null; }
}

function getAdminApp() {
  // Reuse existing app or initialise with storage bucket
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (getApps().find(a => a.name === 'storage-app')) {
    return getApps().find(a => a.name === 'storage-app')!;
  }

  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const rawKey  = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  let credential;

  if (rawKey && rawKey !== '{}') {
    credential = cert(JSON.parse(rawKey));
  } else if (keyPath) {
    const absPath = path.resolve(process.cwd(), keyPath);
    credential = cert(JSON.parse(fs.readFileSync(absPath, 'utf-8')));
  } else {
    throw new Error('No Firebase credentials configured');
  }

  return initializeApp({
    credential,
    storageBucket: bucketName,
  }, 'storage-app');
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file     = formData.get('file') as File | null;
    const folder   = (formData.get('path') as string | null) ?? 'uploads';

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    // Validate type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, WebP or GIF images are allowed' }, { status: 400 });
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 2MB' }, { status: 400 });
    }

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const storageApp    = getAdminApp();
    const storageBucket = getStorage(storageApp).bucket();
    const fileName      = `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const fileRef       = storageBucket.file(fileName);

    await fileRef.save(buffer, {
      metadata: { contentType: file.type },
    });

    // Make the file publicly readable
    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${storageBucket.name}/${fileName}`;

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error('[POST /api/upload]', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
