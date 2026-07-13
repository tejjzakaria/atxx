import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";

type Ctx = { params: Promise<{ id: string }> };

/* ── PATCH /api/admin/stores/[id]/owner — reassign a store to a different owner ── */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { ownerId } = await req.json().catch(() => ({}));
  if (!ownerId || !ObjectId.isValid(ownerId)) {
    return NextResponse.json({ error: "A valid ownerId is required" }, { status: 400 });
  }

  const db  = getDb();
  const oid = new ObjectId(id);

  const store = await db.collection("Store").findOne({ _id: oid });
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newOwner = await db.collection("User").findOne({ _id: new ObjectId(ownerId) });
  if (!newOwner) return NextResponse.json({ error: "No user found for that id" }, { status: 400 });

  await db.collection("Store").updateOne(
    { _id: oid },
    { $set: { ownerId: new ObjectId(ownerId), updatedAt: new Date() } },
  );

  return NextResponse.json({ ok: true, ownerId, ownerName: newOwner.name ?? "", ownerEmail: newOwner.email ?? "" });
}
