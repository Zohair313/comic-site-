const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const isApiConfigured = Boolean(API_URL);
export const getApiUrl = () => API_URL;

const TOKEN_KEY = 'gf_api_token';

export function getApiToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setApiToken(token) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* no-op */
  }
}

export function clearApiToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* no-op */
  }
}

async function jsonFetch(path, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return body;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchRemoteContent() {
  const body = await jsonFetch('/api/content');
  return body.content ?? null;
}

export async function apiLogin(username, password) {
  const res = await jsonFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (res.token) setApiToken(res.token);
  return res;
}

export async function saveRemoteContent(content) {
  const token = getApiToken();
  if (!token) throw new Error('Not authenticated');
  return jsonFetch('/api/content', {
    method: 'PUT',
    body: JSON.stringify({ content }),
    headers: { Authorization: `Bearer ${token}` },
  });
}