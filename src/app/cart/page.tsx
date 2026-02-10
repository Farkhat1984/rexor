"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { useCartStore } from "@/store/cart";
import { formatPrice, getDiscountedPrice } from "@/lib/data";
import { IconChevronLeft, IconTrash, IconMinus, IconPlus } from "@/components/Icons";
import { WatchImage } from "@/components/WatchImage";
import { useOrdersStore } from "@/store/orders";
import { OrderItem } from "@/lib/types";

export default function CartPage() {
  const { data: session, status: authStatus } = useSession();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const addItem = useCartStore((s) => s.addItem);
  const decrementItem = useCartStore((s) => s.decrementItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const addOrder = useOrdersStore((s) => s.addOrder);
  const total = items.reduce((sum, i) => sum + getDiscountedPrice(i.product.retailPrice, i.product.discount) * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmitOrder() {
    if (!session?.user?.userId) return;
    setSubmitting(true);

    const orderItems: OrderItem[] = items.map((i) => ({
      productId: i.product.id,
      sku: i.product.sku,
      brand: i.product.brand,
      name: i.product.name,
      retailPrice: i.product.retailPrice,
      discount: i.product.discount,
      finalPrice: getDiscountedPrice(i.product.retailPrice, i.product.discount),
      quantity: i.quantity,
    }));

    await addOrder(orderItems, total, session.user.userId);
    clearCart();
    setSubmitting(false);
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-brand-100">
          <div className="flex items-center justify-between px-2 h-14">
            <Link href="/" className="w-10 h-10 flex items-center justify-center text-brand-900">
              <IconChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-heading text-base text-brand-900">Корзина</h1>
            <div className="w-10" />
          </div>
        </header>
        <div className="text-center py-20 px-4">
          <div className="text-4xl mb-4">&#10003;</div>
          <p className="text-brand-900 font-medium mb-2">Заказ оформлен!</p>
          <p className="text-sm text-brand-500 mb-6">Вы можете отслеживать статус в профиле</p>
          <div className="flex flex-col gap-2 items-center">
            <Link href="/profile" className="inline-block bg-brand-900 text-white text-xs tracking-[0.15em] uppercase px-6 py-3">
              Мои заказы
            </Link>
            <Link href="/catalog" className="text-xs text-brand-500 underline">
              Продолжить покупки
            </Link>
          </div>
        </div>
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
          <h1 className="font-heading text-base text-brand-900">Корзина</h1>
          <div className="w-10" />
        </div>
      </header>

      {items.length === 0 ? (
        <div className="text-center py-20 px-4">
          <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center text-brand-200">
            <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <p className="text-brand-500 text-sm mb-4">Корзина пуста</p>
          <Link href="/catalog" className="inline-block bg-brand-900 text-white text-xs tracking-[0.15em] uppercase px-6 py-3">
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="px-4 py-4">
          <div className="space-y-3">
            {items.map((item) => {
              const atMax = item.quantity >= item.product.stock;
              return (
                <div key={item.product.id} className="flex gap-3 p-3 bg-brand-50 border border-brand-100">
                  <Link href={`/product/${item.product.id}`} className="w-20 h-20 bg-white shrink-0 flex items-center justify-center">
                    <WatchImage src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-contain p-1" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-brand-500 uppercase">{item.product.brand}</p>
                    <p className="text-sm font-medium text-brand-900 line-clamp-1">{item.product.name || item.product.sku}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm font-bold text-brand-900">{formatPrice(getDiscountedPrice(item.product.retailPrice, item.product.discount))}</p>
                      {item.product.discount && item.product.discount > 0 ? (
                        <p className="text-xs text-brand-400 line-through">{formatPrice(item.product.retailPrice)}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => decrementItem(item.product.id)}
                          className="w-7 h-7 flex items-center justify-center border border-brand-200 text-brand-600"
                        >
                          <IconMinus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-medium text-brand-900 w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() => addItem(item.product)}
                          disabled={atMax}
                          className="w-7 h-7 flex items-center justify-center border border-brand-200 text-brand-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <IconPlus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        {atMax && <span className="text-[10px] text-brand-400">макс.</span>}
                        <button onClick={() => removeItem(item.product.id)} className="w-7 h-7 flex items-center justify-center text-brand-400">
                          <IconTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-brand-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-brand-500">Товаров: {count}</span>
              <button onClick={clearCart} className="text-xs text-brand-400 underline">Очистить</button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-brand-900">Итого:</span>
              <span className="text-xl font-bold text-brand-900">{formatPrice(total)}</span>
            </div>
          </div>

          {/* Auth-gated checkout */}
          <div className="mt-4">
            {authStatus === "loading" ? (
              <div className="text-center py-4">
                <p className="text-sm text-brand-400">Загрузка...</p>
              </div>
            ) : !session ? (
              <button
                onClick={() => signIn("google", { callbackUrl: "/cart" })}
                className="w-full h-12 flex items-center justify-center gap-2 bg-brand-900 text-white text-sm tracking-wide transition-colors active:bg-brand-800"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Войти для оформления заказа
              </button>
            ) : (
              <div>
                <div className="flex items-center gap-3 p-3 bg-brand-50 border border-brand-100 mb-3">
                  {session.user.image ? (
                    <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-200 flex items-center justify-center text-brand-500 text-xs font-heading">
                      {(session.user.name || "?")[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-900 truncate">{session.user.name}</p>
                    <p className="text-[11px] text-brand-500 truncate">{session.user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                  className="w-full h-12 flex items-center justify-center gap-2 bg-brand-900 text-white text-sm tracking-wide transition-colors active:bg-brand-800 disabled:opacity-50"
                >
                  {submitting ? "Оформление..." : "Оформить заказ"}
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-[11px] text-brand-400 mt-4 leading-relaxed">
            Заказ будет сохранён и виден в вашем профиле.
          </p>
        </div>
      )}
    </div>
  );
}
