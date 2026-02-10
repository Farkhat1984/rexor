"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Settings {
  telegramUsername: string; // без @, например rexor_watches
  whatsappPhone: string;   // международный формат, например 77001234567
}

interface SettingsStore extends Settings {
  update: (data: Partial<Settings>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      telegramUsername: "rexor_watches",
      whatsappPhone: "77001234567",
      update: (data) => set(data),
    }),
    { name: "rexor-settings" }
  )
);
