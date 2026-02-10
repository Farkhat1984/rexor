"use client";

import { create } from "zustand";
import { Product } from "@/lib/types";

let debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

interface ProductsStore {
  products: Product[];
  loaded: boolean;
  loading: boolean;
  fetchProducts: () => Promise<void>;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => Promise<void>;
  addProducts: (products: Product[]) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => void;
  updateStock: (id: string, delta: number) => Promise<void>;
  toggleNew: (id: string) => Promise<void>;
  toggleHit: (id: string) => Promise<void>;
  toggleMain: (id: string) => Promise<void>;
}

export const useProductsStore = create<ProductsStore>()((set, get) => ({
  products: [],
  loaded: false,
  loading: false,

  fetchProducts: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const res = await fetch("/api/products");
      const products = await res.json();
      set({ products, loaded: true, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  setProducts: (products) => set({ products }),

  addProduct: async (product) => {
    set({ products: [product, ...get().products] });
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    const products = await res.json();
    set({ products });
  },

  addProducts: async (newProducts) => {
    // Optimistic local merge
    const existing = get().products;
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

    // Persist to server
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProducts),
    });
    const products = await res.json();
    set({ products });
  },

  removeProduct: async (id) => {
    set({ products: get().products.filter((p) => p.id !== id) });
    await fetch(`/api/products/${id}`, { method: "DELETE" });
  },

  updateProduct: (id, data) => {
    // Immediate local update
    set({
      products: get().products.map((p) => (p.id === id ? { ...p, ...data } : p)),
    });
    // Debounced API call
    clearTimeout(debounceTimers[id]);
    debounceTimers[id] = setTimeout(() => {
      fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }, 500);
  },

  updateStock: async (id, delta) => {
    const product = get().products.find((p) => p.id === id);
    if (!product) return;
    const newStock = Math.max(0, product.stock + delta);
    set({
      products: get().products.map((p) => (p.id === id ? { ...p, stock: newStock } : p)),
    });
    await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: newStock }),
    });
  },

  toggleNew: async (id) => {
    const p = get().products.find((x) => x.id === id);
    if (!p) return;
    const val = !p.isNew;
    set({ products: get().products.map((x) => (x.id === id ? { ...x, isNew: val } : x)) });
    await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isNew: val }),
    });
  },

  toggleHit: async (id) => {
    const p = get().products.find((x) => x.id === id);
    if (!p) return;
    const val = !p.isHit;
    set({ products: get().products.map((x) => (x.id === id ? { ...x, isHit: val } : x)) });
    await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isHit: val }),
    });
  },

  toggleMain: async (id) => {
    const p = get().products.find((x) => x.id === id);
    if (!p) return;
    const val = !p.showOnMain;
    set({ products: get().products.map((x) => (x.id === id ? { ...x, showOnMain: val } : x)) });
    await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showOnMain: val }),
    });
  },
}));
