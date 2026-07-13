import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";

type Ctx = { params: Promise<{ id: string }> };

/* ── DELETE /api/admin/users/[id] — remove an account ─────────────────────── */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (id === session.user.id) {
    return NextResponse.json({ error: "You can't delete your own account" }, { status: 400 });
  }

  const db  = getDb();
  const oid = new ObjectId(id);
  const user = await db.collection("User").findOne({ _id: oid });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const storeCount = await db.collection("Store").countDocuments({ ownerId: oid });
  if (storeCount > 0) {
    return NextResponse.json(
      { error: `This user still owns ${storeCount} store${storeCount === 1 ? "" : "s"} — reassign or delete those first` },
      { status: 400 },
    );
  }

  if ((user.role ?? "owner") === "admin") {
    const adminCount = await db.collection("User").countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Can't delete the last remaining admin" }, { status: 400 });
    }
  }

  await db.collection("User").deleteOne({ _id: oid });

  return NextResponse.json({ ok: true });
}
