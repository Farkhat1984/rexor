"use client";

import { create } from "zustand";

export interface Banner {
  id: string;
  image: string;
  link: string;
  active: boolean;
}

interface BannersStore {
  banners: Banner[];
  loaded: boolean;
  loading: boolean;
  fetchBanners: () => Promise<void>;
  addBanner: (image: string, link: string) => Promise<void>;
  removeBanner: (id: string) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
  updateBanner: (id: string, data: Partial<Banner>) => Promise<void>;
}

export const useBannersStore = create<BannersStore>()((set, get) => ({
  banners: [],
  loaded: false,
  loading: false,

  fetchBanners: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const res = await fetch("/api/banners");
      const banners = await res.json();
      set({ banners, loaded: true, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addBanner: async (image, link) => {
    const temp: Banner = { id: String(Date.now()), image, link, active: true };
    set({ banners: [...get().banners, temp] });

    const res = await fetch("/api/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, link }),
    });
    const banners = await res.json();
    set({ banners });
  },

  removeBanner: async (id) => {
    set({ banners: get().banners.filter((b) => b.id !== id) });
    await fetch(`/api/banners/${id}`, { method: "DELETE" });
  },

  toggleActive: async (id) => {
    const b = get().banners.find((x) => x.id === id);
    if (!b) return;
    const val = !b.active;
    set({ banners: get().banners.map((x) => (x.id === id ? { ...x, active: val } : x)) });
    await fetch(`/api/banners/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: val }),
    });
  },

  updateBanner: async (id, data) => {
    set({ banners: get().banners.map((b) => (b.id === id ? { ...b, ...data } : b)) });
    await fetch(`/api/banners/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
}));
