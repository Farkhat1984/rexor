"use client";

import { create } from "zustand";

export interface Settings {
  telegramUsername: string;
  whatsappPhone: string;
}

interface SettingsStore extends Settings {
  loaded: boolean;
  loading: boolean;
  fetchSettings: () => Promise<void>;
  update: (data: Partial<Settings>) => void;
}

let settingsTimer: ReturnType<typeof setTimeout>;

export const useSettingsStore = create<SettingsStore>()((set, get) => ({
  telegramUsername: "rexor_watches",
  whatsappPhone: "77001234567",
  loaded: false,
  loading: false,

  fetchSettings: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      set({ ...data, loaded: true, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  update: (data) => {
    set(data);
    clearTimeout(settingsTimer);
    settingsTimer = setTimeout(() => {
      fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }, 500);
  },
}));
