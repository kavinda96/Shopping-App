export const API_BASE = 'http://api.test';


function resolveUrl(path) {
  // If path already starts with http:// or https://, just return it as-is
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path}`;
}

// Core fetch wrapper
async function baseFetch(path, opts = {}) {
  const res = await fetch(resolveUrl(path), opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// --- Public API helpers ---

// Simple GET
export async function fetchJSON(path, opts = {}) {
  return baseFetch(path, opts);
}

// Authenticated GET
export async function authGet(path, token) {
  return baseFetch(path, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// POST JSON (optionally with token)
export async function postJSON(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return baseFetch(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

// ------- CART ENDPOINTS (require auth) -------
function getToken() {
  try { return localStorage.getItem('auth_token'); } catch { return null; }
}

export async function cartList() {
  const token = getToken();
  return authGet('/cart', token);
}

export async function cartAdd(product_id, qty = 1) {
  const token = getToken();
  return postJSON('/cart', { product_id, qty }, token);
}

export async function cartUpdate(lineId, qty) {
  const token = getToken();
  return baseFetch('/cart', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ id: lineId, qty }),
  });
}

export async function cartDelete(lineId) {
  const token = getToken();
  return baseFetch(`/cart?id=${lineId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

