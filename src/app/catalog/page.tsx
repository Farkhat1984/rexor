"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { brands, formatPrice } from "@/lib/data";
import { SortOption } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { IconFilter, IconSort, IconX, IconChevronLeft, IconSearch } from "@/components/Icons";
import { useProductsStore } from "@/store/products";

const sortLabels: Record<SortOption, string> = {
  popular: "Популярные",
  price_asc: "Сначала дешевле",
  price_desc: "Сначала дороже",
  new: "Новинки",
  discount: "По скидке",
  name_asc: "Название А\u2013Я",
  name_desc: "Название Я\u2013А",
};

interface Filters {
  brand: string[];
  gender: string[];
  mechanism: string[];
  caseShape: string[];
  priceMin: number;
  priceMax: number;
}

function CatalogContent() {
  const fetchProducts = useProductsStore((s) => s.fetchProducts);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  const products = useProductsStore((s) => s.products).filter((p) => p.stock > 0);
  const searchParams = useSearchParams();
  const initialBrandSlug = searchParams.get("brand") || "";
  const initialSort = (searchParams.get("sort") as SortOption) || "";
  const initialBrandName = brands.find((b) => b.slug === initialBrandSlug)?.name || "";

  const priceList = products.map((p) => p.retailPrice);
  const PRICE_MIN = priceList.length ? Math.min(...priceList) : 0;
  const PRICE_MAX = priceList.length ? Math.max(...priceList) : 999999;

  const defaultFilters: Filters = {
    brand: [],
    gender: [],
    mechanism: [],
    caseShape: [],
    priceMin: PRICE_MIN,
    priceMax: PRICE_MAX,
  };

  const [filters, setFilters] = useState<Filters>(() => ({
    ...defaultFilters,
    brand: initialBrandName ? [initialBrandName] : [],
  }));
  const [sort, setSort] = useState<SortOption | "">(initialSort);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [draftFilters, setDraftFilters] = useState<Filters>(filters);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const PER_PAGE = 10;

  const uniqueBrands = useMemo(() => [...new Set(products.map((p) => p.brand))].sort(), [products]);
  const uniqueGenders = useMemo(() => [...new Set(products.map((p) => p.gender))].sort(), [products]);
  const uniqueMechanisms = useMemo(() => [...new Set(products.map((p) => p.mechanism))].sort(), [products]);
  const uniqueShapes = useMemo(() => [...new Set(products.map((p) => p.caseShape))].filter(Boolean).sort(), [products]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.brand.length) count += filters.brand.length;
    if (filters.gender.length) count += filters.gender.length;
    if (filters.mechanism.length) count += filters.mechanism.length;
    if (filters.caseShape.length) count += filters.caseShape.length;
    if (filters.priceMin > PRICE_MIN) count++;
    if (filters.priceMax < PRICE_MAX) count++;
    return count;
  }, [filters, PRICE_MIN, PRICE_MAX]);

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = products.filter((p) => {
      if (q.length >= 2) {
        const matches = p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (filters.brand.length && !filters.brand.includes(p.brand)) return false;
      if (filters.gender.length && !filters.gender.includes(p.gender)) return false;
      if (filters.mechanism.length && !filters.mechanism.includes(p.mechanism)) return false;
      if (filters.caseShape.length && !filters.caseShape.includes(p.caseShape)) return false;
      if (p.retailPrice < filters.priceMin || p.retailPrice > filters.priceMax) return false;
      return true;
    });

    if (sort === "popular") result = [...result].sort((a, b) => (b.isHit ? 1 : 0) - (a.isHit ? 1 : 0));
    else if (sort === "price_asc") result = [...result].sort((a, b) => a.retailPrice - b.retailPrice);
    else if (sort === "price_desc") result = [...result].sort((a, b) => b.retailPrice - a.retailPrice);
    else if (sort === "new") result = [...result].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    else if (sort === "discount") result = [...result].sort((a, b) => (b.discount || 0) - (a.discount || 0));
    else if (sort === "name_asc") result = [...result].sort((a, b) => a.name.localeCompare(b.name, "ru"));
    else if (sort === "name_desc") result = [...result].sort((a, b) => b.name.localeCompare(a.name, "ru"));

    return result;
  }, [products, filters, sort, searchQuery]);

  const totalPages = Math.ceil(filteredAndSorted.length / PER_PAGE);
  const paginatedProducts = filteredAndSorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const draftCount = useMemo(() => {
    return products.filter((p) => {
      if (draftFilters.brand.length && !draftFilters.brand.includes(p.brand)) return false;
      if (draftFilters.gender.length && !draftFilters.gender.includes(p.gender)) return false;
      if (draftFilters.mechanism.length && !draftFilters.mechanism.includes(p.mechanism)) return false;
      if (draftFilters.caseShape.length && !draftFilters.caseShape.includes(p.caseShape)) return false;
      if (p.retailPrice < draftFilters.priceMin || p.retailPrice > draftFilters.priceMax) return false;
      return true;
    }).length;
  }, [products, draftFilters]);

  function openFilters() {
    setDraftFilters({ ...filters });
    setShowFilters(true);
  }
  function applyFilters() {
    setFilters({ ...draftFilters });
    setShowFilters(false);
    setPage(1);
  }
  function resetDraftFilters() {
    setDraftFilters({ ...defaultFilters });
  }
  function toggleDraftArray(key: keyof Pick<Filters, "brand" | "gender" | "mechanism" | "caseShape">, value: string) {
    setDraftFilters((prev) => {
      const arr = prev[key];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [key]: next };
    });
  }

  return (
    <div className="min-h-screen bg-brand-50 max-w-lg mx-auto">
      <header className="sticky top-0 z-30 bg-white border-b border-brand-100">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href="/" className="flex items-center justify-center w-9 h-9 -ml-1">
            <IconChevronLeft className="w-5 h-5 text-brand-900" />
          </Link>
          <h1 className="text-lg font-heading font-semibold text-brand-900 tracking-wide">Каталог</h1>
          <div className="flex items-center gap-1">
            <button onClick={openFilters} className="relative flex items-center justify-center w-9 h-9" aria-label="Фильтры">
              <IconFilter className="w-5 h-5 text-brand-700" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-brand-900 text-white text-[10px] font-bold rounded-full px-1">{activeFilterCount}</span>
              )}
            </button>
            <button onClick={() => setShowSort(true)} className="flex items-center justify-center w-9 h-9" aria-label="Сортировка">
              <IconSort className="w-5 h-5 text-brand-700" />
            </button>
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Артикул, бренд или название..."
              className="w-full h-10 pl-9 pr-9 bg-brand-50 border border-brand-100 text-sm text-brand-900 placeholder:text-brand-400 outline-none focus:border-brand-300 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-brand-400">
                <IconX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="px-4 py-3">
        <p className="text-sm text-brand-500">
          {filteredAndSorted.length === 0 ? "Ничего не найдено" : `${filteredAndSorted.length} ${pluralize(filteredAndSorted.length)}`}
          {sort && <span className="text-brand-400"> &middot; {sortLabels[sort]}</span>}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 px-4">
        {paginatedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 py-5 px-4 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            disabled={page === 1}
            className="w-9 h-9 flex items-center justify-center text-sm text-brand-700 border border-brand-200 bg-white disabled:opacity-30 disabled:pointer-events-none active:bg-brand-50 shrink-0"
          >&lsaquo;</button>
          {getPageNumbers(page, totalPages).map((p, i) =>
            p === "..." ? (
              <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-brand-400 shrink-0">&hellip;</span>
            ) : (
              <button
                key={p}
                onClick={() => { setPage(p as number); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className={`w-9 h-9 flex items-center justify-center text-sm border transition-colors shrink-0 ${p === page ? "bg-brand-900 text-white border-brand-900" : "text-brand-700 border-brand-200 bg-white active:bg-brand-50"}`}
              >{p}</button>
            )
          )}
          <button
            onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            disabled={page === totalPages}
            className="w-9 h-9 flex items-center justify-center text-sm text-brand-700 border border-brand-200 bg-white disabled:opacity-30 disabled:pointer-events-none active:bg-brand-50 shrink-0"
          >&rsaquo;</button>
        </div>
      )}

      {filteredAndSorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <p className="text-brand-400 text-sm text-center">Попробуйте изменить фильтры или сбросить их</p>
          <button onClick={() => { setFilters({ ...defaultFilters }); setSort(""); setPage(1); }} className="mt-4 text-sm font-medium text-brand-900 underline underline-offset-2">Сбросить все</button>
        </div>
      )}

      {/* Filter bottom sheet */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${showFilters ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
        <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col transition-transform duration-300 ${showFilters ? "translate-y-0" : "translate-y-full"}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-100">
            <h2 className="text-base font-heading font-semibold text-brand-900">Фильтры</h2>
            <button onClick={() => setShowFilters(false)} className="flex items-center justify-center w-8 h-8" aria-label="Закрыть"><IconX className="w-5 h-5 text-brand-500" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            <FilterChips title="Бренд" items={uniqueBrands} selected={draftFilters.brand} onToggle={(v) => toggleDraftArray("brand", v)} />
            <FilterChips title="Гендер" items={uniqueGenders} selected={draftFilters.gender} onToggle={(v) => toggleDraftArray("gender", v)} />
            <FilterChips title="Механизм" items={uniqueMechanisms} selected={draftFilters.mechanism} onToggle={(v) => toggleDraftArray("mechanism", v)} />
            <FilterChips title="Форма корпуса" items={uniqueShapes} selected={draftFilters.caseShape} onToggle={(v) => toggleDraftArray("caseShape", v)} />
            <section>
              <h3 className="text-sm font-heading font-semibold text-brand-900 mb-2">Цена</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[11px] text-brand-400 mb-1 block">от</label>
                  <input type="number" value={draftFilters.priceMin} onChange={(e) => setDraftFilters((prev) => ({ ...prev, priceMin: Number(e.target.value) || 0 }))} className="w-full h-10 px-3 border border-brand-200 rounded-lg text-sm text-brand-900 bg-white focus:outline-none focus:border-brand-400" />
                </div>
                <span className="text-brand-300 mt-4">&ndash;</span>
                <div className="flex-1">
                  <label className="text-[11px] text-brand-400 mb-1 block">до</label>
                  <input type="number" value={draftFilters.priceMax} onChange={(e) => setDraftFilters((prev) => ({ ...prev, priceMax: Number(e.target.value) || 0 }))} className="w-full h-10 px-3 border border-brand-200 rounded-lg text-sm text-brand-900 bg-white focus:outline-none focus:border-brand-400" />
                </div>
              </div>
              <p className="text-[11px] text-brand-400 mt-1.5">{formatPrice(PRICE_MIN)} &mdash; {formatPrice(PRICE_MAX)}</p>
            </section>
          </div>
          <div className="flex items-center gap-3 px-4 py-4 border-t border-brand-100 bg-white">
            <button onClick={resetDraftFilters} className="flex-1 h-11 text-sm font-medium text-brand-700 border border-brand-200 rounded-lg active:bg-brand-50">Сбросить</button>
            <button onClick={applyFilters} className="flex-[2] h-11 text-sm font-medium text-white bg-brand-900 rounded-lg active:bg-brand-800">Показать ({draftCount})</button>
          </div>
        </div>
      </div>

      {/* Sort bottom sheet */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${showSort ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowSort(false)} />
        <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl transition-transform duration-300 ${showSort ? "translate-y-0" : "translate-y-full"}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-100">
            <h2 className="text-base font-heading font-semibold text-brand-900">Сортировка</h2>
            <button onClick={() => setShowSort(false)} className="flex items-center justify-center w-8 h-8" aria-label="Закрыть"><IconX className="w-5 h-5 text-brand-500" /></button>
          </div>
          <div className="py-2">
            {(Object.keys(sortLabels) as SortOption[]).map((key) => (
              <button key={key} onClick={() => { setSort(sort === key ? "" : key); setShowSort(false); setPage(1); }} className={`w-full flex items-center justify-between px-4 py-3.5 text-sm transition-colors ${sort === key ? "text-brand-900 font-semibold bg-brand-50" : "text-brand-700 active:bg-brand-50"}`}>
                <span>{sortLabels[key]}</span>
                {sort === key && <svg className="w-4 h-4 text-brand-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push("...", total);
  } else if (current >= total - 3) {
    pages.push(1, "...");
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total);
  }
  return pages;
}

function FilterChips({ title, items, selected, onToggle }: { title: string; items: string[]; selected: string[]; onToggle: (v: string) => void }) {
  if (!items.length) return null;
  return (
    <section>
      <h3 className="text-sm font-heading font-semibold text-brand-900 mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = selected.includes(item);
          return (
            <button key={item} onClick={() => onToggle(item)} className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${active ? "bg-brand-900 text-white border-brand-900" : "bg-white text-brand-700 border-brand-200 active:bg-brand-50"}`}>
              {item}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function pluralize(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} товар`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${count} товара`;
  return `${count} товаров`;
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-900 rounded-full animate-spin" /></div>}>
      <CatalogContent />
    </Suspense>
  );
}
