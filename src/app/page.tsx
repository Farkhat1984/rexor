"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { useBannersStore } from "@/store/banners";
import { useBrandsStore } from "@/store/brands";

export default function HomePage() {
  const fetchBanners = useBannersStore((s) => s.fetchBanners);
  const fetchBrands = useBrandsStore((s) => s.fetchBrands);
  const banners = useBannersStore((s) => s.banners).filter((b) => b.active);
  const storeBrands = useBrandsStore((s) => s.brands);

  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [hits, setHits] = useState<Product[]>([]);
  const [hasProducts, setHasProducts] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const brandsScrollRef = useRef<HTMLDivElement>(null);
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    fetchBanners();
    fetchBrands();

    // Fetch lightweight product sections in parallel
    const base = "/api/products?inStock=true";
    Promise.all([
      fetch(`${base}&page=1&limit=6&showOnMain=true`).then((r) => r.json()),
      fetch(`${base}&page=1&limit=4&isNew=true&showOnMain=false`).then((r) => r.json()),
      fetch(`${base}&page=1&limit=4&isHit=true&showOnMain=false`).then((r) => r.json()),
    ]).then(([featuredData, newData, hitsData]) => {
      setFeatured(featuredData.products || []);
      setNewArrivals(newData.products || []);
      setHits(hitsData.products || []);
      setHasProducts(featuredData.stats?.totalAll > 0);
    }).catch(() => {});

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
  }, [fetchBanners, fetchBrands]);

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

  // Auto-scroll banners every 5 seconds
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || banners.length <= 1) return;
    let paused = false;
    let resumeTimer: ReturnType<typeof setTimeout>;
    const interval = setInterval(() => {
      if (paused) return;
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      const next = idx >= banners.length - 1 ? 0 : idx + 1;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 5000);
    const onTouch = () => {
      paused = true;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { paused = false; }, 5000);
    };
    el.addEventListener("touchstart", onTouch, { passive: true });
    return () => { clearInterval(interval); clearTimeout(resumeTimer); el.removeEventListener("touchstart", onTouch); };
  }, [banners.length]);

  // Auto-scroll brands row every 5 seconds
  useEffect(() => {
    const el = brandsScrollRef.current;
    if (!el || storeBrands.length <= 3) return;
    let paused = false;
    let resumeTimer: ReturnType<typeof setTimeout>;
    const brandWidth = 124; // 112px + 12px gap
    const interval = setInterval(() => {
      if (paused) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: brandWidth, behavior: "smooth" });
      }
    }, 5000);
    const onTouch = () => {
      paused = true;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { paused = false; }, 5000);
    };
    el.addEventListener("touchstart", onTouch, { passive: true });
    return () => { clearInterval(interval); clearTimeout(resumeTimer); el.removeEventListener("touchstart", onTouch); };
  }, [storeBrands.length]);

  return (
    <div className="max-w-lg mx-auto">
      {/* Banners Carousel */}
      {banners.length > 0 && (
        <section>
          <div
            ref={scrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          >
            {banners.map((banner) => {
              const href = banner.link || "/catalog";
              const isExternal = href.startsWith("http");
              return isExternal ? (
                <a
                  key={banner.id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="snap-center shrink-0 w-full block"
                >
                  <img
                    src={banner.image}
                    alt="Баннер"
                    className="w-full h-auto object-cover"
                  />
                </a>
              ) : (
                <Link
                  key={banner.id}
                  href={href}
                  className="snap-center shrink-0 w-full block"
                >
                  <img
                    src={banner.image}
                    alt="Баннер"
                    className="w-full h-auto object-cover"
                  />
                </Link>
              );
            })}
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
        <div ref={brandsScrollRef} className="flex gap-3 overflow-x-auto snap-x scrollbar-hide pb-2 px-4">
          {storeBrands.map((brand) => (
            <Link
              key={brand.id}
              href={`/catalog?brand=${brand.slug}`}
              className="snap-start shrink-0 w-28 flex flex-col items-center gap-2"
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
            {featured.map((product) => (
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
            {newArrivals.map((product) => (
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
            {hits.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {!hasProducts && (
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
