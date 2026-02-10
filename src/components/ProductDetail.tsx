"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatPrice, getDiscountedPrice } from "@/lib/data";
import { useCartStore } from "@/store/cart";
import { useFavoritesStore } from "@/store/favorites";
import { useProductsStore } from "@/store/products";
import {
  IconChevronLeft,
  IconHeart,
  IconShare,
  IconTelegram,
  IconWhatsApp,
  IconCart,
} from "@/components/Icons";
import { WatchImage } from "@/components/WatchImage";
import { useSettingsStore } from "@/store/settings";

export function ProductDetail() {
  const params = useParams();
  const id = params.id as string;
  const fetchProducts = useProductsStore((s) => s.fetchProducts);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  useEffect(() => { fetchProducts(); fetchSettings(); }, [fetchProducts, fetchSettings]);
  const product = useProductsStore((s) => s.products.find((p) => p.id === id));

  const addItem = useCartStore((s) => s.addItem);
  const cartQty = useCartStore((s) => s.getQuantity(id));
  const toggleFavorite = useFavoritesStore((s) => s.toggle);
  const isFavorite = useFavoritesStore((s) => s.has(id));

  const telegramUsername = useSettingsStore((s) => s.telegramUsername);
  const whatsappPhone = useSettingsStore((s) => s.whatsappPhone);
  const [selectedImage, setSelectedImage] = useState(0);
  const [shared, setShared] = useState(false);

  if (!product) {
    return (
      <div className="max-w-lg mx-auto min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-brand-500 text-lg mb-4">Товар не найден</p>
        <Link href="/catalog" className="text-sm text-brand-900 underline underline-offset-4">
          Вернуться в каталог
        </Link>
      </div>
    );
  }

  const outOfStock = product.stock <= 0;
  const cartFull = cartQty >= product.stock;
  const hasDiscount = product.discount && product.discount > 0;
  const finalPrice = getDiscountedPrice(product.retailPrice, product.discount);

  const messageText = `Здравствуйте! Хочу заказать: ${product.brand} ${product.name}\nАртикул: ${product.sku}\nЦена: ${formatPrice(finalPrice)}${hasDiscount ? ` (скидка ${product.discount}%)` : ""}\nСсылка: ${typeof window !== "undefined" ? window.location.href : ""}`;
  const encodedMessage = encodeURIComponent(messageText);
  const telegramLink = `https://t.me/${telegramUsername}?text=${encodedMessage}`;
  const whatsappLink = `https://wa.me/${whatsappPhone}?text=${encodedMessage}`;

  const handleShare = async () => {
    const shareData = {
      title: `${product.brand} ${product.name}`,
      text: `${product.brand} ${product.name} — ${formatPrice(product.retailPrice)}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const specs = [
    { label: "Механизм", value: product.mechanism },
    { label: "Стекло", value: product.glass },
    { label: "Форма корпуса", value: product.caseShape },
    { label: "Размер корпуса", value: product.caseSize },
    { label: "Материал корпуса", value: product.caseMaterial },
    { label: "Браслет/ремешок", value: product.strapMaterial },
    { label: "Цвет ремешка", value: product.strapColor },
    { label: "Цвет циферблата", value: product.dialColor },
    { label: "Водозащита", value: product.waterResistance },
    { label: "Доп. функции", value: product.features },
    { label: "Источник энергии", value: product.energySource },
    { label: "Вес", value: product.weight },
    { label: "Страна", value: product.country },
  ].filter((s) => s.value && s.value !== "нет");

  return (
    <div className="max-w-lg mx-auto pb-8">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-brand-100">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/catalog" className="w-10 h-10 flex items-center justify-center text-brand-900 -ml-2">
            <IconChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="flex-1 font-heading text-sm font-medium text-brand-900 text-center truncate px-2">
            {product.brand} {product.name || product.sku}
          </h1>
          <button onClick={() => toggleFavorite(product.id)} className="w-10 h-10 flex items-center justify-center -mr-2">
            <IconHeart className="w-5 h-5" filled={isFavorite} />
          </button>
        </div>
      </header>

      <div className="bg-brand-50">
        <div className="aspect-square flex items-center justify-center p-6">
          <WatchImage src={product.images[selectedImage]} alt={`${product.brand} ${product.name}`} className="w-full h-full object-contain" />
        </div>
        {product.images.length > 1 && (
          <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
            {product.images.map((img, idx) => (
              <button key={idx} onClick={() => setSelectedImage(idx)} className={`shrink-0 w-16 h-16 border-2 bg-white flex items-center justify-center transition-colors ${idx === selectedImage ? "border-brand-900" : "border-brand-200"}`}>
                <WatchImage src={img} alt={`фото ${idx + 1}`} className="w-full h-full object-contain p-1" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 mt-5">
        <p className="text-[11px] tracking-[0.2em] uppercase text-brand-400 mb-1">{product.brand}</p>
        <h2 className="font-heading text-xl font-bold text-brand-900 leading-tight mb-1">{product.name || product.sku}</h2>
        <p className="text-xs text-brand-400 mb-2">Арт. {product.sku}</p>
        <p className="text-xs text-brand-500 mb-4">{product.gender} · {product.caseShape}</p>

        <div className="flex items-baseline gap-3 mb-2">
          <span className="font-heading text-2xl font-bold text-brand-900">{formatPrice(finalPrice)}</span>
          {hasDiscount && (
            <>
              <span className="text-base text-brand-400 line-through">{formatPrice(product.retailPrice)}</span>
              <span className="text-sm font-bold text-red-600">-{product.discount}%</span>
            </>
          )}
        </div>
        <p className={`text-xs mb-6 ${product.stock > 0 ? "text-green-700" : "text-red-600"}`}>
          {product.stock > 0 ? `В наличии: ${product.stock} шт.` : "Нет в наличии"}
        </p>

        <div className="mb-6">
          <h3 className="font-heading text-sm font-semibold text-brand-900 uppercase tracking-wide mb-3">Характеристики</h3>
          <div className="divide-y divide-brand-100">
            {specs.map((spec) => (
              <div key={spec.label} className="flex justify-between py-2.5 text-sm">
                <span className="text-brand-500">{spec.label}</span>
                <span className="text-brand-900 font-medium text-right ml-4">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => addItem(product)}
            disabled={outOfStock || cartFull}
            className="w-full flex items-center justify-center gap-2.5 h-12 bg-brand-900 text-white text-sm font-medium tracking-wide uppercase transition-colors active:bg-brand-800 disabled:bg-brand-300 disabled:cursor-not-allowed"
          >
            <IconCart className="w-5 h-5" />
            {outOfStock ? "Нет в наличии" : cartFull ? `Макс. кол-во (${product.stock})` : "В корзину"}
          </button>
          <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2.5 h-12 bg-[#2AABEE] text-white text-sm font-medium tracking-wide transition-colors active:bg-[#229ED9]">
            <IconTelegram className="w-5 h-5" />
            Написать в Telegram
          </a>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2.5 h-12 bg-[#25D366] text-white text-sm font-medium tracking-wide transition-colors active:bg-[#1DA851]">
            <IconWhatsApp className="w-5 h-5" />
            Написать в WhatsApp
          </a>
          <button onClick={handleShare} className="w-full flex items-center justify-center gap-2.5 h-12 border border-brand-200 text-brand-700 text-sm font-medium tracking-wide transition-colors active:bg-brand-50">
            <IconShare className="w-4 h-4" />
            {shared ? "Ссылка скопирована!" : "Поделиться"}
          </button>
        </div>
      </div>
    </div>
  );
}
