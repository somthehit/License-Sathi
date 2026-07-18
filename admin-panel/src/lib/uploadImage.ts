/**
 * Uploads an image via the server-side /api/upload route.
 * This avoids Firebase Storage CORS issues in the browser entirely.
 */
export async function uploadImage(file: File, folder: string = 'uploads'): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', folder);

  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error ?? 'Upload failed');
  }
  const { url } = await res.json();
  return url;
}
