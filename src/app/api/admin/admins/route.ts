import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = 'adminEmails'").get() as { value: string } | undefined;
  const emails = row ? row.value.split(",").map((e: string) => e.trim()).filter(Boolean) : [];

  return NextResponse.json({ emails });
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { emails } = await req.json();
  if (!Array.isArray(emails)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const cleaned = emails.map((e: string) => e.trim().toLowerCase()).filter(Boolean);
  const db = getDb();
  db.prepare("INSERT INTO settings (key, value) VALUES ('adminEmails', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .run(cleaned.join(","));

  // Update isAdmin flag for all users based on new admin list
  const envAdmins = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const allAdmins = [...new Set([...envAdmins, ...cleaned])];

  db.prepare("UPDATE users SET isAdmin = 0").run();
  if (allAdmins.length > 0) {
    const placeholders = allAdmins.map(() => "?").join(",");
    db.prepare(`UPDATE users SET isAdmin = 1 WHERE LOWER(email) IN (${placeholders})`).run(...allAdmins);
  }

  return NextResponse.json({ ok: true, emails: cleaned });
}
