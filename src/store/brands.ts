"use client";

import { create } from "zustand";

export interface BrandItem {
  id: string;
  name: string;
  slug: string;
  image: string;
}

interface BrandsStore {
  brands: BrandItem[];
  loaded: boolean;
  loading: boolean;
  fetchBrands: (force?: boolean) => Promise<void>;
  addBrand: (brand: BrandItem) => Promise<void>;
  removeBrand: (id: string) => Promise<void>;
  updateBrand: (id: string, data: Partial<BrandItem>) => void;
}

let brandTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export const useBrandsStore = create<BrandsStore>()((set, get) => ({
  brands: [],
  loaded: false,
  loading: false,

  fetchBrands: async (force?: boolean) => {
    if (!force && (get().loaded || get().loading)) return;
    set({ loading: true });
    try {
      const res = await fetch("/api/brands");
      const brands = await res.json();
      set({ brands, loaded: true, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addBrand: async (brand) => {
    set({ brands: [...get().brands, brand] });
    await fetch("/api/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(brand),
    });
  },

  removeBrand: async (id) => {
    set({ brands: get().brands.filter((b) => b.id !== id) });
    await fetch(`/api/brands/${id}`, { method: "DELETE" });
  },

  updateBrand: (id, data) => {
    set({
      brands: get().brands.map((b) => (b.id === id ? { ...b, ...data } : b)),
    });
    clearTimeout(brandTimers[id]);
    brandTimers[id] = setTimeout(() => {
      fetch(`/api/brands/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }, 500);
  },
}));
