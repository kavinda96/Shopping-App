import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE, fetchJSON } from '../api';
import ProductCard from './ProductCard'; // reuse your existing card

export default function ShopDetail() {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetchJSON(`${API_BASE}/shops`)
      .then(all => setShop(all.find(x => String(x.id) === String(id)) || null))
      .catch(() => setShop(null));
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchJSON(`${API_BASE}/shops/${id}/products`)
      .then(setProducts)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="space-y-4">
      <div>
        <Link to="/" className="text-sm">&larr; Back to shops</Link>
      </div>

      <div>
        <h1 className="text-xl font-semibold">{shop?.name || 'Shop'}</h1>
        {shop?.address && <div className="text-gray-600">{shop.address}</div>}
      </div>

      {loading ? (
        <div>Loading products…</div>
      ) : err ? (
        <div className="text-red-600">Error: {err}</div>
      ) : products.length === 0 ? (
        <div className="text-gray-600">No products available.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
          
            <ProductCard
              key={p.id}
              product={{ id: p.id, name: p.name, price: p.price_cents/100, image: p.photo_url }}
            />
       
          ))}
        </div>
      )}
    </div>
  );
}
