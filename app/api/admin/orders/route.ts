import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";

/* ── GET /api/admin/orders — every order across every store ──────────────── */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();
  const params = req.nextUrl.searchParams;
  const storeId       = params.get("storeId");
  const status         = params.get("status");
  const paymentMethod = params.get("paymentMethod");
  const dateFrom       = params.get("dateFrom");
  const dateTo         = params.get("dateTo");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  if (storeId && ObjectId.isValid(storeId)) filter.storeId = new ObjectId(storeId);
  if (status)        filter.status        = status;
  if (paymentMethod) filter.paymentMethod = paymentMethod;
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo)   filter.createdAt.$lte = new Date(`${dateTo}T23:59:59.999Z`);
  }

  const orders = await db.collection("Order").find(filter).sort({ createdAt: -1 }).limit(500).toArray();

  const storeIds = [...new Set(orders.map(o => o.storeId?.toString()).filter(Boolean))];
  const stores = await db.collection("Store")
    .find({ _id: { $in: storeIds.map(id => new ObjectId(id)) } })
    .project({ name: 1, color: 1 })
    .toArray();
  const storeMap = new Map(stores.map(s => [s._id.toString(), s]));

  return NextResponse.json(
    orders.map(o => ({
      id:            o._id.toString(),
      storeId:       o.storeId?.toString() ?? "",
      storeName:     storeMap.get(o.storeId?.toString())?.name ?? "Unknown",
      storeColor:    storeMap.get(o.storeId?.toString())?.color ?? "#0d9488",
      orderNumber:   o.orderNumber ?? "",
      customerName:  o.customerName ?? o.customer ?? "",
      total:         o.total ?? o.amount ?? 0,
      status:        o.status,
      paymentMethod: o.paymentMethod ?? "",
      createdAt:     o.createdAt,
    })),
  );
}
