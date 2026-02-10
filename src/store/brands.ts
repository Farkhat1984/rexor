"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { brands as defaultBrands } from "@/lib/data";

export interface BrandItem {
  id: string;
  name: string;
  slug: string;
  image: string;
}

const initial: BrandItem[] = defaultBrands.map((b) => ({
  id: b.id,
  name: b.name,
  slug: b.slug,
  image: "",
}));

interface BrandsStore {
  brands: BrandItem[];
  addBrand: (name: string) => void;
  removeBrand: (id: string) => void;
  updateBrand: (id: string, data: Partial<BrandItem>) => void;
}

export const useBrandsStore = create<BrandsStore>()(
  persist(
    (set, get) => ({
      brands: initial,
      addBrand: (name) => {
        const slug = name.toLowerCase().replace(/\s+/g, "-");
        set({
          brands: [
            ...get().brands,
            { id: String(Date.now()), name, slug, image: "" },
          ],
        });
      },
      removeBrand: (id) => {
        set({ brands: get().brands.filter((b) => b.id !== id) });
      },
      updateBrand: (id, data) => {
        set({
          brands: get().brands.map((b) =>
            b.id === id ? { ...b, ...data } : b
          ),
        });
      },
    }),
    { name: "rexor-brands" }
  )
);
