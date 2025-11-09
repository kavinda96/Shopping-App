const base = import.meta.env.VITE_API_BASE;

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function adminListShops(token) {
  const r = await fetch(`${base}/admin/shops`, { headers: authHeaders(token) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function adminCreateShop(data, token) {
  const r = await fetch(`${base}/admin/shops`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function adminUpdateShop(id, data, token) {
  const r = await fetch(`${base}/admin/shops?id=${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function adminDeleteShop(id, token) {
  const r = await fetch(`${base}/admin/shops?id=${id}`, { method: 'DELETE', headers: authHeaders(token) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// Products (per shop)
export async function adminListProducts(shopId, token) {
  const r = await fetch(`${base}/admin/products?shop_id=${shopId}`, { headers: authHeaders(token) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function adminCreateProduct(data, token) {
  const r = await fetch(`${base}/admin/products`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function adminUpdateProduct(id, data, token) {
  const r = await fetch(`${base}/admin/products?id=${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function adminDeleteProduct(id, token) {
  const r = await fetch(`${base}/admin/products?id=${id}`, { method: 'DELETE', headers: authHeaders(token) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// Promos
export async function adminListPromos(token) {
  const r = await fetch(`${base}/admin/promos`, { headers: authHeaders(token) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function adminCreatePromo(data, token) {
  const r = await fetch(`${base}/admin/promos`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function adminUpdatePromo(id, data, token) {
  const r = await fetch(`${base}/admin/promos?id=${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function adminDeletePromo(id, token) {
  const r = await fetch(`${base}/admin/promos?id=${id}`, { method: 'DELETE', headers: authHeaders(token) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function adminUploadImage(file, token) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${base}/admin/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { url: "...", filename: "..." }
}
