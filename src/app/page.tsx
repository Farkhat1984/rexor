"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { useBannersStore } from "@/store/banners";
import { useBrandsStore } from "@/store/brands";
import { useProductsStore } from "@/store/products";

export default function HomePage() {
  const fetchProducts = useProductsStore((s) => s.fetchProducts);
  const fetchBanners = useBannersStore((s) => s.fetchBanners);
  const fetchBrands = useBrandsStore((s) => s.fetchBrands);
  const banners = useBannersStore((s) => s.banners).filter((b) => b.active);
  const storeBrands = useBrandsStore((s) => s.brands);
  const products = useProductsStore((s) => s.products);
  const featured = products.filter((p) => p.showOnMain && p.stock > 0);
  const newArrivals = products.filter((p) => p.isNew && !p.showOnMain && p.stock > 0);
  const hits = products.filter((p) => p.isHit && !p.showOnMain && p.stock > 0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    fetchProducts();
    fetchBanners();
    fetchBrands();
    // One-time migration from localStorage to SQLite
    if (!localStorage.getItem("rexor-migrated-to-sqlite")) {
      const payload: Record<string, unknown> = {};
      for (const key of ["rexor-products", "rexor-orders", "rexor-brands", "rexor-banners", "rexor-settings"]) {
        const raw = localStorage.getItem(key);
        if (raw) try { payload[key] = JSON.parse(raw); } catch { /* skip */ }
      }
      if (Object.keys(payload).length > 0) {
        fetch("/api/migrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then((res) => { if (res.ok) { localStorage.setItem("rexor-migrated-to-sqlite", "1"); window.location.reload(); } });
      } else {
        localStorage.setItem("rexor-migrated-to-sqlite", "1");
      }
    }
  }, [fetchProducts, fetchBanners, fetchBrands]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setActiveDot(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="max-w-lg mx-auto">
      {/* Banners Carousel */}
      {banners.length > 0 && (
        <section>
          <div
            ref={scrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          >
            {banners.map((banner) => (
              <Link
                key={banner.id}
                href={banner.link}
                className="snap-center shrink-0 w-full block"
              >
                <img
                  src={banner.image}
                  alt="Баннер"
                  className="w-full h-auto object-cover"
                />
              </Link>
            ))}
          </div>
          {banners.length > 1 && (
            <div className="flex justify-center gap-1.5 py-2.5 bg-brand-50">
              {banners.map((_, idx) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    idx === activeDot ? "bg-brand-900" : "bg-brand-300"
                  }`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Brands */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3 px-4">
          <h3 className="font-heading text-lg text-brand-900">Бренды</h3>
          <Link href="/catalog" className="text-xs text-brand-500 tracking-wide uppercase">
            Все
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto snap-x scrollbar-hide pb-2 px-4">
          {storeBrands.map((brand) => (
            <Link
              key={brand.id}
              href={`/catalog?brand=${brand.slug}`}
              className="snap-start shrink-0 w-28 flex flex-col items-center gap-2 transition-colors active:opacity-80"
            >
              <div className="w-28 h-28 bg-brand-50 border border-brand-100 flex items-center justify-center overflow-hidden">
                {brand.image ? (
                  <img src={brand.image} alt={brand.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-heading font-bold text-brand-300">
                    {brand.name.charAt(0)}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-brand-700 text-center leading-tight">{brand.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured (На главную) */}
      {featured.length > 0 && (
        <section className="mt-8 px-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-lg text-brand-900">Рекомендуем</h3>
            <Link href="/catalog" className="text-xs text-brand-500 tracking-wide uppercase">
              Все
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {featured.slice(0, 6).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="mt-8 px-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-lg text-brand-900">Новые поступления</h3>
            <Link href="/catalog?sort=new" className="text-xs text-brand-500 tracking-wide uppercase">
              Все
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {newArrivals.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Hits */}
      {hits.length > 0 && (
        <section className="mt-8 px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-lg text-brand-900">Хиты продаж</h3>
            <Link href="/catalog" className="text-xs text-brand-500 tracking-wide uppercase">
              Все
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {hits.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {products.length === 0 && (
        <div className="text-center py-16 px-4">
          <p className="text-brand-400 text-sm">Товаров пока нет. Загрузите данные в админке.</p>
          <Link href="/admin" className="text-xs text-brand-900 underline mt-2 inline-block">
            Перейти в админку
          </Link>
        </div>
      )}
    </div>
  );
}
