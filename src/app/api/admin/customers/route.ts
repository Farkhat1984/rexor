import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();
  const users = db.prepare(`
    SELECT u.id, u.email, u.name, u.image, u.isAdmin, u.createdAt,
      COUNT(o.id) AS ordersCount,
      COALESCE(SUM(CASE WHEN o.status = 'confirmed' THEN o.total ELSE 0 END), 0) AS totalSpent
    FROM users u
    LEFT JOIN orders o ON o.userId = u.id
    GROUP BY u.id
    ORDER BY u.createdAt DESC
  `).all()
    .map((u: any) => ({ ...u, isAdmin: !!u.isAdmin }));

  return NextResponse.json({ users });
}
