"use client";

import { useState, useMemo, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/data";
import { Product, SortOption } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { IconFilter, IconSort, IconX, IconChevronLeft, IconSearch } from "@/components/Icons";
import { useBrandsStore } from "@/store/brands";

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

interface FilterOptions {
  brands: string[];
  genders: string[];
  mechanisms: string[];
  caseShapes: string[];
  priceRange: { min: number; max: number };
}

const PER_PAGE = 20;

const defaultFilters: Filters = {
  brand: [],
  gender: [],
  mechanism: [],
  caseShape: [],
  priceMin: 0,
  priceMax: 0,
};

function CatalogContent() {
  const fetchBrands = useBrandsStore((s) => s.fetchBrands);
  const allBrands = useBrandsStore((s) => s.brands);
  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  const searchParams = useSearchParams();
  const initialBrandSlug = searchParams.get("brand") || "";
  const initialSort = (searchParams.get("sort") as SortOption) || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    brands: [], genders: [], mechanisms: [], caseShapes: [], priceRange: { min: 0, max: 999999 },
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<Filters>({ ...defaultFilters });
  const [sort, setSort] = useState<SortOption | "">(initialSort);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [draftFilters, setDraftFilters] = useState<Filters>({ ...defaultFilters });
  const [draftCount, setDraftCount] = useState<number | null>(null);

  // Set initial brand from URL slug once brands load
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initialBrandSlug || initializedRef.current) return;
    if (allBrands.length === 0) return;
    const brand = allBrands.find((b) => b.slug === initialBrandSlug);
    if (brand) {
      setFilters((prev) => ({ ...prev, brand: [brand.name] }));
    }
    initializedRef.current = true;
  }, [allBrands, initialBrandSlug]);

  // Skip initial fetch if waiting for brand slug resolution
  const ready = !initialBrandSlug || initializedRef.current;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch products from API
  const fetchProducts = useCallback(() => {
    if (!ready) return;
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(PER_PAGE));
    params.set("inStock", "true");
    if (debouncedSearch.length >= 2) params.set("search", debouncedSearch);
    if (filters.brand.length) params.set("brand", filters.brand.join(","));
    if (filters.gender.length) params.set("gender", filters.gender.join(","));
    if (filters.mechanism.length) params.set("mechanism", filters.mechanism.join(","));
    if (filters.caseShape.length) params.set("caseShape", filters.caseShape.join(","));
    if (filters.priceMin > 0) params.set("priceMin", String(filters.priceMin));
    if (filters.priceMax > 0) params.set("priceMax", String(filters.priceMax));
    if (sort) params.set("sort", sort);

    if (page === 1) setLoading(true); else setLoadingMore(true);
    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts((prev) => page === 1 ? data.products : [...prev, ...data.products]);
        setTotal(data.total);
        setFilterOptions(data.filterOptions);
      })
      .finally(() => { setLoading(false); setLoadingMore(false); });
  }, [page, filters, sort, debouncedSearch, ready]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // IntersectionObserver for infinite scroll
  const hasMore = products.length < total;
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) setPage((p) => p + 1); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore]);

  // Draft count for filter preview
  useEffect(() => {
    if (!showFilters) return;
    setDraftCount(null);
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "1");
      params.set("inStock", "true");
      params.set("countOnly", "true");
      if (draftFilters.brand.length) params.set("brand", draftFilters.brand.join(","));
      if (draftFilters.gender.length) params.set("gender", draftFilters.gender.join(","));
      if (draftFilters.mechanism.length) params.set("mechanism", draftFilters.mechanism.join(","));
      if (draftFilters.caseShape.length) params.set("caseShape", draftFilters.caseShape.join(","));
      if (draftFilters.priceMin > 0) params.set("priceMin", String(draftFilters.priceMin));
      if (draftFilters.priceMax > 0) params.set("priceMax", String(draftFilters.priceMax));
      if (debouncedSearch.length >= 2) params.set("search", debouncedSearch);

      fetch(`/api/products?${params}`)
        .then((r) => r.json())
        .then((data) => setDraftCount(data.total))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [showFilters, draftFilters, debouncedSearch]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.brand.length) count += filters.brand.length;
    if (filters.gender.length) count += filters.gender.length;
    if (filters.mechanism.length) count += filters.mechanism.length;
    if (filters.caseShape.length) count += filters.caseShape.length;
    if (filters.priceMin > 0) count++;
    if (filters.priceMax > 0) count++;
    return count;
  }, [filters]);

  // Brand names from actual products in DB
  const brandNames = filterOptions.brands;

  function openFilters() {
    setDraftFilters({ ...filters });
    setShowFilters(true);
  }
  function applyFilters() {
    setFilters({ ...draftFilters });
    setShowFilters(false);
    setProducts([]); setPage(1);
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
              onChange={(e) => { setSearchQuery(e.target.value); setProducts([]); setPage(1); }}
              placeholder="Артикул, бренд или название..."
              className="w-full h-10 pl-9 pr-9 bg-brand-50 border border-brand-100 text-sm text-brand-900 placeholder:text-brand-400 outline-none focus:border-brand-300 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setProducts([]); setPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-brand-400">
                <IconX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="px-4 py-3">
        <p className="text-sm text-brand-500">
          {loading ? "Загрузка..." : total === 0 ? "Ничего не найдено" : pluralize(total)}
          {sort && <span className="text-brand-400"> &middot; {sortLabels[sort]}</span>}
        </p>
      </div>

      {loading && products.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-900 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 px-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {hasMore && (
        <div ref={sentinelRef} className="flex items-center justify-center py-6">
          {loadingMore && <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-900 rounded-full animate-spin" />}
        </div>
      )}

      {!loading && total === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <p className="text-brand-400 text-sm text-center">Попробуйте изменить фильтры или сбросить их</p>
          <button onClick={() => { setFilters({ ...defaultFilters }); setSort(""); setSearchQuery(""); setProducts([]); setPage(1); }} className="mt-4 text-sm font-medium text-brand-900 underline underline-offset-2">Сбросить все</button>
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
            {/* Brand chips - horizontal scroll */}
            {brandNames.length > 0 && (
              <section>
                <h3 className="text-sm font-heading font-semibold text-brand-900 mb-2">Бренд</h3>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
                  {brandNames.map((item) => {
                    const active = draftFilters.brand.includes(item);
                    return (
                      <button key={item} onClick={() => toggleDraftArray("brand", item)} className={`px-3 py-1.5 text-xs rounded-full border transition-colors whitespace-nowrap shrink-0 ${active ? "bg-brand-900 text-white border-brand-900" : "bg-white text-brand-700 border-brand-200 active:bg-brand-50"}`}>
                        {item}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
            <FilterChips title="Гендер" items={filterOptions.genders} selected={draftFilters.gender} onToggle={(v) => toggleDraftArray("gender", v)} />
            <FilterChips title="Механизм" items={filterOptions.mechanisms} selected={draftFilters.mechanism} onToggle={(v) => toggleDraftArray("mechanism", v)} />
            <FilterChips title="Форма корпуса" items={filterOptions.caseShapes} selected={draftFilters.caseShape} onToggle={(v) => toggleDraftArray("caseShape", v)} />
            <section>
              <h3 className="text-sm font-heading font-semibold text-brand-900 mb-2">Цена</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[11px] text-brand-400 mb-1 block">от</label>
                  <input type="number" value={draftFilters.priceMin || ""} onChange={(e) => setDraftFilters((prev) => ({ ...prev, priceMin: Number(e.target.value) || 0 }))} placeholder={String(filterOptions.priceRange.min)} className="w-full h-10 px-3 border border-brand-200 rounded-lg text-sm text-brand-900 bg-white focus:outline-none focus:border-brand-400" />
                </div>
                <span className="text-brand-300 mt-4">&ndash;</span>
                <div className="flex-1">
                  <label className="text-[11px] text-brand-400 mb-1 block">до</label>
                  <input type="number" value={draftFilters.priceMax || ""} onChange={(e) => setDraftFilters((prev) => ({ ...prev, priceMax: Number(e.target.value) || 0 }))} placeholder={String(filterOptions.priceRange.max)} className="w-full h-10 px-3 border border-brand-200 rounded-lg text-sm text-brand-900 bg-white focus:outline-none focus:border-brand-400" />
                </div>
              </div>
              <p className="text-[11px] text-brand-400 mt-1.5">{formatPrice(filterOptions.priceRange.min)} &mdash; {formatPrice(filterOptions.priceRange.max)}</p>
            </section>
          </div>
          <div className="flex items-center gap-3 px-4 py-4 border-t border-brand-100 bg-white">
            <button onClick={resetDraftFilters} className="flex-1 h-11 text-sm font-medium text-brand-700 border border-brand-200 rounded-lg active:bg-brand-50">Сбросить</button>
            <button onClick={applyFilters} className="flex-[2] h-11 text-sm font-medium text-white bg-brand-900 rounded-lg active:bg-brand-800">
              Показать{draftCount !== null ? ` (${draftCount})` : ""}
            </button>
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
              <button key={key} onClick={() => { setSort(sort === key ? "" : key); setShowSort(false); setProducts([]); setPage(1); }} className={`w-full flex items-center justify-between px-4 py-3.5 text-sm transition-colors ${sort === key ? "text-brand-900 font-semibold bg-brand-50" : "text-brand-700 active:bg-brand-50"}`}>
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
