"use client";

import { useEffect, useState, useCallback } from "react";
import { useSettingsStore } from "@/store/settings";
import { IconTelegram, IconWhatsApp } from "@/components/Icons";

export default function AdminSettingsPage() {
  const { telegramUsername, whatsappPhone, update, fetchSettings } = useSettingsStore();
  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // Admin emails management
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [adminLoading, setAdminLoading] = useState(true);

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/admins");
      const data = await res.json();
      setAdminEmails(data.emails || []);
    } catch {} finally {
      setAdminLoading(false);
    }
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  async function addAdmin() {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) return;
    if (adminEmails.includes(email)) { setNewEmail(""); return; }
    const updated = [...adminEmails, email];
    setAdminEmails(updated);
    setNewEmail("");
    await fetch("/api/admin/admins", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails: updated }),
    });
  }

  async function removeAdmin(email: string) {
    const updated = adminEmails.filter((e) => e !== email);
    setAdminEmails(updated);
    await fetch("/api/admin/admins", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails: updated }),
    });
  }

  // Red Zone: delete all products
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<string | null>(null);

  async function handleDeleteAll() {
    setDeleting(true);
    try {
      const res = await fetch("/api/products", { method: "DELETE" });
      const data = await res.json();
      setDeleteResult(`Удалено ${data.deleted} товаров`);
    } catch {
      setDeleteResult("Ошибка при удалении");
    } finally {
      setDeleting(false);
      setDeleteAllConfirm(false);
      setDeleteConfirmText("");
    }
  }

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

        <p className="text-[11px] text-brand-400 leading-relaxed">
          Эти контакты используются в корзине и на странице товара для отправки заказов.
        </p>

        {/* Admin Management */}
        <div className="bg-brand-50 border border-brand-100 p-3">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-brand-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <span className="text-sm font-medium text-brand-900">Управление админами</span>
          </div>

          <p className="text-[10px] text-brand-400 mb-3">
            Добавьте email (Google аккаунт) для предоставления прав администратора. Изменения вступят в силу при следующем входе пользователя.
          </p>

          <div className="flex gap-2 mb-3">
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addAdmin(); }}
              placeholder="email@gmail.com"
              type="email"
              className="flex-1 text-sm text-brand-900 bg-white border border-brand-200 px-2 py-1.5 outline-none focus:border-brand-400"
            />
            <button
              onClick={addAdmin}
              disabled={!newEmail.trim() || !newEmail.includes("@")}
              className="px-3 py-1.5 bg-brand-900 text-white text-xs disabled:opacity-30"
            >
              Добавить
            </button>
          </div>

          {adminLoading ? (
            <p className="text-[10px] text-brand-400">Загрузка...</p>
          ) : adminEmails.length === 0 ? (
            <p className="text-[10px] text-brand-400">Нет добавленных админов (кроме основного из конфигурации).</p>
          ) : (
            <div className="space-y-1.5">
              {adminEmails.map((email) => (
                <div key={email} className="flex items-center justify-between bg-white border border-brand-200 px-2 py-1.5">
                  <span className="text-xs text-brand-700 truncate">{email}</span>
                  <button
                    onClick={() => removeAdmin(email)}
                    className="text-red-500 text-[10px] shrink-0 ml-2 hover:text-red-700"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-[10px] text-brand-400 mt-2">
            Основной админ задан в конфигурации сервера и не может быть удалён отсюда.
          </p>
        </div>

        {/* RED ZONE */}
        <div className="mt-8 pt-6 border-t-2 border-red-200">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <span className="text-sm font-heading font-bold text-red-700 uppercase tracking-wide">Красная зона</span>
          </div>

          <div className="bg-red-50 border border-red-200 p-3">
            <p className="text-xs text-red-800 font-medium mb-1">Удалить все товары</p>
            <p className="text-[10px] text-red-600 mb-3">
              Полностью очищает каталог. Все товары, изображения и остатки будут безвозвратно удалены.
            </p>
            {deleteResult && (
              <p className="text-xs text-red-700 font-medium mb-2 bg-red-100 px-2 py-1">{deleteResult}</p>
            )}
            <button
              onClick={() => { setDeleteAllConfirm(true); setDeleteResult(null); }}
              className="px-4 py-2 bg-red-700 text-white text-xs tracking-wide"
            >
              Удалить все товары
            </button>
          </div>
        </div>
      </div>

      {/* Delete All Products Confirmation Modal */}
      {deleteAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-brand-950/60 backdrop-blur-sm" onClick={() => { setDeleteAllConfirm(false); setDeleteConfirmText(""); }} />
          <div className="relative bg-white border border-red-300 shadow-lg w-full max-w-xs">
            <div className="bg-red-700 px-4 py-3">
              <p className="text-white text-xs font-heading tracking-wide uppercase">Удаление всех товаров</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-red-50 border border-red-200 px-3 py-2">
                <svg className="w-8 h-8 text-red-600 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                <p className="text-xs text-red-800 text-center font-medium">
                  Это действие необратимо!
                </p>
              </div>
              <p className="text-xs text-brand-600 leading-relaxed">
                Все товары будут безвозвратно удалены из базы данных, включая изображения, остатки и цены. Восстановить данные будет невозможно.
              </p>
              <div>
                <label className="text-[10px] text-brand-500 block mb-1">
                  Введите <span className="font-bold text-red-600">УДАЛИТЬ</span> для подтверждения:
                </label>
                <input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="УДАЛИТЬ"
                  className="w-full text-sm text-brand-900 bg-white border border-red-300 px-2 py-1.5 outline-none focus:border-red-500"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setDeleteAllConfirm(false); setDeleteConfirmText(""); }}
                  className="flex-1 h-9 border border-brand-200 text-brand-700 text-xs tracking-wide"
                >
                  Отмена
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={deleteConfirmText !== "УДАЛИТЬ" || deleting}
                  className="flex-1 h-9 bg-red-700 text-white text-xs tracking-wide disabled:opacity-30"
                >
                  {deleting ? "Удаление..." : "Подтвердить"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
