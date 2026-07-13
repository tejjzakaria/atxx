import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAllStores } from "@/lib/db/stores";

/* ── GET /api/admin/stores — lightweight list for filter dropdowns/selects ── */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stores = await getAllStores();
  return NextResponse.json(stores.map(s => ({ id: s._id, name: s.name, color: s.color })));
}
