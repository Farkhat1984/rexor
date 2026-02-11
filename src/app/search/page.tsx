"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/data";
import { Product } from "@/lib/types";
import { IconChevronLeft, IconSearch, IconX } from "@/components/Icons";
import { WatchImage } from "@/components/WatchImage";
import { useBrandsStore } from "@/store/brands";

export default function SearchPage() {
  const fetchBrands = useBrandsStore((s) => s.fetchBrands);
  const brands = useBrandsStore((s) => s.brands);
  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch search results from API
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams({
      page: "1",
      limit: "30",
      search: debouncedQuery.trim(),
    });
    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data.products || []);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const quickBrands = brands.slice(0, 4);

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
                  <button key={b.id} onClick={() => setQuery(b.name)} className="px-3 py-1.5 bg-brand-50 border border-brand-100 text-xs text-brand-700 transition-colors active:bg-brand-100">{b.name}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {query && query.length < 2 && (
          <div className="text-center py-12">
            <p className="text-brand-400 text-sm">Введите минимум 2 символа</p>
          </div>
        )}

        {query.length >= 2 && (
          <>
            <p className="text-xs text-brand-500 mb-3">
              {loading ? "Поиск..." : total > 0 ? `Найдено: ${total}` : "Ничего не найдено"}
            </p>
            {!loading && results.length === 0 && debouncedQuery.length >= 2 && (
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
