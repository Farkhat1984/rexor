"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useBrandsStore } from "@/store/brands";
import { IconTrash, IconSearch } from "@/components/Icons";
import { convertToWebP } from "@/lib/imageUtils";

const PER_PAGE = 20;

export default function AdminBrandsPage() {
  const { brands, removeBrand, updateBrand, fetchBrands } = useBrandsStore();
  useEffect(() => { fetchBrands(true); }, [fetchBrands]);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PER_PAGE);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q));
  }, [brands, search]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore) setVisibleCount((c) => c + PER_PAGE); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore]);

  async function handleImageUpload(brandId: string, file: File) {
    const webp = await convertToWebP(file, 400, 0.85);
    updateBrand(brandId, { image: webp });
  }

  return (
    <div>
      <h2 className="font-heading text-lg text-brand-900 mb-1">
        Бренды ({brands.length})
      </h2>
      <p className="text-[10px] text-brand-400 mb-4">
        Бренды создаются автоматически при загрузке товаров из Excel.
      </p>

      {brands.length > 5 && (
        <div className="relative mb-4">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setVisibleCount(PER_PAGE); }}
            placeholder="Поиск бренда..."
            className="w-full h-10 pl-9 pr-4 bg-brand-50 border border-brand-100 text-sm outline-none focus:border-brand-300"
          />
        </div>
      )}

      <div className="space-y-2">
        {visible.map((brand) => (
          <div
            key={brand.id}
            className="bg-brand-50 border border-brand-100 p-3"
          >
            <div className="flex items-center gap-3">
              {/* Image preview */}
              <div
                className="w-14 h-14 shrink-0 bg-white border border-brand-200 flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={() => fileInputRefs.current[brand.id]?.click()}
              >
                {brand.image ? (
                  <img
                    src={brand.image}
                    alt={brand.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-brand-400 text-center leading-tight">
                    + фото
                  </span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={(el) => { fileInputRefs.current[brand.id] = el; }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(brand.id, file);
                }}
              />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-900">{brand.name}</p>
                <p className="text-[10px] text-brand-400">/{brand.slug}</p>
              </div>

              <div className="flex items-center gap-1">
                {brand.image && (
                  <button
                    onClick={() => updateBrand(brand.id, { image: "" })}
                    className="text-[10px] text-brand-400 underline"
                  >
                    Убрать фото
                  </button>
                )}
                <button
                  onClick={() => removeBrand(brand.id)}
                  className="text-brand-400 p-1"
                >
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && <div ref={sentinelRef} className="py-5" />}

      {brands.length === 0 && (
        <div className="text-center py-16 text-brand-400 text-sm">
          Брендов пока нет. Загрузите товары из Excel — бренды появятся автоматически.
        </div>
      )}
    </div>
  );
}
