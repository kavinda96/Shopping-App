import React from "react";
import { Link, useNavigate } from "react-router-dom";
import useCart from "../hooks/UseCart";
import { useAuth } from "../context/AuthContext";

export default function Header({ onOpenCart }) {
  const { totalQty, clear } = useCart(); //  add clear()
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    // Clear UI cart immediately
    clear();

    // Clear auth user + token
    logout();

    // Redirect
    nav("/login");
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur px-4 py-3">
      {/* Left: App title */}
      <Link
        to="/"
        className="text-xl font-semibold tracking-tight hover:opacity-80"
      >
        ☕ Mini Shop
      </Link>

      {/* Right: Nav actions */}
      <div className="flex items-center gap-3">
        {/* Cart */}
        <button
          className="relative inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          onClick={onOpenCart}
        >
          <span>Cart</span>
          {totalQty > 0 && (
            <span className="absolute -right-2 -top-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
              {totalQty}
            </span>
          )}
        </button>

        {/* Auth buttons */}
        {user ? (
          <>
            <span className="text-sm text-gray-700">Hi, {user.name}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
