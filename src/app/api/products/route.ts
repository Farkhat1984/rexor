import { NextRequest, NextResponse } from "next/server";
import { getDb, serializeProduct, deserializeProduct } from "@/lib/db";

export function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM products ORDER BY rowid DESC").all();
  const products = rows.map((r) => deserializeProduct(r as Record<string, unknown>));
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = getDb();
  const items = Array.isArray(body) ? body : [body];

  const upsert = db.prepare(`
    INSERT INTO products (id, barcode, sku, country, brand, name, gender,
      strapColor, dialColor, caseSize, waterResistance, glass, caseShape,
      indicators, timeDisplay, features, mechanism, strapMaterial, caseMaterial,
      weight, kit, pairing, energySource, description, stock, purchasePrice,
      costPrice, retailPrice, images, isNew, isHit, showOnMain, discount)
    VALUES (@id, @barcode, @sku, @country, @brand, @name, @gender,
      @strapColor, @dialColor, @caseSize, @waterResistance, @glass, @caseShape,
      @indicators, @timeDisplay, @features, @mechanism, @strapMaterial, @caseMaterial,
      @weight, @kit, @pairing, @energySource, @description, @stock, @purchasePrice,
      @costPrice, @retailPrice, @images, @isNew, @isHit, @showOnMain, @discount)
    ON CONFLICT(sku) DO UPDATE SET
      barcode=excluded.barcode, country=excluded.country, brand=excluded.brand,
      name=excluded.name, gender=excluded.gender, strapColor=excluded.strapColor,
      dialColor=excluded.dialColor, caseSize=excluded.caseSize,
      waterResistance=excluded.waterResistance, glass=excluded.glass,
      caseShape=excluded.caseShape, indicators=excluded.indicators,
      timeDisplay=excluded.timeDisplay, features=excluded.features,
      mechanism=excluded.mechanism, strapMaterial=excluded.strapMaterial,
      caseMaterial=excluded.caseMaterial, weight=excluded.weight,
      kit=excluded.kit, pairing=excluded.pairing, energySource=excluded.energySource,
      description=excluded.description, stock=excluded.stock,
      purchasePrice=excluded.purchasePrice, costPrice=excluded.costPrice,
      retailPrice=excluded.retailPrice, discount=excluded.discount,
      images=CASE WHEN length(products.images) > 2 THEN products.images ELSE excluded.images END
  `);

  const insertMany = db.transaction((products: Record<string, unknown>[]) => {
    for (const p of products) {
      upsert.run(p);
    }
  });

  insertMany(items.map(serializeProduct));

  const rows = db.prepare("SELECT * FROM products ORDER BY rowid DESC").all();
  const products = rows.map((r) => deserializeProduct(r as Record<string, unknown>));
  return NextResponse.json(products);
}
