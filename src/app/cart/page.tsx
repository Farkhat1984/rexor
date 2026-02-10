"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { formatPrice, getDiscountedPrice } from "@/lib/data";
import { IconChevronLeft, IconTrash, IconMinus, IconPlus, IconTelegram, IconWhatsApp } from "@/components/Icons";
import { WatchImage } from "@/components/WatchImage";
import { useSettingsStore } from "@/store/settings";
import { useOrdersStore } from "@/store/orders";
import { ContactType, OrderItem } from "@/lib/types";

export default function CartPage() {
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  useEffect(() => { fetchSettings(); }, [fetchSettings]);
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const addItem = useCartStore((s) => s.addItem);
  const decrementItem = useCartStore((s) => s.decrementItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const telegramUsername = useSettingsStore((s) => s.telegramUsername);
  const whatsappPhone = useSettingsStore((s) => s.whatsappPhone);
  const addOrder = useOrdersStore((s) => s.addOrder);
  const total = items.reduce((sum, i) => sum + getDiscountedPrice(i.product.retailPrice, i.product.discount) * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  const [contactType, setContactType] = useState<ContactType>("telegram");
  const [contactValue, setContactValue] = useState("");
  const [contactError, setContactError] = useState("");

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

  async function handleSubmitOrder(via: ContactType) {
    if (!contactValue.trim()) {
      setContactError("Укажите контакт для связи");
      return;
    }
    setContactError("");

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

    // Save order (API handles stock decrement atomically)
    await addOrder(orderItems, total, contactType, contactValue);

    // Open messenger
    const text = encodeURIComponent(buildOrderMessage());
    if (via === "telegram") {
      window.open(`https://t.me/${telegramUsername}?text=${text}`, "_blank");
    } else {
      window.open(`https://wa.me/${whatsappPhone}?text=${text}`, "_blank");
    }

    clearCart();
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

          {/* Contact form */}
          <div className="mt-4 bg-brand-50 border border-brand-100 p-3">
            <p className="text-xs font-medium text-brand-900 mb-2">Ваш контакт для связи</p>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setContactType("telegram")}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 border transition-colors ${
                  contactType === "telegram"
                    ? "bg-brand-900 text-white border-brand-900"
                    : "text-brand-500 border-brand-200"
                }`}
              >
                <IconTelegram className="w-4 h-4" />
                Telegram
              </button>
              <button
                onClick={() => setContactType("whatsapp")}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 border transition-colors ${
                  contactType === "whatsapp"
                    ? "bg-brand-900 text-white border-brand-900"
                    : "text-brand-500 border-brand-200"
                }`}
              >
                <IconWhatsApp className="w-4 h-4" />
                WhatsApp
              </button>
            </div>
            <input
              value={contactValue}
              onChange={(e) => { setContactValue(e.target.value); setContactError(""); }}
              placeholder={
                contactType === "telegram"
                  ? "Ваш Telegram (@username или номер)"
                  : "Ваш WhatsApp номер (77001234567)"
              }
              className="w-full h-9 px-3 bg-white border border-brand-200 text-sm outline-none focus:border-brand-400"
            />
            {contactError && (
              <p className="text-[10px] text-red-600 mt-1">{contactError}</p>
            )}
          </div>

          <div className="mt-4 space-y-2.5">
            <button
              onClick={() => handleSubmitOrder("telegram")}
              className="w-full h-12 flex items-center justify-center gap-2 bg-brand-900 text-white text-sm tracking-wide transition-colors active:bg-brand-800"
            >
              <IconTelegram className="w-5 h-5" />
              Отправить заявку в Telegram
            </button>
            <button
              onClick={() => handleSubmitOrder("whatsapp")}
              className="w-full h-12 flex items-center justify-center gap-2 bg-[#25D366] text-white text-sm tracking-wide transition-colors active:opacity-90"
            >
              <IconWhatsApp className="w-5 h-5" />
              Отправить заявку в WhatsApp
            </button>
          </div>

          <p className="text-center text-[11px] text-brand-400 mt-4 leading-relaxed">
            Укажите контакт и нажмите кнопку. Заказ будет сохранён и отправлен менеджеру.
          </p>
        </div>
      )}
    </div>
  );
}
