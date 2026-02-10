"use client";

import { useState, useRef, useEffect } from "react";
import { useBrandsStore } from "@/store/brands";
import { IconPlus, IconTrash } from "@/components/Icons";

export default function AdminBrandsPage() {
  const { brands, addBrand, removeBrand, updateBrand, fetchBrands } = useBrandsStore();
  useEffect(() => { fetchBrands(); }, [fetchBrands]);
  const [newName, setNewName] = useState("");
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function handleAdd() {
    if (!newName.trim()) return;
    addBrand(newName.trim());
    setNewName("");
  }

  function handleImageUpload(brandId: string, file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      updateBrand(brandId, { image: result });
    };
    reader.readAsDataURL(file);
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

      <div className="space-y-2">
        {brands.map((brand) => (
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
    </div>
  );
}
