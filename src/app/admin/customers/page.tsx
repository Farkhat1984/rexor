"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { formatPrice } from "@/lib/data";
import { IconSearch } from "@/components/Icons";

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

const PER_PAGE = 20;

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PER_PAGE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((data) => setUsers(data.users || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore) setVisibleCount((c) => c + PER_PAGE); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore]);

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

      {users.length > 0 && (
        <div className="relative mb-4">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setVisibleCount(PER_PAGE); }}
            placeholder="Поиск по имени или email..."
            className="w-full h-10 pl-9 pr-4 bg-brand-50 border border-brand-100 text-sm outline-none focus:border-brand-300"
          />
        </div>
      )}

      {filtered.length > 0 && filtered.length !== users.length && (
        <p className="text-[11px] text-brand-400 mb-2">Найдено: {filtered.length}</p>
      )}

      {filtered.length === 0 && users.length > 0 ? (
        <p className="text-sm text-brand-400 text-center py-16">Ничего не найдено.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-brand-400 text-center py-16">Пока нет зарегистрированных пользователей.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((user) => (
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

      {hasMore && <div ref={sentinelRef} className="py-5" />}
    </div>
  );
}
