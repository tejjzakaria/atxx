import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getStoreById } from "@/lib/db/stores";
import { getDb } from "@/lib/mongodb";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const db  = getDb();
  const oid = new ObjectId(id);

  // Accept Bearer API key (storefront) or session (dashboard)
  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const store = await db.collection("Store").findOne({ _id: oid, apiKey: token });
    if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // Never expose CAPI secrets to the storefront — this response ships to the browser.
    if (store.pixels) {
      const { metaAccessToken: _t, metaTestEventCode: _c, ...publicPixels } = store.pixels;
      return NextResponse.json({ ...store, pixels: publicPixels });
    }
    return NextResponse.json(store);
  }

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await getStoreById(id, session.user.id);
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(store);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const store = await getStoreById(id, session.user.id);
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const db   = getDb();
  const now  = new Date();

  // Strip fields that must never be overwritten from the client
  const { _id: _a, ownerId: _b, revenue: _c, orders: _d, customers: _e, products: _f, ...rest } = body;

  // If name changed, also update initials
  if (rest.name && rest.name !== store.name) {
    rest.initials = rest.name.slice(0, 2).toUpperCase();
  }

  await db.collection("Store").updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...rest, updatedAt: now } }
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const store = await getStoreById(id, session.user.id);
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const db  = getDb();
  const oid = new ObjectId(id);

  await Promise.all([
    db.collection("Store").deleteOne({ _id: oid }),
    db.collection("Product").deleteMany({ storeId: oid }),
    db.collection("Order").deleteMany({ storeId: oid }),
  ]);

  return NextResponse.json({ ok: true });
}
