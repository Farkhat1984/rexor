import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const r of rows) settings[r.key] = r.value;
  return NextResponse.json({
    telegramUsername: settings.telegramUsername || "rexor_watches",
    whatsappPhone: settings.whatsappPhone || "77001234567",
  });
}

export async function PUT(req: NextRequest) {
  const data = await req.json();
  const db = getDb();

  const upsert = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
  if (data.telegramUsername !== undefined) upsert.run("telegramUsername", data.telegramUsername);
  if (data.whatsappPhone !== undefined) upsert.run("whatsappPhone", data.whatsappPhone);

  return NextResponse.json({ ok: true });
}
