import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

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
  db.prepare(`UPDATE brands SET ${setClause} WHERE id = @id`).run({ ...data, id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM brands WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
