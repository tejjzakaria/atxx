import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { SectionInstance } from "@/lib/sections";

export interface StoreContent {
  home: {
    hero: { headline: string; subtext: string; ctaText: string; socialProof: string; image?: string };
    about: { headline: string; body: string; ctaText: string; image?: string };
    testimonials: { headlineBold: string; headlineItalic: string; stats: Array<{ percent: string; text: string }> };
    benefits: { headlineBold: string; headlineItalic: string; items: Array<{ title: string; description: string }> };
    reviews: {
      headlineBold: string;
      headlineItalic: string;
      subtitle: string;
      totalReviews: string;
      items?: Array<{
        image: string;
        name: string;
        date: string;
        rating: number;
        text: string;
        productImage: string;
        productName: string;
      }>;
    };
  };
  about: {
    hero: { eyebrow: string; headline: string; subtitle: string; image?: string };
    stats: Array<{ value: string; label: string }>;
    mission: { eyebrow: string; headlineBold: string; headlineItalic: string; body1: string; body2: string; ctaText: string; image?: string };
    values: { eyebrow: string; headlineBold: string; headlineItalic: string; items: Array<{ title: string; description: string }> };
    timeline: { eyebrow: string; headlineBold: string; headlineItalic: string; items: Array<{ year: string; title: string; text: string }> };
    cta: { headline: string; subtitle: string; primaryCta: string; secondaryCta: string };
  };
  contact: { instagram: string; tiktok: string };
  shop?: {
    hero?: { image?: string };
  };
  product?: {
    howToUse?: {
      eyebrow?: string;
      headline?: string;
      steps?: Array<{ step: string; title: string; description: string }>;
    };
    whyUs?: {
      eyebrow?: string;
      headline?: string;
      items?: Array<{ title: string; description: string }>;
    };
  };
}

export interface StoreDoc {
  _id: string;
  ownerId: string;
  name: string;
  url?: string;
  status: "Active" | "Paused" | "Disconnected";
  revenue: number;
  orders: number;
  customers: number;
  products: number;
  color: string;
  initials: string;
  // Optional settings fields
  desc?: string;
  email?: string;
  phone?: string;
  country?: string;
  currency?: string;
  pixels?: Record<string, { id: string; enabled: boolean }>;
  notifications?: {
    orders: boolean;
    lowStock: boolean;
    cancelled: boolean;
    weekly: boolean;
    marketing: boolean;
    sms: boolean;
  };
  apiKey?: string;
  sheetsId?: string;
  content?: Record<string, StoreContent>;
  sections?: SectionInstance[];
  pages?: Record<string, SectionInstance[]>;
}

