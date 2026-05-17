"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/hooks/useStore";
import { PageHeader } from "@/components/PageHeader";

/* ─── Types ──────────────────────────────────────────────────────────── */
const RANGES = ["7D", "30D", "90D"] as const;
type Range = typeof RANGES[number];

type DataPoint = { label: string; value: number };
type AnalyticsData = {
  revenue:         { total: number; data: DataPoint[] };
  orders:          { total: number; data: DataPoint[] };
  avgOrder:        number;
  statusBreakdown: { fulfilled: number; pending: number; cancelled: number };
  topProducts:     { name: string; revenue: number; orders: number; pct: number }[];
  categoryRevenue: { name: string; value: number; color: string }[];
  catTotal:        number;
  bestDay:         string;
  topCategory:     string;
  returnRate:      number;
};

/* ─── SVG helpers ────────────────────────────────────────────────────── */
function AreaChart({ data, color = "#0d9488" }: { data: DataPoint[]; color?: string }) {
  if (!data.length) return null;
  const W = 500; const H = 120; const PAD = 8;
  const max = Math.max(...data.map(d => d.value), 1);
  const pts = data.map((d, i) => [
    PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2),
    PAD + (1 - d.value / max) * (H - PAD * 2),
  ]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${(H - PAD).toFixed(1)} L${pts[0][0].toFixed(1)},${(H - PAD).toFixed(1)} Z`;
  const gradId = `grad-${color.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill="white" stroke={color} strokeWidth="2" />
      ))}
    </svg>
  );
}

