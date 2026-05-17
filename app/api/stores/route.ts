import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const stores = await db
    .collection("Store")
    .find({ ownerId: new ObjectId(session.user.id) })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json(
    stores.map((s) => ({ ...s, _id: s._id.toString(), ownerId: s.ownerId.toString() }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, color, initials } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const now = new Date();
  const db = getDb();

  const result = await db.collection("Store").insertOne({
    _id: new ObjectId(),
    ownerId: new ObjectId(session.user.id),
    name: name.trim(),
    status: "Active",
    color: color ?? "#0d9488",
    initials: initials ?? name.trim().split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase(),
    revenue: 0,
    orders: 0,
    customers: 0,
    products: 0,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id: result.insertedId.toString() }, { status: 201 });
}
