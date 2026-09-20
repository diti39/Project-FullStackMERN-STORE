import { createContext, useEffect, useMemo, useState } from "react";
import { calcPrices } from "../utils/pricing";

export const CartContext = createContext(null);

const STORAGE_KEY = "mern-store-cart";

// Storage can be empty, corrupted, or blocked (private mode), so never trust it
function loadCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart); // function form: runs once, on first render

  // Save on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full or blocked: the cart still works in memory */
    }
  }, [items]);

  // Each item stores only what the cart needs to display. The server re-reads
  // the real name/price/stock from the database when the order is placed.
  const addItem = (product, qty = 1) => {
    const max = product.countInStock;
    if (max < 1) return;

    setItems((prev) => {
      const existing = prev.find((i) => i.product === product._id);
      if (existing) {
        return prev.map((i) =>
          i.product === product._id
            ? {
                ...i,
                qty: Math.min(i.qty + qty, max),
                countInStock: max,
                price: product.price,
              }
            : i,
        );
      }
      return [
        ...prev,
        {
          product: product._id,
          name: product.name,
          image: product.images?.[0]?.url,
          price: product.price,
          countInStock: max,
          qty: Math.min(qty, max),
        },
      ];
    });
  };

  const updateQty = (productId, qty) =>
    setItems((prev) =>
      prev.map((i) =>
        i.product === productId
          ? { ...i, qty: Math.max(1, Math.min(qty, i.countInStock)) }
          : i,
      ),
    );

  const removeItem = (productId) =>
    setItems((prev) => prev.filter((i) => i.product !== productId));
  const clearCart = () => setItems([]);

  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);
  const prices = useMemo(() => calcPrices(items), [items]);

  const value = {
    items,
    itemCount,
    prices,
    addItem,
    updateQty,
    removeItem,
    clearCart,
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
