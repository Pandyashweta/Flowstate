import { auth } from './firebase';

const SESSION_TOKEN_KEY = 'flowstate_session_token';

export function getStoredSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

export function setStoredSessionToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  }
}

async function getAuthHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const sessionToken = getStoredSessionToken();
  if (sessionToken) {
    return {
      Authorization: `Bearer ${sessionToken}`,
      ...(extra || {}),
    };
  }
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

export async function apiGetPublic<T>(url: string): Promise<T> {
  const resp = await fetch(url, { method: 'GET' });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(
      typeof data?.error === 'string' ? data.error : `Request failed (${resp.status})`
    );
  }
  return data as T;
}

export async function apiPostPublic<T>(url: string, body: unknown): Promise<T> {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

export async function apiGetJson<T>(url: string): Promise<T> {
  const headers = await getAuthHeaders();
  const resp = await fetch(url, { method: 'GET', headers });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(
      typeof data?.error === 'string' ? data.error : `Request failed (${resp.status})`
    );
  }
  return data as T;
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

export async function apiPatchJson<T>(url: string, body: unknown): Promise<T> {
  const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
  const resp = await fetch(url, {
    method: 'PATCH',
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

export async function apiDeleteJson<T>(url: string): Promise<T> {
  const headers = await getAuthHeaders();
  const resp = await fetch(url, { method: 'DELETE', headers });
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

export async function apiPostFormData<T>(url: string, formData: FormData): Promise<T> {
  const headers = await getAuthHeaders();
  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(
      typeof data?.error === 'string' ? data.error : `Request failed (${resp.status})`
    );
  }
  return data as T;
}
