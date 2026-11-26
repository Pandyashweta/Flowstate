import { auth } from './firebase';

async function getAuthHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to run AI and backend operations.');
  }
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    ...(extra || {}),
  };
}

export async function apiPostJson<T>(url: string, body: unknown): Promise<T> {
  const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(
      typeof data?.error === 'string' ? data.error : `Request failed (${resp.status})`
    );
  }
  return data as T;
}

export async function apiUploadFile<T>(url: string, file: File): Promise<T> {
  const headers = await getAuthHeaders();
  const formData = new FormData();
  formData.append('file', file);
  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(
      typeof data?.error === 'string' ? data.error : `Upload failed (${resp.status})`
    );
  }
  return data as T;
}
