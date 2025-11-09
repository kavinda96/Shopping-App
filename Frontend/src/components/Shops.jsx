import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE, fetchJSON } from '../api';

export default function Shops() {
  const [shops, setShops] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchJSON(`${API_BASE}/shops`)
      .then(setShops)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return shops;
    return shops.filter(s =>
      [s.name, s.address, s.description].filter(Boolean)
        .some(t => t.toLowerCase().includes(n))
    );
  }, [q, shops]);

  if (loading) return <div className="p-4">Loading shops…</div>;
  if (err) return <div className="p-4 text-red-600">Error: {err}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Shops</h1>
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search shops…"
        className="w-full max-w-md border rounded-lg px-3 py-2"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <div key={s.id} className="bg-white border rounded-xl p-3">
            {s.photo_url && (
              <img src={s.photo_url} alt={s.name}
                   className="w-full h-40 object-cover rounded-lg mb-2" />
            )}
            <div className="font-medium">{s.name}</div>
            {s.address && <div className="text-sm text-gray-600">{s.address}</div>}
            {s.description && <div className="text-sm text-gray-600 line-clamp-2">{s.description}</div>}
            <div className="mt-3">
              <Link to={`/shops/${s.id}`} className="px-3 py-1 border rounded">Open</Link>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-gray-600">No shops found.</div>}
    </div>
  );
}
