import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { storeSessionFilter } from "@/lib/db/stores";

type Ctx = { params: Promise<{ id: string }> };

/* ── Resolve store: API key OR session ───────────────────────────────── */
async function resolveStore(req: NextRequest, id: string) {
  if (!ObjectId.isValid(id)) return null;
  const db  = getDb();
  const oid = new ObjectId(id);

  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    return await db.collection("Store").findOne({ _id: oid, apiKey: token });
  }

  const session = await auth();
  if (!session?.user?.id) return null;
  return await db.collection("Store").findOne(storeSessionFilter(id, session));
}

/* ── GET /api/stores/[id]/products — public (storefront) or session (dashboard) ── */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const db  = getDb();
  const oid = new ObjectId(id);

  // Verify store exists (no auth required — products are public catalogue data)
  const store = await db.collection("Store").findOne({ _id: oid });
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url      = new URL(req.url);
  const category = url.searchParams.get("category");
  const search   = url.searchParams.get("search");
  const status   = url.searchParams.get("status");   // "Active" | "Draft" | "Out of Stock"
  const tag      = url.searchParams.get("tag");
  const limit    = Math.min(Number(url.searchParams.get("limit")  || 100), 500);
  const skip     = Number(url.searchParams.get("skip") || 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = { storeId: oid };
  if (category) filter.category = category;
  if (status)   filter.status   = status;
  if (tag)      filter.tag      = tag;
  if (search)   filter.name     = { $regex: search, $options: "i" };

  const products = await db
    .collection("Product")
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  const total = await db.collection("Product").countDocuments(filter);

  const mapped = products.map(p => ({
    id:            p._id.toString(),
    name:          p.name,
    slug:          p.slug,
    sku:           p.sku,
    category:      p.category,
    price:         p.price,
    originalPrice: p.originalPrice,
    stock:         p.stock,
    sold:          p.sold,
    status:        p.status,
    tag:           p.tag,
    warranty:      p.warranty,
    rating:        p.rating,
    reviews:       p.reviews,
    views:         p.views,
    shortDesc:     p.shortDesc,
    fullDesc:      p.fullDesc,
    images:        p.images      ?? [],
    features:      p.features    ?? [],
    specs:         p.specs       ?? [],
    offers:        p.offers      ?? [],
    customerReviews: p.customerReviews ?? [],
  }));

  return NextResponse.json({ products: mapped, total, skip, limit });
}

/* ── POST /api/stores/[id]/products — create or upsert by slug ────────── */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const store = await resolveStore(req, id);
  if (!store) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, category, price, stock } = body;

  if (!name || !category || price == null || stock == null) {
    return NextResponse.json(
      { error: "name, category, price and stock are required" },
      { status: 400 }
    );
  }

  const db  = getDb();
  const now = new Date();
  const oid = new ObjectId(id);

  const slug = body.slug || (name as string).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  // Upsert by slug: if a product with this slug already exists, update it
  const existing = await db.collection("Product").findOne({ storeId: oid, slug });

  if (existing) {
    await db.collection("Product").updateOne(
      { _id: existing._id },
      {
        $set: {
          name:          String(name),
          category:      String(category),
          price:         Number(price),
          originalPrice: body.originalPrice != null ? Number(body.originalPrice) : existing.originalPrice,
          stock:         Number(stock),
          sold:          body.sold != null ? Number(body.sold) : existing.sold,
          status:        Number(stock) === 0 ? "Out of Stock" : body.status || existing.status || "Active",
          tag:           body.tag      ?? existing.tag      ?? "",
          warranty:      body.warranty ?? existing.warranty ?? "30",
          rating:        body.rating   ?? existing.rating   ?? "0",
          reviews:       body.reviews  ?? existing.reviews  ?? "0",
          views:         body.views    ?? existing.views    ?? "0",
          shortDesc:       body.shortDesc       ?? existing.shortDesc       ?? "",
          fullDesc:        body.fullDesc        ?? existing.fullDesc        ?? "",
          sheetsId:        body.sheetsId        ?? existing.sheetsId        ?? "",
          images:          body.images          ?? existing.images          ?? [],
          features:        body.features        ?? existing.features        ?? [],
          specs:           body.specs           ?? existing.specs           ?? [],
          offers:          body.offers          ?? existing.offers          ?? [],
          customerReviews: body.customerReviews ?? existing.customerReviews ?? [],
          updatedAt: now,
        },
      }
    );
    return NextResponse.json({ id: existing._id.toString(), updated: true }, { status: 200 });
  }

  // Create new product
  const newId = new ObjectId();
  await db.collection("Product").insertOne({
    _id:      newId,
    storeId:  oid,
    name:     String(name),
    slug,
    sku:      body.sku || newId.toString().slice(-6).toUpperCase(),
    category: String(category),
    price:    Number(price),
    originalPrice: body.originalPrice != null ? Number(body.originalPrice) : null,
    stock:    Number(stock),
    sold:     Number(body.sold) || 0,
    status:   Number(stock) === 0 ? "Out of Stock" : "Active",
    tag:      body.tag      || "",
    warranty: body.warranty || "30",
    rating:   body.rating   || "0",
    reviews:  body.reviews  || "0",
    views:    body.views    || "0",
    shortDesc:       body.shortDesc       || "",
    fullDesc:        body.fullDesc        || "",
    sheetsId:        body.sheetsId        || "",
    images:          body.images          || [],
    features:        body.features        || [],
    specs:           body.specs           || [],
    offers:          body.offers          || [],
    customerReviews: body.customerReviews || [],
    createdAt: now,
    updatedAt: now,
  });

  await db.collection("Store").updateOne(
    { _id: oid },
    { $inc: { products: 1 }, $set: { updatedAt: now } }
  );

  return NextResponse.json({ id: newId.toString(), updated: false }, { status: 201 });
}
