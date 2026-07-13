import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";

/* ── GET /api/admin/products — every product across every store ─────────── */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();
  const params = req.nextUrl.searchParams;
  const storeId  = params.get("storeId");
  const status   = params.get("status");
  const category = params.get("category");
  const search   = params.get("search");
  const minPrice = params.get("minPrice");
  const maxPrice = params.get("maxPrice");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  if (storeId && ObjectId.isValid(storeId)) filter.storeId = new ObjectId(storeId);
  if (status)   filter.status   = status;
  if (category) filter.category = category;
  if (search)   filter.name     = { $regex: search, $options: "i" };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const products = await db.collection("Product").find(filter).sort({ createdAt: -1 }).limit(500).toArray();

  const storeIds = [...new Set(products.map(p => p.storeId?.toString()).filter(Boolean))];
  const stores = await db.collection("Store")
    .find({ _id: { $in: storeIds.map(id => new ObjectId(id)) } })
    .project({ name: 1, color: 1 })
    .toArray();
  const storeMap = new Map(stores.map(s => [s._id.toString(), s]));

  return NextResponse.json(
    products.map(p => ({
      id:            p._id.toString(),
      storeId:       p.storeId?.toString() ?? "",
      storeName:     storeMap.get(p.storeId?.toString())?.name ?? "Unknown",
      storeColor:    storeMap.get(p.storeId?.toString())?.color ?? "#0d9488",
      name:          p.name,
      category:      p.category,
      price:         p.price,
      originalPrice: p.originalPrice,
      stock:         p.stock,
      status:        p.status,
    })),
  );
}

/* ── POST /api/admin/products — create a product for a given store ───────── */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { storeId, name, category, price, stock } = body;

  if (!storeId || !ObjectId.isValid(storeId)) {
    return NextResponse.json({ error: "A valid storeId is required" }, { status: 400 });
  }
  if (!name || !category || price == null || stock == null) {
    return NextResponse.json({ error: "name, category, price and stock are required" }, { status: 400 });
  }

  const db  = getDb();
  const oid = new ObjectId(storeId);
  const store = await db.collection("Store").findOne({ _id: oid });
  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  const now  = new Date();
  const slug = (name as string).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const newId = new ObjectId();

  await db.collection("Product").insertOne({
    _id: newId,
    storeId: oid,
    name: String(name),
    slug,
    sku: newId.toString().slice(-6).toUpperCase(),
    category: String(category),
    price: Number(price),
    originalPrice: body.originalPrice != null ? Number(body.originalPrice) : null,
    stock: Number(stock),
    sold: 0,
    status: Number(stock) === 0 ? "Out of Stock" : "Active",
    tag: "", warranty: "30", rating: "0", reviews: "0", views: "0",
    shortDesc: "", fullDesc: "",
    images: [], features: [], specs: [], offers: [], customerReviews: [],
    createdAt: now, updatedAt: now,
  });

  await db.collection("Store").updateOne({ _id: oid }, { $inc: { products: 1 }, $set: { updatedAt: now } });

  return NextResponse.json({ id: newId.toString() }, { status: 201 });
}
