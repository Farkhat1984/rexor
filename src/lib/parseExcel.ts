import * as XLSX from "xlsx";
import { Product } from "./types";

const COL_MAP: Record<string, keyof Product> = {
  "Штрихкод": "barcode",
  "Артикул": "sku",
  "Страна производитель": "country",
  "Бренд": "brand",
  "Номенклатура": "name",
  "Гендер": "gender",
  "Цвет ремешка": "strapColor",
  "Цвет циферблата": "dialColor",
  "Размер корпуса": "caseSize",
  "Водонепроницаемость": "waterResistance",
  "Стекло": "glass",
  "Форма корпуса": "caseShape",
  "Индикаторы": "indicators",
  "Способ отображения времени": "timeDisplay",
  "Дополнительные функции": "features",
  "Механизм": "mechanism",
  "Характеристики браслета": "strapMaterial",
  "Характеристики корпуса": "caseMaterial",
  "Вес": "weight",
  "Комплектация": "kit",
  "Парность": "pairing",
  "Источник энергии": "energySource",
  "Описание": "description",
  "Количество": "stock",
  "Цена закупа": "purchasePrice",
  "Себестоимость с расходами": "costPrice",
  "Розничная цена": "retailPrice",
};

function str(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

function num(val: unknown): number {
  if (val === null || val === undefined) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : Math.round(n);
}

export function parseExcelFile(buffer: ArrayBuffer): Product[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  return rows
    .filter((row) => str(row["Артикул"]))
    .map((row) => {
      const sku = str(row["Артикул"]);
      return {
        id: sku + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        barcode: str(row["Штрихкод"]),
        sku,
        country: str(row["Страна производитель"]),
        brand: str(row["Бренд"]),
        name: str(row["Номенклатура"]),
        gender: str(row["Гендер"]),
        strapColor: str(row["Цвет ремешка"]),
        dialColor: str(row["Цвет циферблата"]),
        caseSize: str(row["Размер корпуса"]),
        waterResistance: str(row["Водонепроницаемость"]),
        glass: str(row["Стекло"]),
        caseShape: str(row["Форма корпуса"]),
        indicators: str(row["Индикаторы"]),
        timeDisplay: str(row["Способ отображения времени"]),
        features: str(row["Дополнительные функции"]),
        mechanism: str(row["Механизм"]),
        strapMaterial: str(row["Характеристики браслета"]),
        caseMaterial: str(row["Характеристики корпуса"]),
        weight: str(row["Вес"]),
        kit: str(row["Комплектация"]),
        pairing: str(row["Парность"]),
        energySource: str(row["Источник энергии"]),
        description: str(row["Описание"]),
        stock: num(row["Количество"]),
        purchasePrice: num(row["Цена закупа"]),
        costPrice: num(row["Себестоимость с расходами"]),
        retailPrice: num(row["Розничная цена"]),
        images: [],
      };
    });
}

export { COL_MAP };
