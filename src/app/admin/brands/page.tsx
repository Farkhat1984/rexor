"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useBrandsStore } from "@/store/brands";
import { IconTrash, IconSearch } from "@/components/Icons";
import { convertToWebP } from "@/lib/imageUtils";

const PER_PAGE = 20;

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/gi, "")
    .trim()
    .replace(/[\s]+/g, "-");
}

export default function AdminBrandsPage() {
  const { brands, addBrand, removeBrand, updateBrand, fetchBrands } = useBrandsStore();
  useEffect(() => { fetchBrands(true); }, [fetchBrands]);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PER_PAGE);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Create brand state
  const [showCreate, setShowCreate] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [productBrands, setProductBrands] = useState<string[]>([]);

  // Fetch unique brand names from products for dropdown
  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((products: { brand: string }[]) => {
        const names = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort();
        setProductBrands(names);
      })
      .catch(() => {});
  }, []);

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

  // Brand names from products that don't already have a brand entry
  const existingNames = new Set(brands.map((b) => b.name.toLowerCase()));
  const availableProductBrands = productBrands.filter((n) => !existingNames.has(n.toLowerCase()));

  function handleCreateBrand() {
    const name = newBrandName.trim();
    if (!name) return;
    if (existingNames.has(name.toLowerCase())) return;
    const slug = toSlug(name);
    const id = "brand-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
    addBrand({ id, name, slug, image: "" });
    setNewBrandName("");
    setShowCreate(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-heading text-lg text-brand-900">
          Бренды ({brands.length})
        </h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="text-xs bg-brand-900 text-white px-3 py-1.5"
        >
          {showCreate ? "Отмена" : "+ Создать"}
        </button>
      </div>
      <p className="text-[10px] text-brand-400 mb-4">
        Бренды создаются автоматически при загрузке товаров из Excel или вручную.
      </p>

      {/* Create brand form */}
      {showCreate && (
        <div className="bg-brand-50 border border-brand-200 p-3 mb-4 space-y-2">
          <p className="text-xs font-medium text-brand-700">Новый бренд</p>
          {availableProductBrands.length > 0 && (
            <select
              value=""
              onChange={(e) => setNewBrandName(e.target.value)}
              className="w-full h-9 px-2 bg-white border border-brand-100 text-sm outline-none"
            >
              <option value="">Выбрать из товаров...</option>
              {availableProductBrands.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          )}
          <input
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
            placeholder="Или введите название..."
            className="w-full h-9 px-2 bg-white border border-brand-100 text-sm outline-none focus:border-brand-300"
          />
          {newBrandName.trim() && (
            <p className="text-[10px] text-brand-400">Slug: /{toSlug(newBrandName)}</p>
          )}
          <button
            onClick={handleCreateBrand}
            disabled={!newBrandName.trim() || existingNames.has(newBrandName.trim().toLowerCase())}
            className="w-full h-9 bg-brand-900 text-white text-xs disabled:opacity-40"
          >
            Создать бренд
          </button>
          {existingNames.has(newBrandName.trim().toLowerCase()) && newBrandName.trim() && (
            <p className="text-[10px] text-red-500">Бренд с таким названием уже существует</p>
          )}
        </div>
      )}

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
          Брендов пока нет. Загрузите товары из Excel или создайте вручную.
        </div>
      )}
    </div>
  );
}
