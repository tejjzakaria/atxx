import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getGlobalStoreStats, getAllStores } from "@/lib/db/stores";
import { fmtRevenue } from "@/lib/stores";

/* ─── SVG area chart (same shape as the per-store overview's RevenueChart) ── */
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
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full" style={{ height: "120px" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="admin-chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#admin-chart-fill)" />
        <path d={line} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.5" fill="white" stroke="#0d9488" strokeWidth="2" />
        ))}
      </svg>
      <div className="flex justify-between mt-1.5 px-1">
        {labels.map((d, i) => <span key={i} className="text-[10px] text-gray-400 font-medium">{d}</span>)}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80">
      <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
      <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mt-2">{label}</p>
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") notFound();

  const [stats, stores] = await Promise.all([getGlobalStoreStats(), getAllStores()]);
  const lifetimeRevenue = stores.reduce((sum, s) => sum + (s.revenue ?? 0), 0);
  const lifetimeOrders  = stores.reduce((sum, s) => sum + (s.orders ?? 0), 0);

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div className="sticky top-0 z-20 bg-white flex-shrink-0" style={{ boxShadow: "0 1px 0 #e5e7eb, 0 4px 16px rgba(0,0,0,0.04)" }}>
        <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #ec4899 0%, #0d9488 40%, #14b8a6 100%)" }} />
        <div className="px-6 md:px-8 py-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm bg-[#0d3d38]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-[17px] font-black text-gray-900 leading-tight tracking-tight">Global Analytics</h1>
            <p className="text-[11.5px] text-gray-400 mt-0.5 font-medium truncate">Performance across every store</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Stores"    value={String(stats.storeCount)} />
          <StatCard label="Active Stores"   value={String(stats.activeStoreCount)} />
          <StatCard label="Lifetime Revenue" value={fmtRevenue(lifetimeRevenue)} />
          <StatCard label="Lifetime Orders"  value={lifetimeOrders.toLocaleString()} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-900">Revenue — last 7 days</p>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                {fmtRevenue(stats.dailyRevenue.reduce((a, b) => a + b, 0))} this week
              </span>
            </div>
            <RevenueChart vals={stats.dailyRevenue} labels={stats.dailyLabels} />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-4">
            <p className="text-sm font-bold text-gray-900">Order status (7d)</p>
            <div className="space-y-2.5">
              {[
                { label: "Delivered", value: stats.ordersByStatus.fulfilled, color: "#10b981" },
                { label: "In progress", value: stats.ordersByStatus.pending, color: "#f59e0b" },
                { label: "Cancelled", value: stats.ordersByStatus.cancelled, color: "#ef4444" },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-600">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }} />
                    {row.label}
                  </span>
                  <span className="font-semibold text-gray-900">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="text-gray-500">Fulfillment rate</span>
              <span className="font-bold text-gray-900">{stats.fulfillmentRate}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Avg order value</span>
              <span className="font-bold text-gray-900">{fmtRevenue(stats.avgOrderValue)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900">Top stores (delivered revenue)</p>
          </div>
          {stats.topStores.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">No delivered orders yet.</div>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {stats.topStores.map((s, i) => (
                  <tr key={s.id}>
                    <td className="px-6 py-3 w-8 text-gray-400 font-semibold">{i + 1}</td>
                    <td className="px-6 py-3 font-semibold text-gray-900">{s.name}</td>
                    <td className="px-6 py-3 text-gray-500 text-right">{s.orders} orders</td>
                    <td className="px-6 py-3 font-bold text-gray-900 text-right">{fmtRevenue(s.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
