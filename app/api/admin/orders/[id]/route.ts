import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { updateOrderStatus } from "@/lib/sheets";

type Ctx = { params: Promise<{ id: string }> };

/* ── PATCH /api/admin/orders/[id] — update status for any store's order ──── */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { status } = await req.json().catch(() => ({}));
  if (!status) return NextResponse.json({ error: "status is required" }, { status: 400 });

  const db  = getDb();
  const oid = new ObjectId(id);

  const result = await db.collection("Order").findOneAndUpdate(
    { _id: oid },
    { $set: { status, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const store = await db.collection("Store").findOne({ _id: result.storeId });
  if (store?.sheetsId && result.orderNumber) {
    updateOrderStatus(store.sheetsId, result.orderNumber, status)
      .catch(err => console.error("[sheets] status update failed:", err));
  }

  return NextResponse.json({ ok: true });
}
