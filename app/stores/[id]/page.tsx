import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { resolveStoreForSession, getRecentOrders, getStoreStats, type OrderDoc } from "@/lib/db/stores";
import { fmtRevenue, STATUS_DOT, STATUS_BADGE } from "@/lib/stores";
import { PageHeader } from "@/components/PageHeader";

/* ─── Stat card ─────────────────────────────────────────────────────── */
type SparkVal = number[];

function MiniSpark({ vals, id }: { vals: SparkVal; id: string }) {
  const W = 160; const H = 44; const P = 3;
  const min = Math.min(...vals); const max = Math.max(...vals);
  const norm = vals.map(v => (max === min) ? 0.5 : (v - min) / (max - min));
  const pts = norm.map((n, i) => [
    P + (i / (norm.length - 1)) * (W - P * 2),
    P + (1 - n) * (H - P * 2),
  ]);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length-1][0].toFixed(1)},${(H-P).toFixed(1)} L${pts[0][0].toFixed(1)},${(H-P).toFixed(1)} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="44" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.25" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.85" />
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3.5" fill="white" fillOpacity="0.9" />
    </svg>
  );
}

function StatCard({ label, value, subValue, change, positive = true, icon, grad, vals, delay, sparkId }: {
  label: string; value: string; subValue?: string; change: string; positive?: boolean;
  icon: React.ReactNode; grad: string; vals: SparkVal; delay: string; sparkId: string;
}) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden cursor-default"
      style={{
        background: grad,
        animation: "cardIn 0.55s cubic-bezier(0.22,1,0.36,1) both",
        animationDelay: delay,
      }}
    >
      {/* Mesh texture overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "14px 14px" }} />

      {/* Shine sweep on hover — pure CSS trick via pseudo doesn't work in JSX, use a div */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.07) 50%, transparent 60%)" }} />

      {/* Floating glow orb */}
      <div className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full blur-3xl opacity-30 pointer-events-none bg-white" />

      <div className="relative z-10 p-5">
        {/* Top row: icon + badge */}
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 shadow-inner">
            {icon}
          </div>
          <div className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
            positive ? "bg-white/20 text-white" : "bg-red-400/30 text-red-100"
          }`}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
              {positive ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
            </svg>
            {change}
          </div>
        </div>

        {/* Label */}
        <p className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.12em] mt-5 mb-1">{label}</p>

        {/* Value */}
        <p className="text-[2rem] font-black text-white leading-none tracking-tight">{value}</p>
        {subValue && <p className="text-xs text-white/40 mt-1 font-medium">{subValue}</p>}

        {/* Sparkline */}
        <div className="mt-4 -mx-1">
          <MiniSpark vals={vals} id={sparkId} />
        </div>
      </div>

      {/* Ghost watermark value */}
      <div className="absolute bottom-0 right-3 text-[5.5rem] font-black text-white/[0.04] leading-none select-none pointer-events-none tracking-tighter">
        {value.replace(/[^0-9KM.]/g, "")}
      </div>
    </div>
  );
}

/* ─── Order badge ────────────────────────────────────────────────────── */
const ORDER_BADGE: Record<OrderDoc["status"], string> = {
  pending:   "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped:   "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

/* ─── SVG area chart ─────────────────────────────────────────────────── */
const CHART_W = 400; const CHART_H = 100; const CHART_PAD = 4;

function RevenueChart({ vals, labels }: { vals: number[]; labels: string[] }) {
  const max = Math.max(...vals, 1);
  const pts = vals.map((v, i) => [
    CHART_PAD + (i / (vals.length - 1)) * (CHART_W - CHART_PAD * 2),
    CHART_PAD + (1 - v / max) * (CHART_H - CHART_PAD * 2),
  ]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length-1][0].toFixed(1)},${(CHART_H-CHART_PAD).toFixed(1)} L${pts[0][0].toFixed(1)},${(CHART_H-CHART_PAD).toFixed(1)} Z`;
  return (
    <div>
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full" style={{ height: "96px" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#chart-fill)" />
        <path d={line} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.5" fill="white" stroke="#0d9488" strokeWidth="2" />
        ))}
      </svg>
      <div className="flex justify-between mt-1.5 px-1">
        {labels.map(d => <span key={d} className="text-[10px] text-gray-400 font-medium">{d}</span>)}
      </div>
    </div>
  );
}

