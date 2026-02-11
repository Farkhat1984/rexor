"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useBrandsStore } from "@/store/brands";
import { IconPlus, IconTrash, IconSearch } from "@/components/Icons";
import { convertToWebP } from "@/lib/imageUtils";

const PER_PAGE = 20;

export default function AdminBrandsPage() {
  const { brands, addBrand, removeBrand, updateBrand, fetchBrands } = useBrandsStore();
  useEffect(() => { fetchBrands(true); }, [fetchBrands]);
  const [newName, setNewName] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q));
  }, [brands, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function handleAdd() {
    if (!newName.trim()) return;
    addBrand(newName.trim());
    setNewName("");
  }

  async function handleImageUpload(brandId: string, file: File) {
    const webp = await convertToWebP(file, 400, 0.85);
    updateBrand(brandId, { image: webp });
  }

  return (
    <div>
      <h2 className="font-heading text-lg text-brand-900 mb-4">
        Бренды ({brands.length})
      </h2>

      <div className="flex gap-2 mb-4">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Название бренда"
          className="flex-1 h-10 px-3 bg-brand-50 border border-brand-100 text-sm outline-none focus:border-brand-300"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button
          onClick={handleAdd}
          className="h-10 px-4 bg-brand-900 text-white text-xs flex items-center gap-1"
        >
          <IconPlus className="w-3.5 h-3.5" />
          Добавить
        </button>
      </div>

      {brands.length > 5 && (
        <div className="relative mb-4">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Поиск бренда..."
            className="w-full h-10 pl-9 pr-4 bg-brand-50 border border-brand-100 text-sm outline-none focus:border-brand-300"
          />
        </div>
      )}

      <div className="space-y-2">
        {paginated.map((brand) => (
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
                <input
                  value={brand.name}
                  onChange={(e) =>
                    updateBrand(brand.id, { name: e.target.value })
                  }
                  className="w-full text-sm font-medium text-brand-900 bg-transparent outline-none border-b border-transparent focus:border-brand-300"
                />
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 py-5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center text-sm text-brand-700 border border-brand-200 bg-white disabled:opacity-30"
          >
            &lsaquo;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((pg) => pg === 1 || pg === totalPages || Math.abs(pg - page) <= 2)
            .map((pg, idx, arr) => (
              <span key={pg} className="contents">
                {idx > 0 && arr[idx - 1] !== pg - 1 && (
                  <span className="text-brand-300 text-xs px-1">&hellip;</span>
                )}
                <button
                  onClick={() => setPage(pg)}
                  className={`w-8 h-8 flex items-center justify-center text-xs border ${
                    pg === page ? "bg-brand-900 text-white border-brand-900" : "text-brand-700 border-brand-200 bg-white"
                  }`}
                >
                  {pg}
                </button>
              </span>
            ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-8 h-8 flex items-center justify-center text-sm text-brand-700 border border-brand-200 bg-white disabled:opacity-30"
          >
            &rsaquo;
          </button>
        </div>
      )}
    </div>
  );
}
