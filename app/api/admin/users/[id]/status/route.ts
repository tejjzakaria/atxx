import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";

type Ctx = { params: Promise<{ id: string }> };

/* ── PATCH /api/admin/users/[id]/status — suspend/reactivate a user ──────── */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { status } = await req.json().catch(() => ({}));
  if (status !== "active" && status !== "suspended") {
    return NextResponse.json({ error: 'status must be "active" or "suspended"' }, { status: 400 });
  }

  if (status === "suspended" && id === session.user.id) {
    return NextResponse.json({ error: "You can't suspend your own account" }, { status: 400 });
  }

  const db  = getDb();
  const oid = new ObjectId(id);
  const user = await db.collection("User").findOne({ _id: oid });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.collection("User").updateOne({ _id: oid }, { $set: { status, updatedAt: new Date() } });

  return NextResponse.json({ ok: true, status });
}
