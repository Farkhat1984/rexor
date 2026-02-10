import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export function GET() {
  const db = getDb();
  const orders = db.prepare("SELECT * FROM orders ORDER BY createdAt DESC").all()
    .map((o: any) => ({ ...o, items: JSON.parse(o.items || "[]") }));
  const customers = db.prepare("SELECT * FROM customers ORDER BY lastOrderAt DESC").all();
  return NextResponse.json({ orders, customers });
}

export async function POST(req: NextRequest) {
  const { items, total, contactType, contactValue } = await req.json();
  const db = getDb();
  const now = new Date().toISOString();
  const id = String(Date.now());
  const trimmed = (contactValue || "").trim();

  const createOrder = db.transaction(() => {
    // Insert order
    db.prepare(`
      INSERT INTO orders (id, items, total, status, contactType, contactValue, createdAt, updatedAt)
      VALUES (?, ?, ?, 'new', ?, ?, ?, ?)
    `).run(id, JSON.stringify(items), total, contactType, trimmed, now, now);

    // Upsert customer
    const key = trimmed.toLowerCase();
    const existing = db.prepare(
      "SELECT * FROM customers WHERE contactType = ? AND LOWER(contactValue) = ?"
    ).get(contactType, key) as any;

    if (existing) {
      db.prepare(
        "UPDATE customers SET ordersCount = ordersCount + 1, lastOrderAt = ? WHERE id = ?"
      ).run(now, existing.id);
    } else {
      db.prepare(`
        INSERT INTO customers (id, contactType, contactValue, ordersCount, totalSpent, firstOrderAt, lastOrderAt)
        VALUES (?, ?, ?, 1, 0, ?, ?)
      `).run(id + "-c", contactType, trimmed, now, now);
    }

    // Decrement stock for each item
    for (const item of items) {
      db.prepare(
        "UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?"
      ).run(item.quantity, item.productId);
    }
  });

  createOrder();
  return NextResponse.json({ ok: true, id });
}