/* ─── Secondary mini stat ─────────────────────────────────────────────── */
function MiniStat({ label, value, color, icon }: {
  label: string; value: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/80 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <div>
        <p className="text-xl font-black text-gray-900 leading-none">{value}</p>
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-1">{label}</p>
      </div>
    </div>
  );
}

/* ─── Donut chart ─────────────────────────────────────────────────────── */
function DonutChart({ segments }: { segments: { pct: number; color: string; label: string; count: number }[] }) {
  const R = 48; const CX = 60; const CY = 60;
  const circ = 2 * Math.PI * R;
  const GAP = 4;
  let cumulative = 0;
  const arcs = segments.map(({ pct, color }) => {
    const dash = Math.max(0, pct * circ - GAP);
    const offset = circ * 0.25 - cumulative * circ;
    cumulative += pct;
    return { dash, offset, color };
  });
  const top = segments.reduce((a, b) => a.pct > b.pct ? a : b);
  return (
    <svg viewBox="0 0 120 120" width="120" height="120">
      {arcs.map(({ dash, offset, color }, i) => (
        <circle key={i} cx={CX} cy={CY} r={R} fill="none" stroke={color} strokeWidth="16"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="butt"
        />
      ))}
      <text x={CX} y={CY - 4} textAnchor="middle" fontSize="15" fontWeight="800" fill="#111827">
        {Math.round(top.pct * 100)}%
      </text>
      <text x={CX} y={CY + 11} textAnchor="middle" fontSize="8" fill="#9ca3af" fontWeight="600">
        {top.label}
      </text>
    </svg>
  );
}

const PRODUCT_COLORS = ["#0d9488","#6366f1","#f59e0b","#ec4899","#3b82f6"];

