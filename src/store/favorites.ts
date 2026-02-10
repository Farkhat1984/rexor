"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesStore {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const has = get().ids.includes(id);
        set({ ids: has ? get().ids.filter((i) => i !== id) : [...get().ids, id] });
      },
      has: (id) => get().ids.includes(id),
    }),
    { name: "rexor-favorites" }
  )
);