function BarChart({ data, color = "#0d3d38" }: { data: DataPoint[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <div className="w-full rounded-t-lg transition-all duration-500 relative group"
            style={{ height: `${(d.value / max) * 100}%`, backgroundColor: color, opacity: 0.85 }}>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {d.value.toLocaleString()}
            </div>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = 42; const cx = 56; const cy = 56;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const segments = data.map(d => {
    const dash = (d.value / total) * circumference;
    const seg = { ...d, dash, offset };
    offset += dash;
    return seg;
  });
  return (
    <div className="flex items-center gap-6">
      <svg width="112" height="112" viewBox="0 0 112 112" className="flex-shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="14" />
        {segments.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth="14"
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={-s.offset + circumference * 0.25}
            strokeLinecap="butt"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="13" fontWeight="700" fill="#111827">{data[0]?.value ?? 0}%</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#9ca3af" fontWeight="500">fulfilled</text>
      </svg>
      <div className="flex flex-col gap-2.5">
        {data.map(d => (
          <div key={d.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-xs text-gray-600 font-medium">{d.label}</span>
            <span className="text-xs font-bold text-gray-900 ml-auto pl-4">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Metric card ────────────────────────────────────────────────────── */
function MiniSpark({ vals, id }: { vals: number[]; id: string }) {
  const W = 140; const H = 36; const P = 3;
  const min = Math.min(...vals); const max = Math.max(...vals);
  const norm = vals.map(v => max === min ? 0.5 : (v - min) / (max - min));
  const pts = norm.map((n, i) => [
    P + (i / Math.max(norm.length - 1, 1)) * (W - P * 2),
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

function MetricCard({ label, value, sub, grad, sparkId, vals, delay, icon }: {
  label: string; value: string; sub?: string;
  grad: string; sparkId: string; vals: number[]; delay: string; icon: React.ReactNode;
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden"
      style={{ background: grad, animation: "cardIn 0.55s cubic-bezier(0.22,1,0.36,1) both", animationDelay: delay }}>
      <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "14px 14px" }} />
      <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full blur-3xl opacity-25 pointer-events-none bg-white" />
      <div className="relative z-10 p-4">
        <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/20 flex items-center justify-center text-white mb-4">{icon}</div>
        <p className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.12em] mb-1">{label}</p>
        <p className="text-2xl font-black text-white leading-none tracking-tight">{value}</p>
        {sub && <p className="text-[11px] text-white/40 mt-1 font-medium">{sub}</p>}
        <div className="mt-3 -mx-1"><MiniSpark vals={vals} id={sparkId} /></div>
      </div>
      <div className="absolute bottom-1 right-2 text-[3rem] font-black text-white/[0.05] leading-none select-none pointer-events-none tracking-tighter">
        {value.replace(/[^0-9KM.%]/g, "")}
      </div>
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────────── */
function Sk({ className }: { className?: string }) {
  return <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />;
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const { store, loading: storeLoading } = useStore(id);

  const [range,   setRange]   = useState<Range>("7D");
  const [data,    setData]    = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stores/${id}/analytics?range=${range}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); });
  }, [id, range]);

  if (storeLoading || !store) return null;

  const revData  = data?.revenue.data  ?? [];
  const ordData  = data?.orders.data   ?? [];
  const revVals  = revData.map(d => d.value);
  const ordVals  = ordData.map(d => d.value);

  const donutData = data ? [
    { label: "Fulfilled", value: data.statusBreakdown.fulfilled, color: "#10b981" },
    { label: "Pending",   value: data.statusBreakdown.pending,   color: "#f59e0b" },
    { label: "Cancelled", value: data.statusBreakdown.cancelled, color: "#ef4444" },
  ] : [];

  return (
    <div className="flex-1 flex flex-col min-h-screen"
      style={{ backgroundColor: "#f0f5f4", backgroundImage: "radial-gradient(#c8deda 1px, transparent 1px)", backgroundSize: "24px 24px" }}>

      <PageHeader
        title="Analytics"
        subtitle="Track revenue, orders, and top-performing products"
        store={store}
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
        actions={
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
            {RANGES.map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  range === r ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>
                {r}
              </button>
            ))}
          </div>
        }
      />

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <main className="flex-1 p-6 md:p-8 space-y-5">

        {/* ── KPI row ── */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Sk key={i} className="h-[152px] rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Revenue"
              value={data!.revenue.total >= 1000 ? `${(data!.revenue.total / 1000).toFixed(1)}K MAD` : `${data!.revenue.total} MAD`}
              sub="this period"
              grad="linear-gradient(135deg, #0d3d38 0%, #0f766e 60%, #14b8a6 100%)"
              sparkId="an-rev" delay="0ms" vals={revVals.length > 1 ? revVals : [0,1]}
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
            />
            <MetricCard label="Orders"
              value={data!.orders.total.toLocaleString()}
              sub="placed"
              grad="linear-gradient(135deg, #312e81 0%, #4f46e5 60%, #818cf8 100%)"
              sparkId="an-ord" delay="75ms" vals={ordVals.length > 1 ? ordVals : [0,1]}
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>}
            />
            <MetricCard label="Avg. Order"
              value={`${data!.avgOrder.toLocaleString()} MAD`}
              sub="per order"
              grad="linear-gradient(135deg, #78350f 0%, #d97706 60%, #fbbf24 100%)"
              sparkId="an-avg" delay="150ms" vals={ordVals.length > 1 ? ordVals : [0,1]}
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
            />
            <MetricCard label="Fulfillment"
              value={`${data!.statusBreakdown.fulfilled}%`}
              sub="of all orders"
              grad="linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #60a5fa 100%)"
              sparkId="an-ful" delay="225ms" vals={revVals.length > 1 ? revVals : [0,1]}
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
            />
          </div>
        )}

        {/* ── Revenue + Orders charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80">
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-sm font-bold text-gray-900">Revenue</p>
                <p className="text-xs text-gray-400 mt-0.5">{range} · breakdown</p>
              </div>
              {loading ? <Sk className="w-24 h-8" /> : (
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {data!.revenue.total >= 1000
                      ? `${(data!.revenue.total / 1000).toFixed(1)}K MAD`
                      : `${data!.revenue.total} MAD`}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-4">
              {loading ? <Sk className="w-full h-[120px]" /> : (
                <>
                  <AreaChart data={revData} color="#0d9488" />
                  <div className="flex justify-between mt-1.5 px-1">
                    {revData.map(d => <span key={d.label} className="text-[10px] text-gray-400 font-medium">{d.label}</span>)}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80">
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-sm font-bold text-gray-900">Orders</p>
                <p className="text-xs text-gray-400 mt-0.5">{range} · volume</p>
              </div>
              {loading ? <Sk className="w-16 h-8" /> : (
                <p className="text-lg font-bold text-gray-900">{data!.orders.total.toLocaleString()}</p>
              )}
            </div>
            <div className="mt-5">
              {loading ? <Sk className="w-full h-28" /> : <BarChart data={ordData} color="#0d3d38" />}
            </div>
          </div>
        </div>

        {/* ── Bottom row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Top products */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-bold text-gray-900">Top Products</p>
                <p className="text-xs text-gray-400 mt-0.5">by units sold</p>
              </div>
              <span className="text-xs font-semibold text-[#0d3d38] bg-[#f0faf9] border border-[#c8ede8] px-3 py-1.5 rounded-xl">All time</span>
            </div>
            {loading ? (
              <div className="space-y-4">{[...Array(5)].map((_, i) => <Sk key={i} className="h-10" />)}</div>
            ) : data!.topProducts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No products yet</p>
            ) : (
              <div className="space-y-4">
                {data!.topProducts.map((p, i) => (
                  <div key={p.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-bold text-gray-300 w-4">{i + 1}</span>
                        <span className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <span className="text-xs text-gray-400 font-medium hidden sm:block">{p.orders} sold</span>
                        <span className="text-sm font-bold text-gray-900">
                          {p.revenue >= 1000 ? `${(p.revenue / 1000).toFixed(1)}K` : p.revenue} MAD
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${p.pct}%`, background: "linear-gradient(90deg, #0d3d38, #0d9488)" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right col: donut + categories */}
          <div className="flex flex-col gap-4">

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80">
              <p className="text-sm font-bold text-gray-900 mb-1">Order Status</p>
              <p className="text-xs text-gray-400 mb-5">fulfillment breakdown</p>
              {loading
                ? <Sk className="h-28" />
                : donutData.every(d => d.value === 0)
                  ? <p className="text-sm text-gray-400 text-center py-4">No orders yet</p>
                  : <DonutChart data={donutData} />
              }
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 flex-1">
              <p className="text-sm font-bold text-gray-900 mb-1">By Category</p>
              <p className="text-xs text-gray-400 mb-5">revenue share</p>
              {loading ? (
                <div className="space-y-3">{[...Array(4)].map((_, i) => <Sk key={i} className="h-8" />)}</div>
              ) : data!.categoryRevenue.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {data!.categoryRevenue.map(c => (
                    <div key={c.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="text-xs font-medium text-gray-600">{c.name}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-900">{Math.round((c.value / data!.catTotal) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${(c.value / data!.catTotal) * 100}%`, backgroundColor: c.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Insight strip ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Sk key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                title: "Best Day",
                value: data!.bestDay,
                sub: "Highest revenue in this period",
                color: "#8b5cf6",
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
              },
              {
                title: "Top Category",
                value: data!.topCategory,
                sub: "Highest product revenue share",
                color: "#0d9488",
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
              },
              {
                title: "Return Rate",
                value: `${data!.returnRate}%`,
                sub: "Customers who ordered more than once",
                color: "#ec4899",
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>,
              },
            ].map(({ title, value, sub, color, icon }) => (
              <div key={title} className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm border border-gray-100/80">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                  style={{ backgroundColor: color }}>
                  {icon}
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{title}</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">{value}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
