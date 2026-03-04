import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export function GET() {
  const db = getDb();
  const brands = db.prepare("SELECT * FROM brands ORDER BY name COLLATE NOCASE ASC").all();
  return NextResponse.json(brands, {
    headers: { "Cache-Control": "no-cache" },
  });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const data = await req.json();
  const { id, name, slug, image } = data;
  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
  }
  const db = getDb();
  db.prepare("INSERT INTO brands (id, name, slug, image) VALUES (?, ?, ?, ?)").run(
    id, name, slug, image || ""
  );
  return NextResponse.json({ ok: true });
}
