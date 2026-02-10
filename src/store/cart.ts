"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Product } from "@/lib/types";

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => boolean;
  decrementItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getCount: () => number;
  getTotal: () => number;
  getQuantity: (productId: string) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const existing = get().items.find((i) => i.product.id === product.id);
        const currentQty = existing ? existing.quantity : 0;
        if (currentQty >= product.stock) return false;
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, { product, quantity: 1 }] });
        }
        return true;
      },
      decrementItem: (productId) => {
        const existing = get().items.find((i) => i.product.id === productId);
        if (!existing) return;
        if (existing.quantity <= 1) {
          set({ items: get().items.filter((i) => i.product.id !== productId) });
        } else {
          set({
            items: get().items.map((i) =>
              i.product.id === productId
                ? { ...i, quantity: i.quantity - 1 }
                : i
            ),
          });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.product.id !== productId) });
      },
      clearCart: () => set({ items: [] }),
      getCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getTotal: () =>
        get().items.reduce((sum, i) => sum + i.product.retailPrice * i.quantity, 0),
      getQuantity: (productId) => {
        const item = get().items.find((i) => i.product.id === productId);
        return item ? item.quantity : 0;
      },
    }),
    { name: "rexor-cart" }
  )
);
