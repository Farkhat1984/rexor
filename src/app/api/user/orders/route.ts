import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const orders = db
    .prepare("SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC")
    .all(session.user.userId)
    .map((o: any) => ({ ...o, items: JSON.parse(o.items || "[]") }));

  return NextResponse.json({ orders });
}
