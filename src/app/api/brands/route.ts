import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export function GET() {
  const db = getDb();
  const brands = db.prepare("SELECT * FROM brands ORDER BY name COLLATE NOCASE ASC").all();
  return NextResponse.json(brands, {
    headers: { "Cache-Control": "no-cache" },
  });
}