export interface OrderItem {
  productId: string;
  productSlug: string;
  productName: string;
  productImage: string;
  price: number;
  originalPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderDoc {
  _id: string;
  storeId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  subtotal: number;
  savings: number;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export async function getStoresByOwner(ownerId: string): Promise<StoreDoc[]> {
  const db = getDb();
  const stores = await db.collection("Store")
    .find({ ownerId: new ObjectId(ownerId) })
    .project({ name: 1, color: 1, initials: 1, status: 1 })
    .toArray();
  return stores.map(s => ({
    ...s,
    _id: s._id.toString(),
    ownerId: s.ownerId?.toString() ?? ownerId,
  } as StoreDoc));
}

export async function getStoreById(id: string, ownerId: string): Promise<StoreDoc | null> {
  if (!ObjectId.isValid(id)) return null;

  const db = getDb();
  const store = await db.collection("Store").findOne({
    _id: new ObjectId(id),
    ownerId: new ObjectId(ownerId),
  });

  if (!store) return null;

  return {
    ...store,
    _id: store._id.toString(),
    ownerId: store.ownerId.toString(),
  } as StoreDoc;
}

export interface StoreStats {
  ordersByStatus: { fulfilled: number; pending: number; cancelled: number; total: number };
  /** Revenue per day for the last 7 days (index 0 = oldest) */
  dailyRevenue: number[];
  /** Order count per day for the last 7 days */
  dailyOrders: number[];
  /** Labels for each of the 7 days e.g. "Mon", "Tue" */
  dailyLabels: string[];
  avgOrderValue: number;
  fulfillmentRate: number;   // 0-100
  repeatBuyerRate: number;   // 0-100
  topProducts: { name: string; count: number; revenue: number }[];
}

export async function getStoreStats(storeId: string): Promise<StoreStats> {
  if (!ObjectId.isValid(storeId)) return emptyStats();

  const db = getDb();
  const oid = new ObjectId(storeId);

  // Build last-7-days date buckets
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const weekStart = days[0];

  const [statusAgg, dailyAgg, topProductsAgg, buyerAgg] = await Promise.all([
    // 1. Count by status
    db.collection("Order").aggregate([
      { $match: { storeId: oid } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]).toArray(),

    // 2. Daily delivered revenue + order counts for last 7 days
    db.collection("Order").aggregate([
      { $match: { storeId: oid, createdAt: { $gte: weekStart } } },
      {
        $group: {
          _id: {
            year:  { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day:   { $dayOfMonth: "$createdAt" },
            status: "$status",
          },
          revenue: { $sum: "$total" },
          count:   { $sum: 1 },
        },
      },
    ]).toArray(),

    // 3. Top 5 products (unwind items array)
    db.collection("Order").aggregate([
      { $match: { storeId: oid, status: "delivered" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productName",
          count:   { $sum: "$items.quantity" },
          revenue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]).toArray(),

    // 4. Repeat buyer rate
    db.collection("Order").aggregate([
      { $match: { storeId: oid } },
      { $group: { _id: "$customerName", orderCount: { $sum: 1 } } },
    ]).toArray(),
  ]);

  // Process order status
  const statusMap: Record<string, number> = {};
  for (const s of statusAgg) statusMap[s._id as string] = s.count;
  const fulfilled  = statusMap["delivered"]  ?? 0;
  const pending    = (statusMap["pending"] ?? 0) + (statusMap["confirmed"] ?? 0) + (statusMap["shipped"] ?? 0);
  const cancelled  = statusMap["cancelled"] ?? 0;
  const total      = fulfilled + pending + cancelled;

  // Process daily data
  const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const dailyRevenue = new Array(7).fill(0);
  const dailyOrders  = new Array(7).fill(0);

  for (const row of dailyAgg) {
    const rowDate = new Date(row._id.year, row._id.month - 1, row._id.day);
    const idx = days.findIndex(d =>
      d.getFullYear() === rowDate.getFullYear() &&
      d.getMonth()    === rowDate.getMonth() &&
      d.getDate()     === rowDate.getDate()
    );
    if (idx === -1) continue;
    dailyOrders[idx] += row.count;
    if (row._id.status === "delivered") dailyRevenue[idx] += row.revenue;
  }

  const dailyLabels = days.map(d => DAYS[d.getDay()]);

  // Avg order value
  const totalFulfilledRevenue = dailyRevenue.reduce((a, b) => a + b, 0);
  const avgOrderValue = fulfilled > 0 ? Math.round(totalFulfilledRevenue / fulfilled) : 0;

  // Fulfillment rate
  const fulfillmentRate = total > 0 ? Math.round((fulfilled / total) * 100) : 0;

  // Repeat buyer rate
  const totalBuyers  = buyerAgg.length;
  const repeatBuyers = buyerAgg.filter(b => b.orderCount > 1).length;
  const repeatBuyerRate = totalBuyers > 0 ? Math.round((repeatBuyers / totalBuyers) * 100) : 0;

  // Top products
  const topProducts = topProductsAgg.map(p => ({
    name: p._id as string,
    count: p.count,
    revenue: p.revenue,
  }));

  return {
    ordersByStatus: { fulfilled, pending, cancelled, total },
    dailyRevenue,
    dailyOrders,
    dailyLabels,
    avgOrderValue,
    fulfillmentRate,
    repeatBuyerRate,
    topProducts,
  };
}

function emptyStats(): StoreStats {
  return {
    ordersByStatus: { fulfilled: 0, pending: 0, cancelled: 0, total: 0 },
    dailyRevenue: [0,0,0,0,0,0,0],
    dailyOrders:  [0,0,0,0,0,0,0],
    dailyLabels:  ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
    avgOrderValue: 0,
    fulfillmentRate: 0,
    repeatBuyerRate: 0,
    topProducts: [],
  };
}

export async function getRecentOrders(storeId: string, limit = 5): Promise<OrderDoc[]> {
  if (!ObjectId.isValid(storeId)) return [];

  const db = getDb();
  const orders = await db
    .collection("Order")
    .find({ storeId: new ObjectId(storeId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return orders.map(o => ({
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
    createdAt:       new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    updatedAt:       o.updatedAt ? new Date(o.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "",
  }));
}
