import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { storeSessionFilter } from "@/lib/db/stores";

type Ctx = { params: Promise<{ id: string; productId: string }> };

/* ── Resolve store: API key OR session ───────────────────────────────── */
async function resolveStore(req: NextRequest, storeId: string) {
  if (!ObjectId.isValid(storeId)) return null;
  const db  = getDb();
  const oid = new ObjectId(storeId);

  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    return await db.collection("Store").findOne({ _id: oid, apiKey: token });
  }

  const session = await auth();
  if (!session?.user?.id) return null;
  return await db.collection("Store").findOne(storeSessionFilter(storeId, session));
}

/* ── Resolve product by ObjectId OR slug ─────────────────────────────── */
async function resolveProduct(storeOid: ObjectId, productId: string) {
  const db = getDb();
  if (ObjectId.isValid(productId)) {
    return db.collection("Product").findOne({ _id: new ObjectId(productId), storeId: storeOid });
  }
  // Fall back to slug lookup
  return db.collection("Product").findOne({ slug: productId, storeId: storeOid });
}

/* ── GET /api/stores/[id]/products/[productId] — public ─────────────── */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id, productId } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const db  = getDb();
  const oid = new ObjectId(id);

  const product = await resolveProduct(oid, productId);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id:            product._id.toString(),
    name:          product.name,
    slug:          product.slug,
    sku:           product.sku,
    category:      product.category,
    price:         product.price,
    originalPrice: product.originalPrice,
    stock:         product.stock,
    sold:          product.sold,
    status:        product.status,
    tag:           product.tag,
    warranty:      product.warranty,
    rating:        product.rating,
    reviews:       product.reviews,
    views:         product.views,
    shortDesc:     product.shortDesc,
    fullDesc:      product.fullDesc,
    images:        product.images          ?? [],
    features:      product.features        ?? [],
    specs:         product.specs           ?? [],
    offers:        product.offers          ?? [],
    customerReviews: product.customerReviews ?? [],
  });
}

/* ── PUT /api/stores/[id]/products/[productId] ───────────────────────── */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id, productId } = await params;
  const store = await resolveStore(req, id);
  if (!store) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db  = getDb();
  const oid = new ObjectId(id);

  const product = await resolveProduct(oid, productId);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const body = await req.json();
  const now  = new Date();

  // Strip client-side identity fields
  const { id: _id, _id: __id, storeId: _sid, ...rest } = body;
  void _id; void __id; void _sid;

  await db.collection("Product").updateOne(
    { _id: product._id },
    {
      $set: {
        ...rest,
        price:    Number(body.price ?? product.price),
        stock:    Number(body.stock ?? product.stock),
        sold:     Number(body.sold  ?? product.sold)  || 0,
        status:   Number(body.stock ?? product.stock) === 0
          ? "Out of Stock"
          : body.status || product.status || "Active",
        updatedAt: now,
      },
    }
  );

  return NextResponse.json({ ok: true });
}

/* ── DELETE /api/stores/[id]/products/[productId] ────────────────────── */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id, productId } = await params;
  const store = await resolveStore(req, id);
  if (!store) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db  = getDb();
  const oid = new ObjectId(id);

  const product = await resolveProduct(oid, productId);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const now = new Date();
  await db.collection("Product").deleteOne({ _id: product._id });

  const current = await db.collection("Store").findOne({ _id: oid });
  await db.collection("Store").updateOne(
    { _id: oid },
    { $set: { products: Math.max(0, (current?.products ?? 1) - 1), updatedAt: now } }
  );

  return NextResponse.json({ ok: true });
}
