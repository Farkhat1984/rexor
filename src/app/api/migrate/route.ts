import { NextRequest, NextResponse } from "next/server";
import { getDb, serializeProduct } from "@/lib/db";

export async function POST(req: NextRequest) {
  const data = await req.json();
  const db = getDb();

  const migrate = db.transaction(() => {
    // Products
    if (data["rexor-products"]?.state?.products) {
      const upsert = db.prepare(`
        INSERT OR REPLACE INTO products (id, barcode, sku, country, brand, name, gender,
          strapColor, dialColor, caseSize, waterResistance, glass, caseShape,
          indicators, timeDisplay, features, mechanism, strapMaterial, caseMaterial,
          weight, kit, pairing, energySource, description, stock, purchasePrice,
          costPrice, retailPrice, images, isNew, isHit, showOnMain, discount)
        VALUES (@id, @barcode, @sku, @country, @brand, @name, @gender,
          @strapColor, @dialColor, @caseSize, @waterResistance, @glass, @caseShape,
          @indicators, @timeDisplay, @features, @mechanism, @strapMaterial, @caseMaterial,
          @weight, @kit, @pairing, @energySource, @description, @stock, @purchasePrice,
          @costPrice, @retailPrice, @images, @isNew, @isHit, @showOnMain, @discount)
      `);
      for (const p of data["rexor-products"].state.products) {
        upsert.run(serializeProduct(p));
      }
    }

    // Orders
    if (data["rexor-orders"]?.state?.orders) {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO orders (id, items, total, status, contactType, contactValue, note, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const o of data["rexor-orders"].state.orders) {
        stmt.run(o.id, JSON.stringify(o.items), o.total, o.status, o.contactType, o.contactValue, o.note || null, o.createdAt, o.updatedAt);
      }
    }

    // Customers
    if (data["rexor-orders"]?.state?.customers) {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO customers (id, contactType, contactValue, ordersCount, totalSpent, firstOrderAt, lastOrderAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const c of data["rexor-orders"].state.customers) {
        stmt.run(c.id, c.contactType, c.contactValue, c.ordersCount, c.totalSpent, c.firstOrderAt, c.lastOrderAt);
      }
    }

    // Brands
    if (data["rexor-brands"]?.state?.brands) {
      const stmt = db.prepare("INSERT OR IGNORE INTO brands (id, name, slug, image) VALUES (?, ?, ?, ?)");
      for (const b of data["rexor-brands"].state.brands) {
        stmt.run(b.id, b.name, b.slug, b.image || "");
      }
    }

    // Banners
    if (data["rexor-banners"]?.state?.banners) {
      const stmt = db.prepare("INSERT OR IGNORE INTO banners (id, image, link, active) VALUES (?, ?, ?, ?)");
      for (const b of data["rexor-banners"].state.banners) {
        stmt.run(b.id, b.image, b.link, b.active ? 1 : 0);
      }
    }

    // Settings
    if (data["rexor-settings"]?.state) {
      const s = data["rexor-settings"].state;
      const upsert = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
      if (s.telegramUsername) upsert.run("telegramUsername", s.telegramUsername);
      if (s.whatsappPhone) upsert.run("whatsappPhone", s.whatsappPhone);
    }
  });

  migrate();
  return NextResponse.json({ ok: true });
}