/* ─── Page ───────────────────────────────────────────────────────────── */
export default async function StoreDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const [store, recentOrders, stats] = await Promise.all([
    resolveStoreForSession(id, session),
    getRecentOrders(id),
    getStoreStats(id),
  ]);
  if (!store) notFound();

  return (
    <div className="flex-1 flex flex-col min-h-screen"
      style={{ backgroundColor: "#f0f5f4", backgroundImage: "radial-gradient(#c8deda 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <PageHeader
        title="Overview"
        subtitle="Store performance at a glance"
        store={store}
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>}
        stats={[
          { label: "Status", value: store.status },
        ]}
        actions={
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-semibold text-emerald-700">Live</span>
          </div>
        }
      />

      {/* Content */}
      <main className="flex-1 p-6 md:p-8 space-y-5">

        {/* ── Primary stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Revenue" value={fmtRevenue(store.revenue)} subValue="Total earned" change={`${stats.ordersByStatus.fulfilled} fulfilled`} positive
            grad="linear-gradient(135deg, #0d3d38 0%, #0f766e 60%, #14b8a6 100%)"
            sparkId="sp-rev" delay="0ms" vals={stats.dailyRevenue.map(v => v || 0)}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          />
          <StatCard
            label="Orders" value={stats.ordersByStatus.total.toLocaleString()} subValue="All time" change={`${stats.ordersByStatus.pending} pending`} positive={stats.ordersByStatus.pending === 0}
            grad="linear-gradient(135deg, #312e81 0%, #4f46e5 60%, #818cf8 100%)"
            sparkId="sp-ord" delay="75ms" vals={stats.dailyOrders.map(v => v || 0)}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>}
          />
          <StatCard
            label="Customers" value={store.customers.toLocaleString()} subValue="Unique buyers" change={`${stats.repeatBuyerRate}% repeat`} positive={stats.repeatBuyerRate > 0}
            grad="linear-gradient(135deg, #78350f 0%, #d97706 60%, #fbbf24 100%)"
            sparkId="sp-cus" delay="150ms" vals={stats.dailyOrders.map(v => v || 0)}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          />
          <StatCard
            label="Products" value={store.products.toLocaleString()} subValue="Listed" change={`${store.products} active`} positive
            grad="linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #60a5fa 100%)"
            sparkId="sp-pro" delay="225ms" vals={Array.from({length:7},(_,i)=>Math.max(0,store.products-6+i))}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
          />
        </div>

        {/* ── Secondary stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MiniStat label="Avg. Order" value={`${stats.avgOrderValue} MAD`} color="#0d9488"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          />
          <MiniStat label="Fulfillment" value={`${stats.fulfillmentRate}%`} color="#10b981"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
          />
          <MiniStat label="Fulfilled" value={stats.ordersByStatus.fulfilled.toLocaleString()} color="#6366f1"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
          />
          <MiniStat label="Cancelled" value={stats.ordersByStatus.cancelled.toLocaleString()} color="#ef4444"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.45"/></svg>}
          />
          <MiniStat label="Pending" value={stats.ordersByStatus.pending.toLocaleString()} color="#f59e0b"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>}
          />
          <MiniStat label="Repeat Buyers" value={`${stats.repeatBuyerRate}%`} color="#8b5cf6"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          />
        </div>

        {/* ── Revenue chart + Recent Orders ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100/60">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-sm font-bold text-gray-900">Revenue Trend</p>
                <p className="text-xs text-gray-400 mt-0.5">This week · daily</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{fmtRevenue(store.revenue)}</p>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{fmtRevenue(stats.dailyRevenue.reduce((a,b)=>a+b,0))} this week</span>
              </div>
            </div>
            <RevenueChart vals={stats.dailyRevenue} labels={stats.dailyLabels} />
          </div>

          <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100/60">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-bold text-gray-900">Recent Orders</p>
                <p className="text-xs text-gray-400 mt-0.5">{recentOrders.length} latest transactions</p>
              </div>
              <button className="text-xs font-semibold text-[#0d3d38] bg-[#f0faf9] hover:bg-[#e0f5f2] px-3 py-1.5 rounded-lg transition-colors">
                View all →
              </button>
            </div>
            <div className="space-y-1">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No orders yet.</p>
              ) : recentOrders.map(order => {
                const hues = ["#ec4899","#3b82f6","#f59e0b","#8b5cf6","#10b981","#ef4444","#f97316","#06b6d4"];
                const name = order.customerName;
                const avatarColor = hues[(name.charCodeAt(0) || 65) % hues.length];
                const initials = name.split(" ").slice(0,2).map((w: string) => w[0]).join("");
                const firstItem = order.items?.[0]?.productName ?? "";
                return (
                  <div key={order._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{ backgroundColor: avatarColor }}>{initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{firstItem}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-gray-900">{order.total} MAD</span>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full capitalize ${ORDER_BADGE[order.status]}`}>{order.status}</span>
                      <span className="text-[11px] text-gray-400 hidden sm:block">{order.createdAt}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Top Products + Order Status ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Top Products */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100/60">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-bold text-gray-900">Top Products</p>
                <p className="text-xs text-gray-400 mt-0.5">By units sold</p>
              </div>
              <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">This month</span>
            </div>
            <div className="space-y-4">
              {stats.topProducts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No orders yet.</p>
              ) : stats.topProducts.map((p, i) => {
                const maxCount = stats.topProducts[0].count;
                const pct = Math.round((p.count / maxCount) * 100);
                return (
                  <div key={p.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-black text-gray-300 w-4">#{i+1}</span>
                        <p className="text-xs font-semibold text-gray-900 leading-tight">{p.name}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-xs font-bold text-gray-900">{p.count.toLocaleString()} orders</p>
                        <p className="text-[10px] text-gray-400">{p.revenue.toLocaleString()} MAD</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: PRODUCT_COLORS[i % PRODUCT_COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Status Donut */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100/60 flex flex-col">
            <div className="mb-5">
              <p className="text-sm font-bold text-gray-900">Order Status</p>
              <p className="text-xs text-gray-400 mt-0.5">All time breakdown</p>
            </div>
            {stats.ordersByStatus.total === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10 flex-1">No orders yet.</p>
            ) : (() => {
              const { fulfilled, pending, cancelled, total } = stats.ordersByStatus;
              const fPct = fulfilled / total;
              const pPct = pending   / total;
              const cPct = cancelled / total;
              const rows = [
                { label: "Delivered", pct: Math.round(fPct*100), count: fulfilled, color: "#10b981", bg: "bg-emerald-50 text-emerald-700" },
                { label: "Pending",   pct: Math.round(pPct*100), count: pending,   color: "#f59e0b", bg: "bg-amber-50 text-amber-700"   },
                { label: "Cancelled", pct: Math.round(cPct*100), count: cancelled, color: "#ef4444", bg: "bg-red-50 text-red-600"       },
              ];
              return (
                <div className="flex items-center gap-6 flex-1">
                  <DonutChart segments={[
                    { pct: fPct, color: "#10b981", label: "Delivered", count: fulfilled },
                    { pct: pPct, color: "#f59e0b", label: "Pending",   count: pending   },
                    { pct: cPct, color: "#ef4444", label: "Cancelled", count: cancelled },
                  ]} />
                  <div className="space-y-3 flex-1">
                    {rows.map(({ label, pct, color, bg }) => (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                            <span className="text-xs font-medium text-gray-700">{label}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${bg}`}>{pct}%</span>
                        </div>
                        <div className="h-1 bg-gray-100 rounded-full">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── Sales by Category + Activity Feed ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Top Products by Revenue */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100/60">
            <div className="mb-5">
              <p className="text-sm font-bold text-gray-900">Top by Revenue</p>
              <p className="text-xs text-gray-400 mt-0.5">Fulfilled orders revenue</p>
            </div>
            <div className="space-y-3">
              {stats.topProducts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No data yet.</p>
              ) : (() => {
                const max = Math.max(...stats.topProducts.map(p => p.revenue), 1);
                return stats.topProducts.map(({ name, revenue }, i) => (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 truncate mr-2">{name}</span>
                      <span className="text-xs font-bold text-gray-900 flex-shrink-0">{revenue.toLocaleString()} MAD</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(revenue/max)*100}%`, backgroundColor: PRODUCT_COLORS[i % PRODUCT_COLORS.length] }} />
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100/60">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-bold text-gray-900">Activity Feed</p>
                <p className="text-xs text-gray-400 mt-0.5">Latest store events</p>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <div className="space-y-0">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No recent activity.</p>
              ) : recentOrders.map((order, i) => {
                const statusIcon = order.status === "delivered" ? "✅" : order.status === "cancelled" ? "❌" : order.status === "shipped" ? "🚚" : "🕐";
                const dot = order.status === "delivered" ? "#10b981" : order.status === "cancelled" ? "#ef4444" : "#f59e0b";
                const firstItem = order.items?.[0]?.productName ?? "";
                return (
                  <div key={order._id} className="flex gap-3 group">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-sm group-hover:scale-110 transition-transform duration-200">
                        {statusIcon}
                      </div>
                      {i < recentOrders.length - 1 && (
                        <div className="w-px flex-1 my-1" style={{ backgroundColor: `${dot}30` }} />
                      )}
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-gray-900 leading-tight capitalize">Order {order.status}</p>
                        <span className="text-[10px] text-gray-400 font-medium flex-shrink-0">{order.createdAt}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">{order.customerName} · {firstItem} · {order.total} MAD</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Manage Products", sub: `${store.products} products listed`, color: store.color,
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
            { label: "Open Analytics",  sub: "View performance insights",         color: "#0d3d38",
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
          ].map(({ label, sub, color, icon }) => (
            <button key={label}
              className="group bg-white rounded-2xl p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 shadow-sm border border-gray-100/60 text-left">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm"
                style={{ backgroundColor: color }}>{icon}</div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 group-hover:text-[#0d3d38] transition-colors">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-300 group-hover:text-[#0d9488] transition-colors">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          ))}
        </div>

      </main>
    </div>
  );
}
