import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export function GET() {
  const db = getDb();
  const banners = db.prepare("SELECT * FROM banners ORDER BY rowid").all()
    .map((b: any) => ({ ...b, active: !!b.active }));
  return NextResponse.json(banners);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { image, link } = await req.json();
  const db = getDb();
  const id = String(Date.now());
  db.prepare("INSERT INTO banners (id, image, link, active) VALUES (?, ?, ?, 1)").run(id, image, link);
  const banners = db.prepare("SELECT * FROM banners ORDER BY rowid").all()
    .map((b: any) => ({ ...b, active: !!b.active }));
  return NextResponse.json(banners);
}
