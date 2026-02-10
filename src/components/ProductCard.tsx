"use client";

import Link from "next/link";
import { Product } from "@/lib/types";
import { formatPrice, getDiscountedPrice } from "@/lib/data";
import { useCartStore } from "@/store/cart";
import { useFavoritesStore } from "@/store/favorites";
import { IconHeart, IconCart } from "./Icons";
import { WatchImage } from "./WatchImage";

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const toggle = useFavoritesStore((s) => s.toggle);
  const isFav = useFavoritesStore((s) => s.ids.includes(product.id));
  const cartQty = useCartStore((s) => s.getQuantity(product.id));
  const outOfStock = product.stock <= 0;
  const cartFull = cartQty >= product.stock;
  const hasDiscount = (product.discount ?? 0) > 0;
  const finalPrice = getDiscountedPrice(product.retailPrice, product.discount);

  return (
    <div className="group relative bg-white">
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-square bg-brand-50 overflow-hidden">
          <WatchImage
            src={product.images[0]}
            alt={`${product.brand} ${product.name}`}
            className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
          />
          {outOfStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="text-xs font-medium text-brand-500 bg-white px-3 py-1 border border-brand-200">Нет в наличии</span>
            </div>
          )}
          {product.isNew && (
            <span className="absolute bottom-2 left-2 z-10 bg-brand-900 text-white text-[10px] tracking-widest uppercase px-2 py-0.5">
              New
            </span>
          )}
          {product.isHit && (
            <span className="absolute bottom-2 right-2 z-10 bg-orange-500 text-white text-[10px] tracking-widest uppercase px-2 py-0.5">
              Hit
            </span>
          )}
        </div>
        <div className="p-2.5">
          <p className="text-[11px] text-brand-500 tracking-wide uppercase">{product.brand}</p>
          <p className="text-sm font-medium text-brand-900 line-clamp-1 mt-0.5 font-heading">{product.name || product.sku}</p>
          <p className="text-[10px] text-brand-400 mt-0.5">Арт. {product.sku}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-base font-bold text-brand-900">{formatPrice(finalPrice)}</span>
            {hasDiscount && (
              <>
                <span className="text-xs text-brand-400 line-through">{formatPrice(product.retailPrice)}</span>
                <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5">
                  -{product.discount}%
                </span>
              </>
            )}
          </div>
        </div>
      </Link>

      <button
        onClick={(e) => { e.preventDefault(); toggle(product.id); }}
        className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full"
        aria-label="Избранное"
      >
        <IconHeart className="w-4 h-4" filled={isFav} />
      </button>

      <button
        onClick={(e) => { e.preventDefault(); if (!outOfStock && !cartFull) addItem(product); }}
        disabled={outOfStock || cartFull}
        className="mx-2.5 mb-2.5 w-[calc(100%-20px)] h-9 flex items-center justify-center gap-1.5 bg-brand-900 text-white text-xs tracking-wide uppercase transition-colors active:bg-brand-800 disabled:bg-brand-300 disabled:cursor-not-allowed"
        aria-label="В корзину"
      >
        <IconCart className="w-4 h-4" />
        <span>{outOfStock ? "Нет в наличии" : cartFull ? "Макс. кол-во" : "В корзину"}</span>
      </button>
    </div>
  );
}
