import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";

/* ── GET /api/admin/users — list every user + their store count ──────────── */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();
  const users = await db.collection("User")
    .find({})
    .project({ name: 1, email: 1, role: 1, status: 1, createdAt: 1, lastLoginAt: 1 })
    .sort({ createdAt: -1 })
    .toArray();

  const storeCounts = await db.collection("Store")
    .aggregate([{ $group: { _id: "$ownerId", count: { $sum: 1 } } }])
    .toArray();
  const countMap = new Map(storeCounts.map(c => [c._id?.toString(), c.count]));

  return NextResponse.json(
    users.map(u => ({
      _id:         u._id.toString(),
      name:        u.name ?? "",
      email:       u.email,
      role:        u.role ?? "owner",
      status:      u.status ?? "active",
      lastLoginAt: u.lastLoginAt ?? null,
      storeCount:  countMap.get(u._id.toString()) ?? 0,
    })),
  );
}
