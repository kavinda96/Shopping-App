// src/components/Checkout.jsx
import React from "react";
import useCart from "../hooks/UseCart";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { createCheckoutIntent } from "../pay"; 

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// ----- Inner form that actually confirms payment -----
function CheckoutForm({ clientSecret }) {
  const stripe = useStripe();
  const elements = useElements();
  const nav = useNavigate();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!stripe || !elements) return;

    setSubmitting(true);

    // Confirm the PaymentIntent created by the backend (Payment Element)
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Stripe may redirect here for 3DS; we also handle SPA flow below
        return_url: window.location.origin + "/order/success",
      },
      redirect: "if_required",
    });

    setSubmitting(false);

    if (confirmError) {
      setError(confirmError.message || "Payment failed");
      return;
    }

    const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
    if (paymentIntent?.id) {
      // Pass PI id so the success page can fetch the invoice
      nav(`/order/success?payment_intent=${paymentIntent.id}`);
    } else {
      nav("/order/success");
    }
  };

  if (!clientSecret) return null;

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-lg bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
      >
        {submitting ? "Processing..." : "Pay now"}
      </button>
    </form>
  );
}

// ----- Page -----
export default function Checkout() {
  const { cartItems, totalPrice, setQty, removeItem, clear } = useCart();
  const { user, token } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const [clientSecret, setClientSecret] = React.useState("");
  const [promo, setPromo] = React.useState("");
  const [loadingPI, setLoadingPI] = React.useState(false);
  const [note, setNote] = React.useState("");

  // NEW: server totals to display discount + final amount
  const [serverAmountCents, setServerAmountCents] = React.useState(0);
  const [serverCurrency, setServerCurrency] = React.useState("aud");
  const [serverDiscountCents, setServerDiscountCents] = React.useState(0);

  // Require login before checkout
  React.useEffect(() => {
    if (!user) {
      nav(`/login?redirect=/checkout`, { replace: true, state: { from: loc } });
    }
  }, [user, nav, loc]);

  // Create (or refresh) PaymentIntent on server
  const refreshPI = React.useCallback(async () => {
    if (!user || cartItems.length === 0) {
      setClientSecret("");
      setServerAmountCents(0);
      setServerDiscountCents(0);
      return;
    }
    try {
      setLoadingPI(true);
      // Server calculates amount from DB cart for this user (uses Bearer token)
      const res = await createCheckoutIntent({ promoCode: promo }, token);
      // res: { client_secret, amount, currency, discount_cents, note? }
      setClientSecret(res.client_secret || "");
      setNote(res.note || "");
      setServerAmountCents(Number(res.amount || 0));
      setServerCurrency(String(res.currency || "aud"));
      setServerDiscountCents(Number(res.discount_cents || 0));
    } catch (e) {
      // For invalid promo, backend responds 422 -> falls here
      setClientSecret("");
      setNote(e.message || "Could not start checkout");
      setServerAmountCents(0);
      setServerDiscountCents(0);
    } finally {
      setLoadingPI(false);
    }
  }, [user, cartItems.length, promo, token]);

  // Run on mount and whenever cart size or promo changes
  React.useEffect(() => {
    refreshPI();
  }, [refreshPI]);

  if (!user) return null;

  // Simple helpers
  const fmtMoney = (cents, currency = "aud") =>
    `${currency.toUpperCase()} ${(
      Math.max(0, Number(cents) || 0) / 100
    ).toFixed(2)}`;

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Checkout</h1>

      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <ul className="divide-y divide-gray-200 mb-4">
            {cartItems.map((item) => (
              <li
                key={item.lineId ?? item.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">
                    ${item.price.toFixed(2)} each
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={item.qty}
                    onChange={(e) =>
                      setQty(item.lineId ?? item.id, e.target.value)
                    }
                    className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <button
                    className="rounded-md border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50"
                    onClick={() => removeItem(item.lineId ?? item.id)}
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Promo */}
          <div className="mb-2 flex gap-2">
            <input
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  refreshPI();
                }
              }}
              placeholder="Promo code"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              onClick={refreshPI}
              className="rounded-md border px-3 py-2 text-sm"
              disabled={loadingPI}
              title="Apply promo"
            >
              Apply
            </button>
          </div>

          {/* Totals: show client subtotal, server discount, server grand total */}
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal (cart)</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Discount (server)</span>
              <span>- {fmtMoney(serverDiscountCents, serverCurrency)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-medium">
              <span>Total (server)</span>
              <span>{fmtMoney(serverAmountCents, serverCurrency)}</span>
            </div>
          </div>

          {/* If backend returns note when stripe_secret missing */}
          {note && !clientSecret && (
            <p className="mt-3 text-sm text-amber-700">{note}</p>
          )}

          {/* Payment Element */}
          {clientSecret ? (
            // key forces re-mount when a brand new clientSecret arrives (prevents stale element)
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: { theme: "stripe" } }}
              key={clientSecret}
            >
              <CheckoutForm clientSecret={clientSecret} />
            </Elements>
          ) : (
            <button
              className="mt-4 w-full rounded-lg bg-gray-300 py-2 text-sm"
              disabled
            >
              {loadingPI ? "Setting up payment..." : "Payment unavailable"}
            </button>
          )}

          <button
            className="mt-2 w-full rounded-lg border py-2 text-sm"
            onClick={clear}
          >
            Clear cart
          </button>
        </>
      )}
    </main>
  );
}
