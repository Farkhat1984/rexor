"use client";

import { useSettingsStore } from "@/store/settings";
import { IconTelegram, IconWhatsApp } from "@/components/Icons";

export default function AdminSettingsPage() {
  const { telegramUsername, whatsappPhone, update } = useSettingsStore();

  return (
    <div>
      <h2 className="font-heading text-lg text-brand-900 mb-4">Настройки</h2>

      <div className="space-y-4">
        {/* Telegram */}
        <div className="bg-brand-50 border border-brand-100 p-3">
          <div className="flex items-center gap-2 mb-2">
            <IconTelegram className="w-5 h-5 text-[#2AABEE]" />
            <span className="text-sm font-medium text-brand-900">Telegram</span>
          </div>
          <label className="text-[10px] text-brand-400">Юзернейм (без @)</label>
          <input
            value={telegramUsername}
            onChange={(e) => update({ telegramUsername: e.target.value.replace("@", "") })}
            placeholder="rexor_watches"
            className="w-full text-sm text-brand-900 bg-white border border-brand-200 px-2 py-1.5 outline-none focus:border-brand-400"
          />
          <p className="text-[10px] text-brand-400 mt-1">
            Клиенты будут отправлять заказы сюда: t.me/{telegramUsername || "..."}
          </p>
        </div>

        {/* WhatsApp */}
        <div className="bg-brand-50 border border-brand-100 p-3">
          <div className="flex items-center gap-2 mb-2">
            <IconWhatsApp className="w-5 h-5 text-[#25D366]" />
            <span className="text-sm font-medium text-brand-900">WhatsApp</span>
          </div>
          <label className="text-[10px] text-brand-400">Номер телефона (международный формат)</label>
          <input
            value={whatsappPhone}
            onChange={(e) => update({ whatsappPhone: e.target.value.replace(/[^0-9+]/g, "") })}
            placeholder="77001234567"
            className="w-full text-sm text-brand-900 bg-white border border-brand-200 px-2 py-1.5 outline-none focus:border-brand-400"
          />
          <p className="text-[10px] text-brand-400 mt-1">
            Без пробелов и дефисов. Пример: 77001234567
          </p>
        </div>
      </div>

      <p className="text-[11px] text-brand-400 mt-4 leading-relaxed">
        Эти контакты используются в корзине и на странице товара для отправки заказов.
      </p>
    </div>
  );
}
