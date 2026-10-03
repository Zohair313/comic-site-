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
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
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

export function apiAsset(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Resolves any stored image value into something <img src> can load: absolute
 * URLs, inline data URLs (local-only uploads), backend `/uploads` paths, and
 * plain paths that live in the site's own /public folder.
 */
export function resolveSrc(value) {
  const src = String(value ?? '').trim();
  if (!src) return '';
  if (/^(data:|blob:|https?:\/\/)/i.test(src)) return src;
  if (src.startsWith('/uploads/')) return `${API_URL}${src}`;
  return `${import.meta.env.BASE_URL}${src.replace(/^\/+/, '')}`;
}

export async function uploadAdminImage(file) {
  const token = getApiToken();
  if (!token) throw new Error('Not authenticated');
  const form = new FormData();
  form.set('image', file);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    const res = await fetch(`${API_URL}/api/admin/images`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return body;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('That upload timed out.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchVenmoConfig() {
  return jsonFetch('/api/venmo/config');
}

/**
 * Checkout accepts either JSON or multipart. Passing a `proof` File switches it
 * to multipart so the payment screenshot can ride along.
 */
export async function createVenmoOrder({ items, buyer, proof = null, handle = '', transactionId = '' }) {
  const buyerPayload = {
    ...buyer,
    ...(handle ? { handle } : {}),
    ...(transactionId ? { transactionId } : {}),
  };

  if (!proof) {
    return jsonFetch('/api/venmo/orders', {
      method: 'POST',
      body: JSON.stringify({ items, buyer: buyerPayload }),
    });
  }

  const form = new FormData();
  form.set('items', JSON.stringify(items));
  form.set('buyer', JSON.stringify(buyerPayload));
  form.set('proof', proof);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`${API_URL}/api/venmo/orders`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return body;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchVenmoOrder(id, token) {
  return jsonFetch(`/api/venmo/orders/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`);
}

function authedOptions(options = {}) {
  const token = getApiToken();
  if (!token) throw new Error('Not authenticated');
  return {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  };
}

async function authedJson(path, options = {}) {
  return jsonFetch(path, authedOptions(options));
}

export async function fetchVenmoAdminConfig() {
  return authedJson('/api/venmo/admin/config');
}

export async function saveVenmoAdminConfig(config) {
  return authedJson('/api/venmo/admin/config', {
    method: 'PUT',
    body: JSON.stringify(config),
  });
}

export async function fetchAdminVenmoOrders({ status = '', q = '', limit = 50 } = {}) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  if (q) params.set('q', q);
  params.set('limit', String(limit));
  return authedJson(`/api/venmo/admin/orders?${params.toString()}`);
}

export async function updateAdminVenmoOrder(id, patch) {
  return authedJson(`/api/venmo/admin/orders/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function verifyAdminVenmoOrder(id, payload) {
  const token = getApiToken();
  if (!token) throw new Error('Not authenticated');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${API_URL}/api/venmo/admin/orders/${encodeURIComponent(id)}/verify`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload || {}),
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, body };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The proof route needs the admin bearer token, so it cannot be a plain <img src>.
 * Fetch it and hand back an object URL the caller must revoke.
 */
export async function fetchVenmoProofBlobUrl(id) {
  const token = getApiToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_URL}/api/venmo/admin/orders/${encodeURIComponent(id)}/proof`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return URL.createObjectURL(await res.blob());
}

export async function resendVenmoOrderAlert(id) {
  return authedJson(`/api/venmo/admin/orders/${encodeURIComponent(id)}/alert`, { method: 'POST' });
}

export async function fetchVenmoAssets() {
  return authedJson('/api/venmo/admin/assets');
}

export async function uploadVenmoAsset({ file, label, description = '', productIds = [] }) {
  const token = getApiToken();
  if (!token) throw new Error('Not authenticated');
  const form = new FormData();
  form.set('file', file);
  form.set('label', label || file.name);
  form.set('description', description);
  form.set('productIds', productIds.join(','));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    const res = await fetch(`${API_URL}/api/venmo/admin/assets`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return body;
  } finally {
    clearTimeout(timer);
  }
}

export async function updateVenmoAsset(id, patch) {
  return authedJson(`/api/venmo/admin/assets/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteVenmoAsset(id) {
  return authedJson(`/api/venmo/admin/assets/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

