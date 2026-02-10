"use client";

import { useRef, useState, useEffect } from "react";
import { useBannersStore } from "@/store/banners";
import { IconPlus, IconTrash } from "@/components/Icons";

const MAX_WIDTH = 800;
const QUALITY = 0.7;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width;
      let h = img.height;
      if (w > MAX_WIDTH) {
        h = Math.round(h * (MAX_WIDTH / w));
        w = MAX_WIDTH;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/webp", QUALITY));
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function AdminBannersPage() {
  const { banners, addBanner, removeBanner, toggleActive, updateBanner, fetchBanners } =
    useBannersStore();
  useEffect(() => { fetchBanners(); }, [fetchBanners]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [newLink, setNewLink] = useState("/catalog");

  async function handleAddImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await compressImage(file);
    addBanner(base64, newLink);
    setNewLink("/catalog");
    e.target.value = "";
  }

  function handleReplaceImage(bannerId: string) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const base64 = await compressImage(file);
      updateBanner(bannerId, { image: base64 });
    };
    input.click();
  }

  return (
    <div>
      <h2 className="font-heading text-lg text-brand-900 mb-4">
        Баннеры ({banners.length})
      </h2>

      {/* Add new banner */}
      <div className="bg-brand-50 border border-brand-100 p-3 mb-4">
        <p className="text-xs font-medium text-brand-700 mb-2">Добавить баннер</p>
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-brand-400">Ссылка при клике</label>
            <input
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="/catalog?brand=tissot или /product/123"
              className="w-full text-xs text-brand-900 bg-white border border-brand-200 px-2 py-1.5 outline-none focus:border-brand-400"
            />
            <p className="text-[10px] text-brand-400 mt-0.5">
              Примеры: /catalog?brand=lee-cooper · /product/abc123 · /catalog · https://...
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleAddImage}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 bg-brand-900 text-white text-xs px-3 py-2"
          >
            <IconPlus className="w-3.5 h-3.5" />
            Загрузить креатив
          </button>
        </div>
      </div>

      {/* Banner list */}
      <div className="space-y-3">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="bg-brand-50 border border-brand-100 p-3"
          >
            {/* Preview */}
            <div
              className="relative w-full aspect-[2/1] bg-brand-200 mb-2 cursor-pointer overflow-hidden group"
              onClick={() => handleReplaceImage(banner.id)}
            >
              <img
                src={banner.image}
                alt="Баннер"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs">Заменить картинку</span>
              </div>
            </div>

            {/* Link */}
            <div className="mb-2">
              <label className="text-[10px] text-brand-400">Ссылка при клике</label>
              <input
                value={banner.link}
                onChange={(e) =>
                  updateBanner(banner.id, { link: e.target.value })
                }
                className="w-full text-xs text-brand-900 bg-white border border-brand-200 px-2 py-1.5 outline-none focus:border-brand-400"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-brand-200">
              <button
                onClick={() => toggleActive(banner.id)}
                className={`text-[10px] px-2 py-0.5 border ${
                  banner.active
                    ? "bg-green-700 text-white border-green-700"
                    : "text-brand-500 border-brand-200"
                }`}
              >
                {banner.active ? "Активен" : "Выключен"}
              </button>
              <button
                onClick={() => removeBanner(banner.id)}
                className="text-brand-400 p-1"
              >
                <IconTrash className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {banners.length === 0 && (
        <p className="text-center text-sm text-brand-400 py-8">
          Нет баннеров. Загрузите креатив выше.
        </p>
      )}
    </div>
  );
}
