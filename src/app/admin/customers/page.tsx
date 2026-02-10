"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/data";

interface UserRow {
  id: string;
  email: string;
  name: string;
  image: string;
  isAdmin: boolean;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
}

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((data) => setUsers(data.users || []))
      .finally(() => setLoading(false));
  }, []);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("ru", { day: "2-digit", month: "2-digit", year: "2-digit" });
  }

  if (loading) {
    return <p className="text-sm text-brand-400 text-center py-16">Загрузка...</p>;
  }

  return (
    <div>
      <h2 className="font-heading text-lg text-brand-900 mb-4">
        Клиенты ({users.length})
      </h2>

      {users.length === 0 ? (
        <p className="text-sm text-brand-400 text-center py-16">Пока нет зарегистрированных пользователей.</p>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="bg-brand-50 border border-brand-100 p-3">
              <div className="flex items-center gap-3">
                {user.image ? (
                  <img src={user.image} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center text-brand-500 text-sm font-heading">
                    {(user.name || "?")[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-brand-900 truncate">{user.name}</p>
                    {user.isAdmin && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-brand-900 text-white">admin</span>
                    )}
                  </div>
                  <p className="text-[11px] text-brand-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex gap-4 mt-2 pt-2 border-t border-brand-200 text-[11px] text-brand-500">
                <span>Заказов: <b className="text-brand-900">{user.ordersCount}</b></span>
                <span>Потрачено: <b className="text-brand-900">{formatPrice(user.totalSpent)}</b></span>
                <span>Регистрация: {formatDate(user.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
