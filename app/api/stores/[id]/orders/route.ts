import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { appendOrderRow, updateOrderStatus } from "@/lib/sheets";
import { sendMetaPurchaseEvent } from "@/lib/meta-capi";

type Ctx = { params: Promise<{ id: string }> };

/* ── Shared: resolve store by session OR API key ─────────────────────── */
async function resolveStore(req: NextRequest, id: string) {
  if (!ObjectId.isValid(id)) return null;

  const db  = getDb();
  const oid = new ObjectId(id);

  // Try API key first (Bearer token)
  const auth_header = req.headers.get("authorization") ?? "";
  if (auth_header.startsWith("Bearer ")) {
    const token = auth_header.slice(7).trim();
    const store = await db.collection("Store").findOne({ _id: oid, apiKey: token });
    return store ?? null;
  }

  // Fall back to session auth
  const session = await auth();
  if (!session?.user?.id) return null;

  const store = await db.collection("Store").findOne({
    _id: oid,
    ownerId: new ObjectId(session.user.id),
  });
  return store ?? null;
}

/* ── GET /api/stores/[id]/orders ─────────────────────────────────────── */
export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const db  = getDb();
  const oid = new ObjectId(id);

  // Ensure session owns this store
  const store = await db.collection("Store").findOne({ _id: oid, ownerId: new ObjectId(session.user.id) });
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const orders = await db
    .collection("Order")
    .find({ storeId: oid })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json(
    orders.map(o => ({
      _id:             o._id.toString(),
      storeId:         o.storeId.toString(),
      orderNumber:     o.orderNumber     ?? "",
      customerName:    o.customerName    ?? o.customer ?? "",
      customerPhone:   o.customerPhone   ?? "",
      customerAddress: o.customerAddress ?? "",
      items:           o.items           ?? [],
      subtotal:        o.subtotal        ?? o.amount ?? 0,
      savings:         o.savings         ?? 0,
      total:           o.total           ?? o.amount ?? 0,
      status:          o.status,
      paymentMethod:   o.paymentMethod   ?? "",
      createdAt:       o.createdAt,
      updatedAt:       o.updatedAt       ?? o.createdAt,
    }))
  );
}

/* ── POST /api/stores/[id]/orders ────────────────────────────────────── */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const store = await resolveStore(req, id);
  if (!store) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const {
    orderNumber,
    customerName,
    customerPhone,
    customerAddress,
    items,
    subtotal,
    savings = 0,
    total,
    status = "pending",
    paymentMethod = "",
    eventId,
    fbp,
    fbc,
  } = body;

  // Basic validation
  if (!orderNumber || !customerName || !items?.length || total == null) {
    return NextResponse.json(
      { error: "orderNumber, customerName, items and total are required" },
      { status: 400 }
    );
  }

  const db  = getDb();
  const now = new Date();
  const oid = new ObjectId(id);

  const result = await db.collection("Order").insertOne({
    _id:             new ObjectId(),
    storeId:         oid,
    orderNumber:     String(orderNumber),
    customerName:    String(customerName),
    customerPhone:   String(customerPhone ?? ""),
    customerAddress: String(customerAddress ?? ""),
    items:           items,
    subtotal:        Number(subtotal ?? total),
    savings:         Number(savings),
    total:           Number(total),
    status:          status,
    paymentMethod:   String(paymentMethod),
    createdAt:       now,
    updatedAt:       now,
  });

  // Bump store order count
  await db.collection("Store").updateOne(
    { _id: oid },
    { $inc: { orders: 1 }, $set: { updatedAt: now } }
  );

  // Sync to Google Sheets if configured (fire-and-forget, never block the response)
  if (store.sheetsId) {
    appendOrderRow(store.sheetsId, {
      orderNumber:     String(orderNumber),
      createdAt:       now,
      customerName:    String(customerName),
      customerPhone:   String(customerPhone ?? ""),
      customerAddress: String(customerAddress ?? ""),
      items:           items,
      subtotal:        Number(subtotal ?? total),
      savings:         Number(savings),
      total:           Number(total),
      status,
      paymentMethod:   String(paymentMethod),
    }).catch(err => console.error("[sheets] append failed:", err));
  }

  // Server-side Meta Conversions API — fire-and-forget, deduped against the
  // browser pixel's Purchase event via the shared eventId when the storefront sends one.
  if (store.pixels?.metaPixelId && store.pixels?.metaAccessToken) {
    const forwardedFor = req.headers.get("x-forwarded-for");
    sendMetaPurchaseEvent({
      pixelId:        store.pixels.metaPixelId,
      accessToken:    store.pixels.metaAccessToken,
      testEventCode:  store.pixels.metaTestEventCode || undefined,
      eventId:        String(eventId ?? orderNumber),
      eventSourceUrl: store.url,
      value:          Number(total),
      currency:       store.currency || "MAD",
      orderNumber:    String(orderNumber),
      customerPhone:  customerPhone ? String(customerPhone) : undefined,
      clientIp:       forwardedFor ? forwardedFor.split(",")[0].trim() : undefined,
      userAgent:      req.headers.get("user-agent") ?? undefined,
      fbp:            fbp ? String(fbp) : undefined,
      fbc:            fbc ? String(fbc) : undefined,
    }).catch(err => console.error("[meta-capi] purchase event failed:", err));
  }

  return NextResponse.json({ id: result.insertedId.toString() }, { status: 201 });
}

/* ── PATCH /api/stores/[id]/orders ───────────────────────────────────── */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const store = await resolveStore(req, id);
  if (!store) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId, status } = await req.json();
  if (!orderId || !status) {
    return NextResponse.json({ error: "orderId and status are required" }, { status: 400 });
  }

  if (!ObjectId.isValid(orderId)) {
    return NextResponse.json({ error: "Invalid orderId" }, { status: 400 });
  }

  const db  = getDb();
  const now = new Date();
  const oid = new ObjectId(id);

  const result = await db.collection("Order").findOneAndUpdate(
    { _id: new ObjectId(orderId), storeId: oid },
    { $set: { status, updatedAt: now } },
    { returnDocument: "after" }
  );

  if (!result) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Sync status update to Google Sheets
  if (store.sheetsId && result.orderNumber) {
    updateOrderStatus(store.sheetsId, result.orderNumber, status)
      .catch(err => console.error("[sheets] status update failed:", err));
  }

  return NextResponse.json({ ok: true });
}
