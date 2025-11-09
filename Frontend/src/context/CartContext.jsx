import React, { createContext, useEffect, useMemo } from "react";
import { cartList, cartAdd, cartUpdate, cartDelete } from "../api";
import { useAuth } from "../context/AuthContext";

export const CartContext = createContext(null);

const STORAGE_KEY = "cart:v2";
const initialCart = { items: [] };

function mapServerItems(rows) {
  return rows.map((r) => ({
    lineId: r.id,
    id: r.product_id,
    shopId: r.shop_id,
    name: r.name,
    price: (r.price_cents || 0) / 100,
    image: r.photo_url,
    qty: r.qty,
    shopName: r.shop_name,
  }));
}

function cartReducer(state, action) {
  switch (action.type) {
    case "SET_ALL":
      return { ...state, items: action.payload };
    case "ADD": {
      const { id, name, price, image, qty = 1 } = action.payload;
      const exists = state.items.find((i) => i.id === id);
      if (exists) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === id
              ? { ...i, qty: i.qty + Math.max(1, Number(qty) || 1) }
              : i
          ),
        };
      }
      return {
        ...state,
        items: [
          ...state.items,
          {
            id,
            name,
            price: Number(price) || 0,
            image,
            qty: Math.max(1, Number(qty) || 1),
          },
        ],
      };
    }
    case "REMOVE":
      return {
        ...state,
        items: state.items.filter(
          (i) => (i.lineId ?? i.id) !== action.payload.key
        ),
      };
    case "SET_QTY":
      return {
        ...state,
        items: state.items.map((i) =>
          (i.lineId ?? i.id) === action.payload.key
            ? { ...i, qty: Math.max(1, Number(action.payload.qty) || 1) }
            : i
        ),
      };
    case "CLEAR":
      return { ...state, items: [] };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = React.useReducer(
    cartReducer,
    initialCart,
    (init) => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : init;
      } catch {
        return init;
      }
    }
  );

  const { user, token } = useAuth() || {};

  // Save guest cart while logged out
  useEffect(() => {
    if (!user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, user]);

  // On login: merge guest -> server, then load server cart
  useEffect(() => {
    if (!user || !token) return;

    (async () => {
      try {
        const guest = (() => {
          try {
            return JSON.parse(
              localStorage.getItem(STORAGE_KEY) || '{"items":[]}'
            );
          } catch {
            return { items: [] };
          }
        })();

        if (guest.items?.length) {
          for (const it of guest.items) await cartAdd(it.id, it.qty);
          localStorage.removeItem(STORAGE_KEY);
        }

        const { items } = await cartList();
        dispatch({ type: "SET_ALL", payload: mapServerItems(items) });
      } catch {
        /* ignore */
      }
    })();
  }, [user?.id, token]);

  const addItem = async (product, qty = 1) => {
    if (user && token) {
      await cartAdd(product.id, qty);
      const { items } = await cartList();
      dispatch({ type: "SET_ALL", payload: mapServerItems(items) });
    } else {
      dispatch({ type: "ADD", payload: { ...product, qty } });
    }
  };

  const setQty = async (idOrLineId, qty) => {
    if (user && token) {
      await cartUpdate(idOrLineId, qty);
      const { items } = await cartList();
      dispatch({ type: "SET_ALL", payload: mapServerItems(items) });
    } else {
      dispatch({ type: "SET_QTY", payload: { key: idOrLineId, qty } });
    }
  };

  const removeItem = async (idOrLineId) => {
    if (user && token) {
      await cartDelete(idOrLineId);
      const { items } = await cartList();
      dispatch({ type: "SET_ALL", payload: mapServerItems(items) });
    } else {
      dispatch({ type: "REMOVE", payload: { key: idOrLineId } });
    }
  };

  // UI clear only; DB stays (correct behavior)
  const clear = () => dispatch({ type: "CLEAR" });

  const totalQty = useMemo(
    () => state.items.reduce((s, i) => s + (Number(i.qty) || 0), 0),
    [state.items]
  );
  const totalPrice = useMemo(
    () =>
      state.items.reduce(
        (s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0),
        0
      ),
    [state.items]
  );

  const value = {
    cartItems: state.items,
    addItem,
    removeItem,
    setQty,
    clear,
    totalQty,
    totalPrice,
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
