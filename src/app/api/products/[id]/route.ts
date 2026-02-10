import { NextRequest, NextResponse } from "next/server";
import { getDb, deserializeProduct } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(deserializeProduct(row as Record<string, unknown>));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await req.json();
  const db = getDb();

  const fields = Object.keys(data);
  if (fields.length === 0) return NextResponse.json({ ok: true });

  const setClause = fields.map((f) => `${f} = @${f}`).join(", ");
  const serialized: Record<string, unknown> = { id };

  for (const f of fields) {
    if (f === "images") serialized[f] = JSON.stringify(data[f]);
    else if (["isNew", "isHit", "showOnMain"].includes(f)) serialized[f] = data[f] ? 1 : 0;
    else serialized[f] = data[f];
  }

  db.prepare(`UPDATE products SET ${setClause} WHERE id = @id`).run(serialized);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM products WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
