"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useProductsStore } from "@/store/products";
import { parseExcelFile } from "@/lib/parseExcel";
import { formatPrice } from "@/lib/data";
import { Product } from "@/lib/types";
import { IconPlus, IconTrash, IconSearch } from "@/components/Icons";

const PER_PAGE = 20;

const GENDER_OPTIONS = ["мужской", "женский", "мужские", "женские", "унисекс"];

export default function AdminProductsPage() {
  const { products, addProducts, addProduct, removeProduct, updateProduct, toggleNew, toggleHit, toggleMain, fetchProducts } =
    useProductsStore();
  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const imageRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const brandOptions = useMemo(
    () => [...new Set(products.map((p) => p.brand))].sort(),
    [products]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      if (q && !p.sku.toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q) && !p.name.toLowerCase().includes(q)) return false;
      if (filterGender && !p.gender.toLowerCase().startsWith(filterGender)) return false;
      if (filterBrand && p.brand !== filterBrand) return false;
      return true;
    });
  }, [products, search, filterGender, filterBrand]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseExcelFile(buffer);
      addProducts(parsed);
      setUploadMsg(`Загружено ${parsed.length} товаров из "${file.name}"`);
      setPage(1);
    } catch {
      setUploadMsg("Ошибка при чтении файла");
    }
    e.target.value = "";
  }

  function handleAddManual() {
    const p: Product = {
      id: String(Date.now()),
      barcode: "",
      sku: "NEW-" + Date.now(),
      country: "",
      brand: "",
      name: "Новый товар",
      gender: "мужской",
      strapColor: "",
      dialColor: "",
      caseSize: "",
      waterResistance: "",
      glass: "",
      caseShape: "",
      indicators: "",
      timeDisplay: "",
      features: "",
      mechanism: "кварц",
      strapMaterial: "",
      caseMaterial: "",
      weight: "",
      kit: "",
      pairing: "",
      energySource: "",
      description: "",
      stock: 0,
      purchasePrice: 0,
      costPrice: 0,
      retailPrice: 0,
      images: [],
    };
    addProduct(p);
    setEditingId(p.id);
    setPage(1);
  }

  function handleImageUpload(productId: string, file: File) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const product = products.find((p) => p.id === productId);
      if (product) {
        updateProduct(productId, { images: [...product.images, result] });
      }
    };
    reader.readAsDataURL(file);
  }

  function removeImage(productId: string, idx: number) {
    const product = products.find((p) => p.id === productId);
    if (product) {
      updateProduct(productId, { images: product.images.filter((_, i) => i !== idx) });
    }
  }

  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const totalRetail = products.reduce((s, p) => s + p.retailPrice * p.stock, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-heading text-lg text-brand-900">
          Склад ({products.length} поз. / {totalStock} шт.)
        </h2>
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-1 bg-brand-900 text-white text-xs px-3 py-2"
          >
            <IconPlus className="w-3.5 h-3.5" />
            Excel
          </button>
          <button
            onClick={handleAddManual}
            className="flex items-center gap-1 border border-brand-200 text-brand-700 text-xs px-3 py-2"
          >
            + Вручную
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-3 text-[11px] text-brand-500">
        <span>Розница на складе: <b className="text-brand-900">{formatPrice(totalRetail)}</b></span>
      </div>

      {showUpload && (
        <div className="mb-4 p-4 bg-brand-50 border border-brand-100">
          <p className="text-sm font-medium text-brand-900 mb-2">Загрузка из Excel</p>
          <p className="text-xs text-brand-500 mb-3">
            Формат: .xlsx/.xls/.csv — колонки: Штрихкод, Артикул, Бренд, Номенклатура, Гендер, Количество, Розничная цена и др.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="block w-full text-xs text-brand-500 file:mr-3 file:py-2 file:px-3 file:border-0 file:text-xs file:bg-brand-900 file:text-white"
          />
          {uploadMsg && <p className="text-xs text-green-700 mt-2">{uploadMsg}</p>}
        </div>
      )}

      {/* Search & filters */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Поиск: артикул, бренд, название..."
            className="w-full h-10 pl-9 pr-4 bg-brand-50 border border-brand-100 text-sm outline-none focus:border-brand-300"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterBrand}
            onChange={(e) => { setFilterBrand(e.target.value); setPage(1); }}
            className="h-8 px-2 bg-brand-50 border border-brand-100 text-xs outline-none"
          >
            <option value="">Все бренды</option>
            {brandOptions.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={filterGender}
            onChange={(e) => { setFilterGender(e.target.value); setPage(1); }}
            className="h-8 px-2 bg-brand-50 border border-brand-100 text-xs outline-none"
          >
            <option value="">Все гендеры</option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          {(search || filterBrand || filterGender) && (
            <button
              onClick={() => { setSearch(""); setFilterBrand(""); setFilterGender(""); setPage(1); }}
              className="text-[10px] text-brand-500 underline"
            >
              Сбросить
            </button>
          )}
        </div>
        <p className="text-[11px] text-brand-400">Найдено: {filtered.length}</p>
      </div>

      {/* Product list */}
      <div className="space-y-2">
        {paginated.map((p) => (
          <div key={p.id} className="bg-brand-50 border border-brand-100 p-3">
            <div className="flex gap-3">
              <div
                className="w-14 h-14 bg-white shrink-0 flex items-center justify-center border border-brand-200 cursor-pointer overflow-hidden"
                onClick={() => imageRefs.current[p.id]?.click()}
              >
                {p.images[0] ? (
                  <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[9px] text-brand-400 text-center">+ фото</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={(el) => { imageRefs.current[p.id] = el; }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(p.id, file);
                  e.target.value = "";
                }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] text-brand-500">{p.brand}</p>
                    <p className="text-sm font-medium text-brand-900 line-clamp-1">{p.name || p.sku}</p>
                  </div>
                  <button onClick={() => removeProduct(p.id)} className="text-brand-400 p-1">
                    <IconTrash className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs font-bold text-brand-900">{formatPrice(p.retailPrice)}</span>
                  <span className="text-[10px] text-brand-400">Арт. {p.sku}</span>
                  <span className={`text-[10px] font-medium ${p.stock > 0 ? "text-green-700" : "text-red-600"}`}>
                    Остаток: {p.stock}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-brand-200 flex-wrap">
              <button
                onClick={() => toggleNew(p.id)}
                className={`text-[10px] px-2 py-0.5 border ${p.isNew ? "bg-brand-900 text-white border-brand-900" : "text-brand-500 border-brand-200"}`}
              >
                Новинка
              </button>
              <button
                onClick={() => toggleHit(p.id)}
                className={`text-[10px] px-2 py-0.5 border ${p.isHit ? "bg-brand-900 text-white border-brand-900" : "text-brand-500 border-brand-200"}`}
              >
                Хит
              </button>
              <button
                onClick={() => toggleMain(p.id)}
                className={`text-[10px] px-2 py-0.5 border ${p.showOnMain ? "bg-green-700 text-white border-green-700" : "text-brand-500 border-brand-200"}`}
              >
                На главную
              </button>
              {p.discount && p.discount > 0 ? (
                <span className="text-[10px] text-red-600 font-medium">-{p.discount}%</span>
              ) : null}
              <span className="text-[10px] text-brand-400">
                {p.gender} · {p.mechanism} · {p.caseShape}
              </span>
              <button
                onClick={() => setEditingId(editingId === p.id ? null : p.id)}
                className="text-[10px] text-brand-500 underline ml-auto"
              >
                {editingId === p.id ? "Свернуть" : "Подробнее"}
              </button>
            </div>

            {editingId === p.id && (
              <div className="mt-3 pt-3 border-t border-brand-200 space-y-3">
                {p.images.length > 0 && (
                  <div>
                    <label className="text-[10px] text-brand-400 mb-1 block">Изображения</label>
                    <div className="flex gap-2 flex-wrap">
                      {p.images.map((img, idx) => (
                        <div key={idx} className="relative w-16 h-16 border border-brand-200 overflow-hidden group">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeImage(p.id, idx)}
                            className="absolute inset-0 bg-black/50 text-white text-[10px] opacity-0 group-hover:opacity-100 flex items-center justify-center"
                          >
                            X
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => imageRefs.current[p.id]?.click()}
                        className="w-16 h-16 border border-dashed border-brand-300 text-brand-400 text-xs flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {([
                    ["barcode", "Штрихкод"],
                    ["sku", "Артикул"],
                    ["brand", "Бренд"],
                    ["name", "Номенклатура"],
                    ["country", "Страна"],
                    ["gender", "Гендер"],
                    ["strapColor", "Цвет ремешка"],
                    ["dialColor", "Цвет циферблата"],
                    ["caseSize", "Размер корпуса"],
                    ["waterResistance", "Водозащита"],
                    ["glass", "Стекло"],
                    ["caseShape", "Форма корпуса"],
                    ["indicators", "Индикаторы"],
                    ["timeDisplay", "Отображение"],
                    ["features", "Доп. функции"],
                    ["mechanism", "Механизм"],
                    ["strapMaterial", "Браслет/ремешок"],
                    ["caseMaterial", "Материал корпуса"],
                    ["weight", "Вес"],
                    ["kit", "Комплектация"],
                    ["pairing", "Парность"],
                    ["energySource", "Источник энергии"],
                    ["description", "Описание"],
                  ] as [keyof Product, string][]).map(([key, label]) => (
                    <div key={key}>
                      <label className="text-[10px] text-brand-500">{label}</label>
                      <input
                        value={String(p[key] ?? "")}
                        onChange={(e) => updateProduct(p.id, { [key]: e.target.value })}
                        className="w-full h-8 px-2 bg-white border border-brand-200 text-xs outline-none focus:border-brand-400"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {([
                    ["stock", "Остаток (шт)"],
                    ["retailPrice", "Розничная цена"],
                    ["purchasePrice", "Цена закупа"],
                    ["costPrice", "Себестоимость"],
                    ["discount", "Скидка (%)"],
                  ] as [keyof Product, string][]).map(([key, label]) => (
                    <div key={key}>
                      <label className="text-[10px] text-brand-500">{label}</label>
                      <input
                        type="number"
                        value={Number(p[key]) || 0}
                        onChange={(e) => updateProduct(p.id, { [key]: Number(e.target.value) || 0 })}
                        className="w-full h-8 px-2 bg-white border border-brand-200 text-xs outline-none focus:border-brand-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 py-5">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
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
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="w-8 h-8 flex items-center justify-center text-sm text-brand-700 border border-brand-200 bg-white disabled:opacity-30"
          >
            &rsaquo;
          </button>
        </div>
      )}

      {products.length === 0 && (
        <div className="text-center py-16 text-brand-400 text-sm">
          Товаров пока нет. Загрузите Excel или добавьте вручную.
        </div>
      )}
    </div>
  );
}
