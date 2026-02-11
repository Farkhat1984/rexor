import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export function GET() {
  const db = getDb();
  const brands = db.prepare("SELECT * FROM brands ORDER BY rowid").all();
  return NextResponse.json(brands, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { name } = await req.json();
  const db = getDb();
  const id = String(Date.now());
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  db.prepare("INSERT INTO brands (id, name, slug, image) VALUES (?, ?, ?, '')").run(id, name, slug);
  const brands = db.prepare("SELECT * FROM brands ORDER BY rowid").all();
  return NextResponse.json(brands);
}
