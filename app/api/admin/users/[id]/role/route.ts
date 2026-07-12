import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import type { Role } from "@/lib/auth/role";

type Ctx = { params: Promise<{ id: string }> };

/* ── PATCH /api/admin/users/[id]/role — promote/demote a user ────────────── */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { role } = await req.json().catch(() => ({}));
  if (role !== "owner" && role !== "admin") {
    return NextResponse.json({ error: "role must be \"owner\" or \"admin\"" }, { status: 400 });
  }

  const db   = getDb();
  const oid  = new ObjectId(id);
  const user = await db.collection("User").findOne({ _id: oid });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const currentRole: Role = user.role ?? "owner";

  if (currentRole === "admin" && role === "owner") {
    const adminCount = await db.collection("User").countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Can't demote the last remaining admin" }, { status: 400 });
    }
  }

  await db.collection("User").updateOne({ _id: oid }, { $set: { role, updatedAt: new Date() } });

  return NextResponse.json({ ok: true, role });
}
