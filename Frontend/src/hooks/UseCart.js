import { useContext } from "react";
import { CartContext } from "../context/CartContext"; // must match the named export

export default function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a <CartProvider>");
  return ctx;
}
