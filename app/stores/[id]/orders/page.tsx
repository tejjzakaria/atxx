"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/hooks/useStore";
import { PageHeader } from "@/components/PageHeader";

/* ─── Types ──────────────────────────────────────────────────────────── */
type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

interface OrderItem {
  productId: string;
  productSlug: string;
  productName: string;
  productImage: string;
  price: number;
  originalPrice: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  _id:             string;
  orderNumber:     string;
  customerName:    string;
  customerPhone:   string;
  customerAddress: string;
  items:           OrderItem[];
  subtotal:        number;
  savings:         number;
  total:           number;
  status:          OrderStatus;
  paymentMethod:   string;
  createdAt:       string;
  updatedAt:       string;
}

const STATUS_META: Record<OrderStatus, { label: string; badge: string; dot: string }> = {
  pending:   { label: "Pending",   badge: "bg-amber-50 text-amber-700 border border-amber-100",   dot: "bg-amber-400"   },
  confirmed: { label: "Confirmed", badge: "bg-blue-50 text-blue-700 border border-blue-100",       dot: "bg-blue-400"    },
  shipped:   { label: "Shipped",   badge: "bg-purple-50 text-purple-700 border border-purple-100", dot: "bg-purple-400"  },
  delivered: { label: "Delivered", badge: "bg-emerald-50 text-emerald-700 border border-emerald-100", dot: "bg-emerald-400" },
  cancelled: { label: "Cancelled", badge: "bg-red-50 text-red-600 border border-red-100",          dot: "bg-red-400"     },
};

const STATUSES = Object.keys(STATUS_META) as OrderStatus[];
const FILTERS  = ["All", ...STATUSES] as const;
type Filter = typeof FILTERS[number];

/* ─── Icons ──────────────────────────────────────────────────────────── */
function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  );
}
function ChevronUpDown() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  );
}
function ExportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

/* ─── Stat card ──────────────────────────────────────────────────────── */
function MiniSpark({ vals, id }: { vals: number[]; id: string }) {
  const W = 140; const H = 36; const P = 3;
  const min = Math.min(...vals); const max = Math.max(...vals);
  const norm = vals.map(v => max === min ? 0.5 : (v - min) / (max - min));
  const pts = norm.map((n, i) => [
    P + (i / (norm.length - 1)) * (W - P * 2),
    P + (1 - n) * (H - P * 2),
  ]);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length-1][0].toFixed(1)},${(H-P).toFixed(1)} L${pts[0][0].toFixed(1)},${(H-P).toFixed(1)} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="36" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.25" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.85" />
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3" fill="white" fillOpacity="0.9" />
    </svg>
  );
}

function OrderStatCard({ label, value, sub, icon, grad, vals, sparkId, delay }: {
  label: string; value: string | number; sub: string;
  icon: React.ReactNode; grad: string; vals: number[]; sparkId: string; delay: string;
}) {
  const display = String(value);
  return (
    <div className="relative rounded-2xl overflow-hidden"
      style={{ background: grad, animation: "cardIn 0.55s cubic-bezier(0.22,1,0.36,1) both", animationDelay: delay }}>
      <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "14px 14px" }} />
      <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full blur-3xl opacity-25 pointer-events-none bg-white" />
      <div className="relative z-10 p-4">
        <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/20 flex items-center justify-center text-white mb-4">
          {icon}
        </div>
        <p className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.12em] mb-1">{label}</p>
        <p className="text-2xl font-black text-white leading-none tracking-tight">{display}</p>
        <p className="text-[11px] text-white/40 mt-1 font-medium">{sub}</p>
        <div className="mt-3 -mx-1"><MiniSpark vals={vals} id={sparkId} /></div>
      </div>
      <div className="absolute bottom-1 right-2 text-[3.5rem] font-black text-white/[0.05] leading-none select-none pointer-events-none tracking-tighter">
        {display.replace(/[^0-9KM.]/g, "")}
      </div>
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {[6, 24, 28, 32, 16, 20, 14].map((w, i) => (
        <td key={i} className="py-4 px-4">
          <div className="h-3 bg-gray-100 rounded animate-pulse" style={{ width: `${w * 4}px` }} />
        </td>
      ))}
    </tr>
  );
}

