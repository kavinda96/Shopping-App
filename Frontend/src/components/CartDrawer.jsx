import React from "react";
import useCart from "../hooks/UseCart";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CartDrawer({ open, onClose }) {
  const { cartItems, setQty, removeItem, clear, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const goCheckout = () => {
    onClose();
    // always use lowercase path to match your route
    if (!user) {
      navigate(`/login?redirect=/checkout`);
    } else {
      navigate("/checkout");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-20 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        className="h-screen w-[380px] max-w-[95vw] bg-white border-l border-gray-200 shadow-2xl transform transition-transform translate-x-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold">Your Cart</h2>
          <button className="rounded-md border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50" onClick={onClose}>
            ✕
          </button>
        </div>

        {cartItems.length === 0 ? (
          <p className="p-4 text-gray-600">Your cart is empty.</p>
        ) : (
          <div className="space-y-4 p-4">
            {cartItems.map((item) => (
              <div
                key={item.lineId ?? item.id}
                className="flex items-center justify-between gap-3 border-b border-dashed border-gray-200 pb-3"
              >
                <div>
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">${item.price.toFixed(2)} each</div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={item.qty}
                    onChange={(e) => setQty(item.lineId ?? item.id, e.target.value)}
                    className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <button
                    className="rounded-md border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50"
                    onClick={() => removeItem(item.lineId ?? item.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}

            <div className="border-t border-gray-200 pt-3 flex justify-between text-sm">
              <span>Total</span>
              <strong>${totalPrice.toFixed(2)}</strong>
            </div>

            <div className="flex gap-2">
              <button
                className="w-1/3 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                onClick={clear}
              >
                Clear
              </button>

              <button
                onClick={goCheckout}
                className="w-2/3 rounded-lg border border-gray-900 bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
