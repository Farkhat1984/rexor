import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const data = await req.json();
  const db = getDb();
  const now = new Date().toISOString();

  if (data.status) {
    const updateOrder = db.transaction(() => {
      db.prepare("UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?").run(data.status, now, id);

      if (data.status === "confirmed") {
        const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as any;
        if (order) {
          db.prepare(`
            UPDATE customers SET totalSpent = totalSpent + ?
            WHERE contactType = ? AND LOWER(contactValue) = ?
          `).run(order.total, order.contactType, order.contactValue.toLowerCase());
        }
      }

      if (data.status === "rejected") {
        const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as any;
        if (order) {
          const items = JSON.parse(order.items || "[]");
          for (const item of items) {
            db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?").run(item.quantity, item.productId);
          }
        }
      }
    });
    updateOrder();
  }

  if (data.note !== undefined) {
    db.prepare("UPDATE orders SET note = ?, updatedAt = ? WHERE id = ?").run(data.note, now, id);
  }

  return NextResponse.json({ ok: true });
}
