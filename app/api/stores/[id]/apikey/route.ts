import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { randomBytes } from "crypto";
import { storeSessionFilter } from "@/lib/db/stores";

type Ctx = { params: Promise<{ id: string }> };

function generateKey(): string {
  return "atxx_sk_" + randomBytes(24).toString("hex");
}

/* ── GET /api/stores/[id]/apikey — return current key ────────────────── */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const db = getDb();
  const store = await db.collection("Store").findOne(storeSessionFilter(id, session));
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ apiKey: store.apiKey ?? null });
}

/* ── POST /api/stores/[id]/apikey — generate (or regenerate) a key ───── */
export async function POST(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const db = getDb();
  const store = await db.collection("Store").findOne(storeSessionFilter(id, session));
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const apiKey = generateKey();

  await db.collection("Store").updateOne(
    { _id: new ObjectId(id) },
    { $set: { apiKey, updatedAt: new Date() } }
  );

  return NextResponse.json({ apiKey }, { status: 201 });
}
