"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { formatPrice, getDiscountedPrice } from "@/lib/data";
import { IconChevronLeft, IconTrash, IconMinus, IconPlus, IconTelegram, IconWhatsApp } from "@/components/Icons";
import { WatchImage } from "@/components/WatchImage";
import { useSettingsStore } from "@/store/settings";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const addItem = useCartStore((s) => s.addItem);
  const decrementItem = useCartStore((s) => s.decrementItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const telegramUsername = useSettingsStore((s) => s.telegramUsername);
  const whatsappPhone = useSettingsStore((s) => s.whatsappPhone);
  const total = items.reduce((sum, i) => sum + getDiscountedPrice(i.product.retailPrice, i.product.discount) * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  function buildOrderMessage() {
    let msg = "Здравствуйте! Хочу заказать:\n\n";
    items.forEach((item) => {
      msg += `• ${item.product.brand} ${item.product.name || item.product.sku}\n`;
      msg += `  Арт: ${item.product.sku}\n`;
      const itemPrice = getDiscountedPrice(item.product.retailPrice, item.product.discount);
      msg += `  Цена: ${formatPrice(itemPrice)}`;
      if (item.quantity > 1) msg += ` × ${item.quantity}`;
      msg += "\n\n";
    });
    msg += `Итого: ${formatPrice(total)}`;
    return msg;
  }

  function handleTelegram() {
    const text = encodeURIComponent(buildOrderMessage());
    window.open(`https://t.me/${telegramUsername}?text=${text}`, "_blank");
  }

  function handleWhatsApp() {
    const text = encodeURIComponent(buildOrderMessage());
    window.open(`https://wa.me/${whatsappPhone}?text=${text}`, "_blank");
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

          <div className="mt-6 space-y-2.5">
            <button onClick={handleTelegram} className="w-full h-12 flex items-center justify-center gap-2 bg-brand-900 text-white text-sm tracking-wide transition-colors active:bg-brand-800">
              <IconTelegram className="w-5 h-5" />
              Отправить заявку в Telegram
            </button>
            <button onClick={handleWhatsApp} className="w-full h-12 flex items-center justify-center gap-2 bg-[#25D366] text-white text-sm tracking-wide transition-colors active:opacity-90">
              <IconWhatsApp className="w-5 h-5" />
              Отправить заявку в WhatsApp
            </button>
          </div>

          <p className="text-center text-[11px] text-brand-400 mt-4 leading-relaxed">
            Нажимая кнопку, вы отправите список товаров менеджеру. Оплата и доставка обсуждаются в чате.
          </p>
        </div>
      )}
    </div>
  );
}
