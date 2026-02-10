"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { IconChevronLeft } from "@/components/Icons";
import { Order } from "@/lib/types";
import { formatPrice } from "@/lib/data";

const STATUS_LABELS: Record<string, string> = {
  new: "В обработке",
  confirmed: "Подтверждён",
  rejected: "Отменён",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (session?.user?.userId) {
      setLoadingOrders(true);
      fetch("/api/user/orders")
        .then((r) => r.json())
        .then((data) => setOrders(data.orders || []))
        .finally(() => setLoadingOrders(false));
    }
  }, [session?.user?.userId]);

  if (status === "loading") {
    return (
      <div className="max-w-lg mx-auto min-h-screen flex items-center justify-center">
        <p className="text-sm text-brand-400">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-brand-100">
        <div className="flex items-center justify-between px-2 h-14">
          <Link href="/" className="w-10 h-10 flex items-center justify-center text-brand-900">
            <IconChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-heading text-base text-brand-900">Профиль</h1>
          <div className="w-10" />
        </div>
      </header>

      {!session ? (
        <div className="text-center py-20 px-4">
          <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center text-brand-200">
            <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <p className="text-brand-500 text-sm mb-4">Войдите, чтобы видеть историю заказов</p>
          <button
            onClick={() => signIn("google")}
            className="inline-flex items-center gap-2 bg-brand-900 text-white text-xs tracking-[0.15em] uppercase px-6 py-3"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Войти через Google
          </button>
        </div>
      ) : (
        <div className="px-4 py-6">
          {/* User info */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-brand-100">
            {session.user.image ? (
              <img src={session.user.image} alt="" className="w-14 h-14 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-400 text-xl font-heading">
                {(session.user.name || "?")[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-brand-900 truncate">{session.user.name}</p>
              <p className="text-xs text-brand-500 truncate">{session.user.email}</p>
            </div>
          </div>

          {/* Orders */}
          <h2 className="font-heading text-base text-brand-900 mb-4">Мои заказы</h2>

          {loadingOrders ? (
            <p className="text-sm text-brand-400 text-center py-8">Загрузка заказов...</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-brand-400 mb-3">У вас пока нет заказов</p>
              <Link href="/catalog" className="text-xs text-brand-900 underline">
                Перейти в каталог
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="bg-brand-50 border border-brand-100 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-brand-900">#{order.id.slice(-6)}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 ${STATUS_COLORS[order.status] || ""}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                      <span className="text-[10px] text-brand-400">
                        {new Date(order.createdAt).toLocaleDateString("ru", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 mb-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-brand-700 truncate mr-2">
                          {item.brand} {item.name || item.sku} <span className="text-brand-400">&times;{item.quantity}</span>
                        </span>
                        <span className="text-brand-900 font-medium shrink-0">
                          {formatPrice(item.finalPrice * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between border-t border-brand-200 pt-2">
                    <span className="text-sm font-medium text-brand-900">Итого</span>
                    <span className="text-sm font-bold text-brand-900">{formatPrice(order.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sign out */}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full mt-8 py-3 text-xs text-brand-500 border border-brand-200 transition-colors hover:bg-brand-50"
          >
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