/* ─── Order row ──────────────────────────────────────────────────────── */
function OrderRow({ order, index }: { order: Order; index: number }) {
  const s = STATUS_META[order.status] ?? STATUS_META.pending;
  const name = order.customerName;
  const avatar = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const hues = ["#ec4899","#3b82f6","#f59e0b","#8b5cf6","#10b981","#ef4444","#f97316","#06b6d4"];
  const color = hues[(name.charCodeAt(0) || 65) % hues.length];
  const date  = new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const firstItem = order.items?.[0];
  const itemSummary = firstItem
    ? order.items.length > 1
      ? `${firstItem.productName} +${order.items.length - 1} more`
      : firstItem.productName
    : "—";

  return (
    <tr className="group border-b border-gray-100 last:border-0 hover:bg-[#f7faf9] transition-colors duration-100"
      style={{ animationDelay: `${index * 30}ms` }}>
      <td className="py-3.5 pl-6 pr-4">
        <span className="font-mono text-xs font-semibold text-gray-400">#{order.orderNumber || order._id.slice(-6).toUpperCase()}</span>
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
            style={{ backgroundColor: color }}>{avatar}</div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
            {order.customerPhone && <p className="text-[11px] text-gray-400 truncate">{order.customerPhone}</p>}
          </div>
        </div>
      </td>
      <td className="py-3.5 px-4 max-w-[180px]">
        <span className="text-sm text-gray-500 font-medium truncate block">{itemSummary}</span>
        {order.items?.length > 0 && (
          <span className="text-[11px] text-gray-400">{order.items.reduce((s, i) => s + i.quantity, 0)} item{order.items.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}</span>
        )}
      </td>
      <td className="py-3.5 px-4">
        <span className="text-sm font-bold text-gray-900">{order.total.toLocaleString()} MAD</span>
        {order.savings > 0 && (
          <span className="block text-[11px] text-emerald-600 font-medium">−{order.savings} saved</span>
        )}
      </td>
      <td className="py-3.5 px-4">
        <span className="text-xs text-gray-400 font-medium capitalize">{order.paymentMethod || "—"}</span>
      </td>
      <td className="py-3.5 px-4">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      </td>
      <td className="py-3.5 pl-4 pr-6 text-right">
        <span className="text-xs text-gray-400 font-medium">{date}</span>
      </td>
    </tr>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function dailyCountsLast7(orders: Order[]) {
  const counts = new Array(7).fill(0);
  const now = new Date();
  for (const o of orders) {
    const diff = Math.floor((now.getTime() - new Date(o.createdAt).getTime()) / 86400000);
    if (diff >= 0 && diff < 7) counts[6 - diff]++;
  }
  return counts;
}

function dailyRevenueLast7(orders: Order[]) {
  const totals = new Array(7).fill(0);
  const now = new Date();
  for (const o of orders) {
    if (o.status !== "delivered") continue;
    const diff = Math.floor((now.getTime() - new Date(o.createdAt).getTime()) / 86400000);
    if (diff >= 0 && diff < 7) totals[6 - diff] += o.total;
  }
  return totals;
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function OrdersPage() {
  const { id } = useParams<{ id: string }>();
  const { store, loading: storeLoading } = useStore(id);

  const [orders,        setOrders]       = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [filter,        setFilter]       = useState<Filter>("All");
  const [search,        setSearch]       = useState("");
  const [sortAmt,       setSortAmt]      = useState<"asc" | "desc" | null>(null);

  useEffect(() => {
    fetch(`/api/stores/${id}/orders`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setOrders(data); setOrdersLoading(false); });
  }, [id]);

  const delivered = orders.filter(o => o.status === "delivered").length;
  const pending   = orders.filter(o => o.status === "pending" || o.status === "confirmed" || o.status === "shipped").length;
  const cancelled = orders.filter(o => o.status === "cancelled").length;
  const revenue   = orders.filter(o => o.status === "delivered").reduce((s, o) => s + o.total, 0);
  const deliverRate = orders.length > 0 ? Math.round((delivered / orders.length) * 100) : 0;

  const filtered = useMemo(() => {
    let list = orders;
    if (filter !== "All") list = list.filter(o => o.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.customerName.toLowerCase().includes(q) ||
        o.orderNumber.toLowerCase().includes(q) ||
        o._id.includes(q) ||
        o.items?.some(i => i.productName.toLowerCase().includes(q))
      );
    }
    if (sortAmt === "asc")  list = [...list].sort((a, b) => a.total - b.total);
    if (sortAmt === "desc") list = [...list].sort((a, b) => b.total - a.total);
    return list;
  }, [orders, filter, search, sortAmt]);

  function toggleSort() {
    setSortAmt(prev => prev === null ? "desc" : prev === "desc" ? "asc" : null);
  }

  if (storeLoading || !store) return null;

  const dailyCounts  = dailyCountsLast7(orders);
  const dailyRevenue = dailyRevenueLast7(orders);

  return (
    <div className="flex-1 flex flex-col min-h-screen"
      style={{ backgroundColor: "#f0f5f4", backgroundImage: "radial-gradient(#c8deda 1px, transparent 1px)", backgroundSize: "24px 24px" }}>

      <PageHeader
        title="Orders"
        subtitle={`${orders.length} total · manage and track customer orders`}
        store={store}
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>}
        stats={[
          { label: "Total",     value: String(orders.length) },
          { label: "Delivered", value: String(delivered) },
          { label: "Pending",   value: String(pending) },
        ]}
        actions={
          <button className="flex items-center gap-2 text-xs font-semibold text-[#0d3d38] bg-[#f0faf9] hover:bg-[#e0f5f2] border border-[#c8ede8] px-3.5 py-2 rounded-xl transition-colors">
            <ExportIcon /> Export CSV
          </button>
        }
      />

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <main className="flex-1 p-6 md:p-8 space-y-5">

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <OrderStatCard
            label="Total Orders" value={orders.length} sub="all time"
            grad="linear-gradient(135deg, #0d3d38 0%, #0f766e 60%, #14b8a6 100%)"
            sparkId="sp-tot" delay="0ms" vals={dailyCounts}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>}
          />
          <OrderStatCard
            label="Delivered" value={delivered} sub={`${deliverRate}% success rate`}
            grad="linear-gradient(135deg, #064e3b 0%, #059669 60%, #34d399 100%)"
            sparkId="sp-del" delay="70ms" vals={dailyCounts}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
          />
          <OrderStatCard
            label="Pending" value={pending} sub="awaiting action"
            grad="linear-gradient(135deg, #78350f 0%, #d97706 60%, #fbbf24 100%)"
            sparkId="sp-pen" delay="140ms" vals={dailyCounts}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          />
          <OrderStatCard
            label="Cancelled" value={cancelled} sub="lost conversions"
            grad="linear-gradient(135deg, #7f1d1d 0%, #dc2626 60%, #f87171 100%)"
            sparkId="sp-can" delay="210ms" vals={dailyCounts}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
          />
          <OrderStatCard
            label="Earned" value={`${revenue.toLocaleString()} MAD`} sub="from delivered orders"
            grad="linear-gradient(135deg, #3b0764 0%, #7c3aed 60%, #a78bfa 100%)"
            sparkId="sp-rev" delay="280ms" vals={dailyRevenue}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          />
        </div>

        {/* ── Table card ── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100/80">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-gray-100">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <SearchIcon />
              </span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search orders…"
                className="w-full h-9 pl-9 pr-4 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#0d9488] focus:bg-[#f0faf9] focus:ring-2 focus:ring-[#0d9488]/20 transition-all"
              />
            </div>

            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
              {FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
                    filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}>
                  {f === "All" ? "All" : STATUS_META[f as OrderStatus].label}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
              <FilterIcon />
              <span>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th className="py-3 pl-6 pr-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order #</th>
                  <th className="py-3 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                  <th className="py-3 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Items</th>
                  <th className="py-3 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <button onClick={toggleSort} className="flex items-center gap-1.5 hover:text-gray-600 transition-colors">
                      Total
                      <span className={`transition-transform ${sortAmt === "asc" ? "rotate-180" : ""} ${sortAmt ? "text-[#0d9488]" : "opacity-40"}`}>
                        <ChevronUpDown />
                      </span>
                    </button>
                  </th>
                  <th className="py-3 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment</th>
                  <th className="py-3 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="py-3 pl-4 pr-6 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                </tr>
              </thead>
              <tbody>
                {ordersLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-sm text-gray-400">
                      {orders.length === 0 ? "No orders yet." : "No orders match your search."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((order, i) => <OrderRow key={order._id} order={order} index={i} />)
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {!ordersLoading && filtered.length > 0 && (
            <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of <span className="font-semibold text-gray-600">{orders.length}</span> orders
              </p>
              <div className="flex items-center gap-1">
                {STATUSES.map(s => (
                  <span key={s} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_META[s].badge}`}>
                    {orders.filter(o => o.status === s).length} {STATUS_META[s].label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
