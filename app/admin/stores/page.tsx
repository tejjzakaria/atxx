import { notFound } from "next/navigation";
import Link from "next/link";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { STATUS_DOT, fmtRevenue, type Status } from "@/lib/stores";

type Row = {
  _id: string;
  name: string;
  color: string;
  initials: string;
  status: Status;
  revenue: number;
  orders: number;
  ownerName: string;
  ownerEmail: string;
};

async function getAllStoresWithOwners(): Promise<Row[]> {
  const db = getDb();
  const stores = await db.collection("Store").find({}).sort({ createdAt: -1 }).toArray();

  const ownerIds = [...new Set(stores.map(s => s.ownerId?.toString()).filter(Boolean))];
  const owners = await db.collection("User")
    .find({ _id: { $in: ownerIds.map(id => new ObjectId(id)) } })
    .project({ name: 1, email: 1 })
    .toArray();
  const ownerMap = new Map(owners.map(o => [o._id.toString(), o]));

  return stores.map(s => {
    const owner = ownerMap.get(s.ownerId?.toString());
    return {
      _id:        s._id.toString(),
      name:       s.name,
      color:      s.color,
      initials:   s.initials,
      status:     s.status,
      revenue:    s.revenue ?? 0,
      orders:     s.orders ?? 0,
      ownerName:  owner?.name ?? "Unknown",
      ownerEmail: owner?.email ?? "",
    };
  });
}

export default async function AdminStoresPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") notFound();

  const stores = await getAllStoresWithOwners();
  const totalRevenue = stores.reduce((sum, s) => sum + s.revenue, 0);
  const totalOrders  = stores.reduce((sum, s) => sum + s.orders, 0);
  const activeCount  = stores.filter(s => s.status === "Active").length;

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div className="sticky top-0 z-20 bg-white flex-shrink-0" style={{ boxShadow: "0 1px 0 #e5e7eb, 0 4px 16px rgba(0,0,0,0.04)" }}>
        <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #ec4899 0%, #0d9488 40%, #14b8a6 100%)" }} />
        <div className="px-6 md:px-8 py-3.5 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm bg-[#0d3d38]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-[17px] font-black text-gray-900 leading-tight tracking-tight">All Stores</h1>
              <p className="text-[11.5px] text-gray-400 mt-0.5 font-medium truncate">Every store across every owner</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {[
              { label: "Total Stores", value: String(stores.length) },
              { label: "Active",       value: String(activeCount) },
              { label: "Revenue",      value: fmtRevenue(totalRevenue) },
              { label: "Orders",       value: totalOrders.toLocaleString() },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-[15px] font-black text-gray-900 leading-none">{s.value}</p>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {stores.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">No stores yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  <th className="px-6 py-3">Store</th>
                  <th className="px-6 py-3">Owner</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Revenue</th>
                  <th className="px-6 py-3">Orders</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stores.map(s => (
                  <tr key={s._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                          style={{ backgroundColor: s.color }}>
                          {s.initials}
                        </div>
                        <span className="font-semibold text-gray-900">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="text-gray-700">{s.ownerName}</p>
                      <p className="text-xs text-gray-400">{s.ownerEmail}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s.status]}`} />
                        <span className="text-xs text-gray-500 font-medium">{s.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-700">{fmtRevenue(s.revenue)}</td>
                    <td className="px-6 py-3.5 text-gray-700">{s.orders.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-right">
                      <Link href={`/admin/stores/${s._id}`} className="text-xs font-semibold text-[#0d9488] hover:underline whitespace-nowrap">
                        View store →
                      </Link>
                    </td>
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
