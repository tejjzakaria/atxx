import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getStoreById } from "@/lib/db/stores";
import { getDb } from "@/lib/mongodb";

const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CAT_COLORS  = ["#8b5cf6","#0d9488","#3b82f6","#ec4899","#f59e0b","#10b981","#ef4444","#6366f1"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const store = await getStoreById(id, session.user.id);
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const range = req.nextUrl.searchParams.get("range") ?? "7D";
  const db  = getDb();
  const now = new Date();

  /* ── Date range ── */
  const days = range === "7D" ? 7 : range === "30D" ? 30 : 90;
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  /* ── Parallel fetches ── */
  const [rangeOrders, allProducts, statusAgg, buyerAgg] = await Promise.all([
    // Orders within the selected range
    db.collection("Order")
      .find({ storeId: new ObjectId(id), createdAt: { $gte: since } })
      .toArray(),

    // All products (for category breakdown & top products)
    db.collection("Product")
      .find({ storeId: new ObjectId(id) })
      .toArray(),

    // Order status counts (all time for donut)
    db.collection("Order").aggregate([
      { $match: { storeId: new ObjectId(id) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]).toArray(),

    // Repeat buyer rate (all time)
    db.collection("Order").aggregate([
      { $match: { storeId: new ObjectId(id) } },
      { $group: { _id: "$customerName", n: { $sum: 1 } } },
      { $group: { _id: null, total: { $sum: 1 }, returning: { $sum: { $cond: [{ $gt: ["$n", 1] }, 1, 0] } } } },
    ]).toArray(),
  ]);

  const activeOrders = rangeOrders.filter(o => o.status !== "cancelled");

  /* ── Timeseries bucketing ── */
  type Bucket = { label: string; revenue: number; orders: number };
  let buckets: Bucket[] = [];

  if (range === "7D") {
    buckets = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const label = DAY_NAMES[d.getDay()];
      const dayOrds = activeOrders.filter(o => {
        const od = new Date(o.createdAt);
        return od.getFullYear() === d.getFullYear() &&
               od.getMonth()    === d.getMonth() &&
               od.getDate()     === d.getDate();
      });
      return { label, revenue: dayOrds.reduce((s, o) => s + (o.total ?? o.amount ?? 0), 0), orders: dayOrds.length };
    });

  } else if (range === "30D") {
    // 4 weekly buckets, oldest first
    buckets = Array.from({ length: 4 }, (_, i) => {
      const start = new Date(now.getTime() - (4 - i) * 7 * 24 * 60 * 60 * 1000);
      const end   = new Date(now.getTime() - (3 - i) * 7 * 24 * 60 * 60 * 1000);
      const wOrds = activeOrders.filter(o => {
        const od = new Date(o.createdAt);
        return od >= start && od < end;
      });
      return { label: `W${i + 1}`, revenue: wOrds.reduce((s, o) => s + (o.total ?? o.amount ?? 0), 0), orders: wOrds.length };
    });

  } else {
    // 3 monthly buckets
    buckets = Array.from({ length: 3 }, (_, i) => {
      const m     = now.getMonth() - (2 - i);
      const year  = now.getFullYear() + Math.floor(m / 12);
      const month = ((m % 12) + 12) % 12;
      const start = new Date(year, month, 1);
      const end   = new Date(year, month + 1, 1);
      const mOrds = activeOrders.filter(o => {
        const od = new Date(o.createdAt);
        return od >= start && od < end;
      });
      return { label: MONTH_NAMES[month], revenue: mOrds.reduce((s, o) => s + (o.total ?? o.amount ?? 0), 0), orders: mOrds.length };
    });
  }

  const totalRevenue = buckets.reduce((s, b) => s + b.revenue, 0);
  const totalOrders  = buckets.reduce((s, b) => s + b.orders, 0);

  /* ── Order status donut (all-time) ── */
  const statusMap: Record<string, number> = {};
  for (const s of statusAgg) statusMap[s._id as string] = s.count;
  const allTotal     = Object.values(statusMap).reduce((a, b) => a + b, 0) || 1;
  const fulfilledPct = Math.round(((statusMap["delivered"]  ?? 0) / allTotal) * 100);
  const pendingPct   = Math.round((((statusMap["pending"] ?? 0) + (statusMap["confirmed"] ?? 0) + (statusMap["shipped"] ?? 0)) / allTotal) * 100);
  const cancelledPct = Math.round(((statusMap["cancelled"]  ?? 0) / allTotal) * 100);

  /* ── Top products — from actual order items in range ── */
  const productRevMap: Record<string, { revenue: number; orders: number }> = {};
  for (const order of activeOrders) {
    for (const item of (order.items ?? [])) {
      const name = (item.productName ?? item.name ?? "Unknown") as string;
      if (!productRevMap[name]) productRevMap[name] = { revenue: 0, orders: 0 };
      productRevMap[name].revenue += item.subtotal != null ? item.subtotal : (item.price ?? 0) * (item.quantity ?? 1);
      productRevMap[name].orders  += item.quantity ?? 1;
    }
  }
  const topProducts = Object.entries(productRevMap)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 6)
    .map(([name, { revenue, orders }]) => ({ name, revenue: Math.round(revenue), orders }));
  const maxRev = Math.max(...topProducts.map(p => p.revenue), 1);

  /* ── Revenue by category — from actual order items in range ── */
  const productCatMap: Record<string, string> = {};
  for (const p of allProducts) productCatMap[p.name as string] = (p.category as string) || "Other";

  const catMap: Record<string, number> = {};
  for (const order of activeOrders) {
    for (const item of (order.items ?? [])) {
      const cat = productCatMap[(item.productName ?? item.name) as string] ?? "Other";
      const itemRevenue = item.subtotal != null ? item.subtotal : (item.price ?? 0) * (item.quantity ?? 1);
      catMap[cat] = (catMap[cat] ?? 0) + itemRevenue;
    }
  }
  const categoryRevenue = Object.entries(catMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, value], i) => ({ name, value, color: CAT_COLORS[i] }));
  const catTotal = categoryRevenue.reduce((s, c) => s + c.value, 0) || 1;

  /* ── Insights ── */
  // Best day from 7-day window (always computed from last 7 regardless of range)
  const dayTotals: Record<string, number> = {};
  for (const o of activeOrders) {
    const day = DAY_NAMES[new Date(o.createdAt).getDay()];
    dayTotals[day] = (dayTotals[day] ?? 0) + (o.total ?? o.amount ?? 0);
  }
  const bestDay = Object.keys(dayTotals).length > 0
    ? Object.entries(dayTotals).sort(([, a], [, b]) => b - a)[0][0]
    : "—";

  const topCategory = categoryRevenue[0]?.name ?? "—";

  const retData    = buyerAgg[0] as { total: number; returning: number } | undefined;
  const returnRate = retData ? Math.round((retData.returning / retData.total) * 100) : 0;

  return NextResponse.json({
    revenue:  { total: totalRevenue, data: buckets.map(b => ({ label: b.label, value: b.revenue })) },
    orders:   { total: totalOrders,  data: buckets.map(b => ({ label: b.label, value: b.orders  })) },
    avgOrder: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    statusBreakdown: { fulfilled: fulfilledPct, pending: pendingPct, cancelled: cancelledPct },
    topProducts: topProducts.map(p => ({ ...p, pct: Math.round((p.revenue / maxRev) * 100) })),
    categoryRevenue,
    catTotal,
    bestDay,
    topCategory,
    returnRate,
  });
}
