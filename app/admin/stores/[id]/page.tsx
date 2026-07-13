import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { getStoreStats, getRecentOrders } from "@/lib/db/stores";
import { fmtRevenue, STATUS_DOT } from "@/lib/stores";
import AdminStoreActions from "./AdminStoreActions";

type Ctx = { params: Promise<{ id: string }> };

export default async function AdminStoreDetailPage({ params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") notFound();

  const { id } = await params;
  if (!ObjectId.isValid(id)) notFound();

  const db  = getDb();
  const oid = new ObjectId(id);
  const store = await db.collection("Store").findOne({ _id: oid });
  if (!store) notFound();

  const [owner, stats, recentOrders] = await Promise.all([
    store.ownerId ? db.collection("User").findOne({ _id: new ObjectId(store.ownerId) }) : null,
    getStoreStats(id),
    getRecentOrders(id),
  ]);

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div className="sticky top-0 z-20 bg-white flex-shrink-0" style={{ boxShadow: "0 1px 0 #e5e7eb, 0 4px 16px rgba(0,0,0,0.04)" }}>
        <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${store.color} 0%, #0d9488 100%)` }} />
        <div className="px-6 md:px-8 py-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm" style={{ backgroundColor: store.color }}>
            {store.initials}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[17px] font-black text-gray-900 leading-tight tracking-tight">{store.name}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[store.status as keyof typeof STATUS_DOT]}`} />
              <span className="text-[11.5px] text-gray-400 font-medium">{store.status}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80">
            <p className="text-2xl font-black text-gray-900 leading-none">{fmtRevenue(store.revenue ?? 0)}</p>
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mt-2">Revenue</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80">
            <p className="text-2xl font-black text-gray-900 leading-none">{store.orders ?? 0}</p>
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mt-2">Orders</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80">
            <p className="text-2xl font-black text-gray-900 leading-none">{store.products ?? 0}</p>
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mt-2">Products</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80">
            <p className="text-2xl font-black text-gray-900 leading-none">{stats.fulfillmentRate}%</p>
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mt-2">Fulfillment rate</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900">Recent Orders</p>
              </div>
              {recentOrders.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">No orders yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-50">
                    {recentOrders.map(o => (
                      <tr key={o._id}>
                        <td className="px-6 py-3 font-semibold text-gray-900">{o.orderNumber}</td>
                        <td className="px-6 py-3 text-gray-600">{o.customerName}</td>
                        <td className="px-6 py-3 text-gray-500 text-xs">{o.status}</td>
                        <td className="px-6 py-3 text-right font-semibold text-gray-900">{fmtRevenue(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-6 space-y-3">
              <p className="text-sm font-bold text-gray-900">Deployment</p>
              {store.deploy?.status ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Storefront</span>
                  {store.deploy.url ? (
                    <a href={store.deploy.url} target="_blank" rel="noreferrer" className="font-semibold text-[#0d9488] hover:underline">
                      {store.deploy.url.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Not deployed yet.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-6 space-y-3">
              <p className="text-sm font-bold text-gray-900">Owner</p>
              <div>
                <p className="text-sm font-semibold text-gray-900">{owner?.name || "Unknown"}</p>
                <p className="text-xs text-gray-500">{owner?.email ?? ""}</p>
              </div>
            </div>

            <AdminStoreActions
              storeId={id}
              storeName={store.name}
              status={store.status}
              ownerId={store.ownerId?.toString() ?? ""}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
