import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import CartDrawer from "./components/CartDrawer";

export default function App() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      <Header onOpenCart={() => setOpen(true)} />
      <main className="mx-auto max-w-6xl p-4">
        <Outlet />
      </main>
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
