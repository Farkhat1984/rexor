"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/lib/types";

interface ProductsStore {
  products: Product[];
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  addProducts: (products: Product[]) => void;
  removeProduct: (id: string) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  updateStock: (id: string, delta: number) => void;
  toggleNew: (id: string) => void;
  toggleHit: (id: string) => void;
  toggleMain: (id: string) => void;
}

export const useProductsStore = create<ProductsStore>()(
  persist(
    (set, get) => ({
      products: [],
      setProducts: (products) => set({ products }),
      addProduct: (product) =>
        set({ products: [product, ...get().products] }),
      addProducts: (newProducts) => {
        const existing = get().products;
        // Merge by SKU: update existing, add new
        const skuMap = new Map(existing.map((p) => [p.sku, p]));
        for (const p of newProducts) {
          if (skuMap.has(p.sku)) {
            const old = skuMap.get(p.sku)!;
            skuMap.set(p.sku, { ...old, ...p, images: old.images.length ? old.images : p.images });
          } else {
            skuMap.set(p.sku, p);
          }
        }
        set({ products: Array.from(skuMap.values()) });
      },
      removeProduct: (id) =>
        set({ products: get().products.filter((p) => p.id !== id) }),
      updateProduct: (id, data) =>
        set({
          products: get().products.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        }),
      updateStock: (id, delta) =>
        set({
          products: get().products.map((p) =>
            p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p
          ),
        }),
      toggleNew: (id) =>
        set({
          products: get().products.map((p) =>
            p.id === id ? { ...p, isNew: !p.isNew } : p
          ),
        }),
      toggleHit: (id) =>
        set({
          products: get().products.map((p) =>
            p.id === id ? { ...p, isHit: !p.isHit } : p
          ),
        }),
      toggleMain: (id) =>
        set({
          products: get().products.map((p) =>
            p.id === id ? { ...p, showOnMain: !p.showOnMain } : p
          ),
        }),
    }),
    { name: "rexor-products" }
  )
);
