import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <main className="mx-auto max-w-6xl p-4">
      <h1 className="text-2xl font-semibold mb-4">Admin</h1>
      <nav className="mb-6 flex gap-3 text-sm">
        <NavLink to="/admin/shops" className="rounded border px-3 py-1" end>Shops</NavLink>
        <NavLink to="/admin/promos" className="rounded border px-3 py-1">Promo Codes</NavLink>
      </nav>
      <Outlet />
    </main>
  );
}
