/**
 * Thin fetch wrapper used by page components to call Next.js API routes.
 * All routes are under /api/* and use the Firebase Admin SDK on the server.
 */

// ── Types (shared between client and server) ──────────────────────────────────

export type Category = 'A' | 'B' | 'K' | 'G';
export type QuestionStatus = 'Active' | 'Draft';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type MaterialType = 'Traffic Sign' | 'Road Rule' | 'Vehicle Knowledge';
export type MaterialStatus = 'Published' | 'Draft';
export type UserStatus = 'Active' | 'Suspended';

export interface Question {
  id: string;
  category: Category;
  topic: string;
  difficulty: Difficulty;
  questionEn: string;
  questionNp: string;
  imageUrl?: string;
  options: {
    A: { en: string; np: string };
    B: { en: string; np: string };
    C: { en: string; np: string };
    D: { en: string; np: string };
  };
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  status: QuestionStatus;
  createdAt: string;
}

export interface StudyMaterial {
  id: string;
  code: string;
  contentType: MaterialType;
  vehicleCategory: string;
  difficulty: Difficulty;
  titleEn: string;
  titleNp: string;
  descEn: string;
  descNp: string;
  imageUrl?: string;
  sectionId?: string;
  dotmRef?: string;
  status: MaterialStatus;
  createdAt: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  vehicleCategory: string;
  citizenshipId: string;
  readinessScore: number;
  status: UserStatus;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

// ── Questions API ─────────────────────────────────────────────────────────────

export const questionsApi = {
  list: (params?: { category?: string; topic?: string; page?: number; pageSize?: number }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.topic) q.set('topic', params.topic);
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    return req<PaginatedResponse<Question>>(`/api/questions?${q}`);
  },
  get: (id: string) => req<Question>(`/api/questions/${id}`),
  create: (data: Omit<Question, 'id' | 'createdAt'>) =>
    req<Question>('/api/questions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Question>) =>
    req<Question>(`/api/questions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    req<{ success: boolean }>(`/api/questions/${id}`, { method: 'DELETE' }),
};

// ── Study Materials API ───────────────────────────────────────────────────────

export const materialsApi = {
  list: (params?: { contentType?: string; vehicleCategory?: string; status?: string; page?: number; pageSize?: number }) => {
    const q = new URLSearchParams();
    if (params?.contentType) q.set('contentType', params.contentType);
    if (params?.vehicleCategory) q.set('vehicleCategory', params.vehicleCategory);
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    return req<PaginatedResponse<StudyMaterial>>(`/api/materials?${q}`);
  },
  get: (id: string) => req<StudyMaterial>(`/api/materials/${id}`),
  create: (data: Omit<StudyMaterial, 'id' | 'createdAt'>) =>
    req<StudyMaterial>('/api/materials', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<StudyMaterial>) =>
    req<StudyMaterial>(`/api/materials/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    req<{ success: boolean }>(`/api/materials/${id}`, { method: 'DELETE' }),
};

// ── Users API ─────────────────────────────────────────────────────────────────

export const usersApi = {
  list: (params?: { search?: string; vehicleCategory?: string; status?: string; page?: number; pageSize?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.vehicleCategory) q.set('vehicleCategory', params.vehicleCategory);
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    return req<PaginatedResponse<User>>(`/api/users?${q}`);
  },
  get: (id: string) => req<User>(`/api/users/${id}`),
  create: (data: Omit<User, 'id' | 'createdAt'>) =>
    req<User>('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<User>) =>
    req<User>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    req<{ success: boolean }>(`/api/users/${id}`, { method: 'DELETE' }),
};

// ── Image upload (client-side → Firebase Storage) ────────────────────────────

export async function uploadImage(file: File, path: string): Promise<string> {
  const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
  const { storage } = await import('./firebase/firebaseStorage');
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
