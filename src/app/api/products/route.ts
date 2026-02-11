import { NextRequest, NextResponse } from "next/server";
import { getDb, serializeProduct, deserializeProduct } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

const PRODUCT_COLUMNS_NO_IMAGES = `id, barcode, sku, country, brand, name, gender,
  strapColor, dialColor, caseSize, waterResistance, glass, caseShape,
  indicators, timeDisplay, features, mechanism, strapMaterial, caseMaterial,
  weight, kit, pairing, energySource, description, stock, purchasePrice,
  costPrice, retailPrice, isNew, isHit, showOnMain, discount`;

const CACHE_SHORT = { "Cache-Control": "public, max-age=10, stale-while-revalidate=30" };

export function GET(req: NextRequest) {
  const url = req.nextUrl;
  const pageParam = url.searchParams.get("page");

  const db = getDb();

  // Legacy mode: return all products (no images for list)
  if (!pageParam) {
    const rows = db.prepare(`SELECT ${PRODUCT_COLUMNS_NO_IMAGES} FROM products ORDER BY rowid DESC`).all();
    const products = rows.map((r) => {
      const p = deserializeProduct({ ...(r as Record<string, unknown>), images: "[]" });
      return p;
    });
    return NextResponse.json(products, { headers: CACHE_SHORT });
  }

  // Paginated mode
  const page = Math.max(1, Number(pageParam) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 10));
  const offset = (page - 1) * limit;

  const search = (url.searchParams.get("search") || "").trim();
  const brandParam = url.searchParams.get("brand");
  const genderParam = url.searchParams.get("gender");
  const mechanismParam = url.searchParams.get("mechanism");
  const caseShapeParam = url.searchParams.get("caseShape");
  const priceMin = Number(url.searchParams.get("priceMin")) || 0;
  const priceMax = Number(url.searchParams.get("priceMax")) || 0;
  const sort = url.searchParams.get("sort") || "";
  const inStock = url.searchParams.get("inStock") === "true";
  const countOnly = url.searchParams.get("countOnly") === "true";

  const showOnMainParam = url.searchParams.get("showOnMain");
  const isNewParam = url.searchParams.get("isNew");
  const isHitParam = url.searchParams.get("isHit");

  // Build WHERE clause
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (inStock) conditions.push("stock > 0");

  if (showOnMainParam === "true") conditions.push("showOnMain = 1");
  else if (showOnMainParam === "false") conditions.push("showOnMain = 0");

  if (isNewParam === "true") conditions.push("isNew = 1");
  else if (isNewParam === "false") conditions.push("isNew = 0");

  if (isHitParam === "true") conditions.push("isHit = 1");
  else if (isHitParam === "false") conditions.push("isHit = 0");

  if (search.length >= 2) {
    conditions.push("(LOWER(sku) LIKE ? OR LOWER(name) LIKE ? OR LOWER(brand) LIKE ?)");
    const q = `%${search.toLowerCase()}%`;
    params.push(q, q, q);
  }

  if (brandParam) {
    const brands = brandParam.split(",").filter(Boolean);
    if (brands.length) {
      conditions.push(`brand IN (${brands.map(() => "?").join(",")})`);
      params.push(...brands);
    }
  }

  if (genderParam) {
    const genders = genderParam.split(",").filter(Boolean);
    if (genders.length) {
      conditions.push(`gender IN (${genders.map(() => "?").join(",")})`);
      params.push(...genders);
    }
  }

  if (mechanismParam) {
    const mechanisms = mechanismParam.split(",").filter(Boolean);
    if (mechanisms.length) {
      conditions.push(`mechanism IN (${mechanisms.map(() => "?").join(",")})`);
      params.push(...mechanisms);
    }
  }

  if (caseShapeParam) {
    const shapes = caseShapeParam.split(",").filter(Boolean);
    if (shapes.length) {
      conditions.push(`caseShape IN (${shapes.map(() => "?").join(",")})`);
      params.push(...shapes);
    }
  }

  if (priceMin > 0) {
    conditions.push("retailPrice >= ?");
    params.push(priceMin);
  }

  if (priceMax > 0) {
    conditions.push("retailPrice <= ?");
    params.push(priceMax);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  // Sort
  let orderBy = "ORDER BY rowid DESC";
  switch (sort) {
    case "popular": orderBy = "ORDER BY isHit DESC, rowid DESC"; break;
    case "price_asc": orderBy = "ORDER BY retailPrice ASC"; break;
    case "price_desc": orderBy = "ORDER BY retailPrice DESC"; break;
    case "new": orderBy = "ORDER BY isNew DESC, rowid DESC"; break;
    case "discount": orderBy = "ORDER BY discount DESC, rowid DESC"; break;
    case "name_asc": orderBy = "ORDER BY name COLLATE NOCASE ASC"; break;
    case "name_desc": orderBy = "ORDER BY name COLLATE NOCASE DESC"; break;
  }

  // Count total (filtered)
  const countRow = db.prepare(`SELECT COUNT(*) as total FROM products ${whereClause}`).get(...params) as { total: number };
  const total = countRow.total;

  // Count-only mode (for filter previews)
  if (countOnly) {
    return NextResponse.json({ total }, { headers: CACHE_SHORT });
  }

  // Get paginated products WITHOUT images (avoids loading 27+ MB of base64 from disk)
  const rows = db.prepare(
    `SELECT ${PRODUCT_COLUMNS_NO_IMAGES} FROM products ${whereClause} ${orderBy} LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);

  // Load only first image for the visible products (small targeted query)
  const ids = rows.map((r) => (r as Record<string, unknown>).id as string);
  const firstImages: Record<string, string> = {};
  if (ids.length > 0) {
    const placeholders = ids.map(() => "?").join(",");
    const imgRows = db.prepare(
      `SELECT id, images FROM products WHERE id IN (${placeholders}) AND images != '[]'`
    ).all(...ids) as { id: string; images: string }[];
    for (const row of imgRows) {
      try {
        const arr = JSON.parse(row.images);
        if (arr.length > 0) firstImages[row.id] = arr[0];
      } catch {}
    }
  }

  const products = rows.map((r) => {
    const raw = r as Record<string, unknown>;
    const id = raw.id as string;
    const p = deserializeProduct({ ...raw, images: firstImages[id] ? JSON.stringify([firstImages[id]]) : "[]" });
    return p;
  });

  // Filter options (from all products matching base stock filter, not current filters)
  const stockCond = inStock ? "WHERE stock > 0" : "WHERE 1=1";
  const filterOptions = {
    brands: (db.prepare(`SELECT DISTINCT brand FROM products ${stockCond} AND brand != '' ORDER BY brand`).all() as { brand: string }[]).map(r => r.brand),
    genders: (db.prepare(`SELECT DISTINCT gender FROM products ${stockCond} AND gender != '' ORDER BY gender`).all() as { gender: string }[]).map(r => r.gender),
    mechanisms: (db.prepare(`SELECT DISTINCT mechanism FROM products ${stockCond} AND mechanism != '' ORDER BY mechanism`).all() as { mechanism: string }[]).map(r => r.mechanism),
    caseShapes: (db.prepare(`SELECT DISTINCT caseShape FROM products ${stockCond} AND caseShape != '' ORDER BY caseShape`).all() as { caseShape: string }[]).map(r => r.caseShape),
    priceRange: db.prepare(`SELECT COALESCE(MIN(retailPrice), 0) as min, COALESCE(MAX(retailPrice), 999999) as max FROM products ${stockCond}`).get() as { min: number; max: number },
  };

  // Stats for admin
  const stats = {
    totalAll: (db.prepare("SELECT COUNT(*) as c FROM products").get() as { c: number }).c,
    totalStock: (db.prepare("SELECT COALESCE(SUM(stock), 0) as s FROM products").get() as { s: number }).s,
    totalRetail: (db.prepare("SELECT COALESCE(SUM(retailPrice * stock), 0) as s FROM products").get() as { s: number }).s,
  };

  return NextResponse.json({ products, total, filterOptions, stats }, { headers: CACHE_SHORT });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
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

  return NextResponse.json({ ok: true, count: items.length });
}
