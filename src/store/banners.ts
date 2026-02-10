"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Banner {
  id: string;
  image: string; // base64 PNG
  link: string;
  active: boolean;
}

interface BannersStore {
  banners: Banner[];
  addBanner: (image: string, link: string) => void;
  removeBanner: (id: string) => void;
  toggleActive: (id: string) => void;
  updateBanner: (id: string, data: Partial<Banner>) => void;
}

export const useBannersStore = create<BannersStore>()(
  persist(
    (set, get) => ({
      banners: [],
      addBanner: (image, link) => {
        set({
          banners: [
            ...get().banners,
            {
              id: String(Date.now()),
              image,
              link,
              active: true,
            },
          ],
        });
      },
      removeBanner: (id) => {
        set({ banners: get().banners.filter((b) => b.id !== id) });
      },
      toggleActive: (id) => {
        set({
          banners: get().banners.map((b) =>
            b.id === id ? { ...b, active: !b.active } : b
          ),
        });
      },
      updateBanner: (id, data) => {
        set({
          banners: get().banners.map((b) =>
            b.id === id ? { ...b, ...data } : b
          ),
        });
      },
    }),
    { name: "rexor-banners" }
  )
);
