import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";

type Ctx = { params: Promise<{ id: string }> };

/* ── PATCH /api/admin/products/[id] — edit core fields ────────────────────── */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const db  = getDb();
  const oid = new ObjectId(id);

  const product = await db.collection("Product").findOne({ _id: oid });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stock = body.stock != null ? Number(body.stock) : product.stock;

  await db.collection("Product").updateOne(
    { _id: oid },
    {
      $set: {
        name:          body.name          ?? product.name,
        category:      body.category      ?? product.category,
        price:         body.price         != null ? Number(body.price) : product.price,
        originalPrice: body.originalPrice != null ? Number(body.originalPrice) : product.originalPrice,
        stock,
        status: stock === 0 ? "Out of Stock" : (body.status ?? product.status),
        updatedAt: new Date(),
      },
    },
  );

  return NextResponse.json({ ok: true });
}

/* ── DELETE /api/admin/products/[id] ───────────────────────────────────────── */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const db  = getDb();
  const oid = new ObjectId(id);

  const product = await db.collection("Product").findOne({ _id: oid });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.collection("Product").deleteOne({ _id: oid });
  await db.collection("Store").updateOne(
    { _id: product.storeId },
    { $inc: { products: -1 }, $set: { updatedAt: new Date() } },
  );

  return NextResponse.json({ ok: true });
}
