"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/data";
import { IconChevronLeft, IconSearch, IconX } from "@/components/Icons";
import { WatchImage } from "@/components/WatchImage";
import { useProductsStore } from "@/store/products";

export default function SearchPage() {
  const fetchProducts = useProductsStore((s) => s.fetchProducts);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  const products = useProductsStore((s) => s.products);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (q.length < 2) return [];
    return products.filter(
      (p) =>
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
    );
  }, [query, products]);

  const suggestions = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (q.length < 1) return [];
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.brand.toLowerCase().includes(q)) set.add(p.brand);
      if (p.name.toLowerCase().includes(q)) set.add(p.name);
      if (p.sku.toLowerCase().includes(q)) set.add(p.sku);
    });
    return Array.from(set).slice(0, 5);
  }, [query, products]);

  const quickBrands = useMemo(() => {
    const brands = [...new Set(products.map((p) => p.brand))];
    return brands.slice(0, 4);
  }, [products]);

  return (
    <div className="max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-white border-b border-brand-100">
        <div className="flex items-center gap-2 px-2 h-14">
          <Link href="/" className="w-10 h-10 flex items-center justify-center shrink-0 text-brand-900">
            <IconChevronLeft className="w-5 h-5" />
          </Link>
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Артикул, бренд или название..."
              autoFocus
              className="w-full h-10 pl-9 pr-9 bg-brand-50 border border-brand-100 text-sm text-brand-900 placeholder:text-brand-400 outline-none focus:border-brand-300 transition-colors"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-brand-400">
                <IconX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="px-4 py-4">
        {!query && (
          <div className="text-center py-16">
            <IconSearch className="w-12 h-12 text-brand-200 mx-auto mb-4" />
            <p className="text-brand-500 text-sm">Введите артикул, бренд или название</p>
            {quickBrands.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {quickBrands.map((b) => (
                  <button key={b} onClick={() => setQuery(b)} className="px-3 py-1.5 bg-brand-50 border border-brand-100 text-xs text-brand-700 transition-colors active:bg-brand-100">{b}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {query && query.length < 2 && suggestions.length > 0 && (
          <div>
            <p className="text-xs text-brand-400 mb-2 uppercase tracking-wide">Подсказки</p>
            {suggestions.map((s) => (
              <button key={s} onClick={() => setQuery(s)} className="flex items-center gap-3 w-full py-2.5 text-left text-sm text-brand-700 border-b border-brand-50">
                <IconSearch className="w-4 h-4 text-brand-300 shrink-0" />
                {s}
              </button>
            ))}
          </div>
        )}

        {query.length >= 2 && (
          <>
            <p className="text-xs text-brand-500 mb-3">
              {results.length > 0 ? `Найдено: ${results.length}` : "Ничего не найдено"}
            </p>
            {results.length === 0 && (
              <div className="text-center py-12">
                <p className="text-brand-400 text-sm">Попробуйте изменить запрос</p>
              </div>
            )}
            <div className="space-y-2">
              {results.map((p) => (
                <Link key={p.id} href={`/product/${p.id}`} className="flex items-center gap-3 p-2.5 bg-brand-50 border border-brand-100 transition-colors active:bg-brand-100">
                  <div className="w-16 h-16 bg-white shrink-0 flex items-center justify-center">
                    <WatchImage src={p.images[0]} alt={p.name} className="w-full h-full object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-brand-500 uppercase">{p.brand}</p>
                    <p className="text-sm font-medium text-brand-900 line-clamp-1">{p.name || p.sku}</p>
                    <p className="text-[10px] text-brand-400">Арт. {p.sku}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-sm font-bold text-brand-900">{formatPrice(p.retailPrice)}</p>
                      {p.stock <= 0 && <span className="text-[10px] text-red-600">Нет в наличии</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
