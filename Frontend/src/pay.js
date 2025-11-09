export async function createCheckoutIntent({ promoCode = "" } = {}, token) {
  const base = import.meta.env.VITE_API_BASE;
  const res = await fetch(`${base}/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ promo_code: promoCode }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Checkout failed: ${t}`);
  }
  return res.json(); // { client_secret, ... }
}

export async function getOrderByPI(pi, token) {
  const base = import.meta.env.VITE_API_BASE;
  const url = new URL(`${base}/orders_by_pi`);
  url.searchParams.set("pi", pi);

  const res = await fetch(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

