import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const db = getDb();
  const orders = db.prepare(`
    SELECT o.*, u.name AS userName, u.email AS userEmail
    FROM orders o
    LEFT JOIN users u ON o.userId = u.id
    ORDER BY o.createdAt DESC
  `).all()
    .map((o: any) => ({ ...o, items: JSON.parse(o.items || "[]") }));
  const customers = db.prepare("SELECT * FROM customers ORDER BY lastOrderAt DESC").all();
  return NextResponse.json({ orders, customers });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { items, total, userId, contactType, contactValue } = body;
  const db = getDb();
  const now = new Date().toISOString();
  const id = String(Date.now());

  const createOrder = db.transaction(() => {
    // Insert order with userId if provided, otherwise with contact info (backward compat)
    db.prepare(`
      INSERT INTO orders (id, items, total, status, contactType, contactValue, userId, createdAt, updatedAt)
      VALUES (?, ?, ?, 'new', ?, ?, ?, ?, ?)
    `).run(id, JSON.stringify(items), total, contactType || "", (contactValue || "").trim(), userId || "", now, now);

    // Only upsert customer if contact info provided (legacy flow)
    if (contactValue) {
      const trimmed = contactValue.trim();
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
