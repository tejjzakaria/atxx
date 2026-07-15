"use client";

import { useState, useEffect, useCallback } from "react";
import { fmtRevenue } from "@/lib/stores";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

type OrderRow = {
  id: string;
  storeId: string;
  storeName: string;
  storeColor: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  paymentMethod: string;
  createdAt: string;
};

type StoreOption = { id: string; name: string; color: string };

const STATUS_OPTIONS: OrderRow["status"][] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const STATUS_BADGE: Record<OrderRow["status"], string> = {
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  shipped:   "bg-purple-50 text-purple-700 border-purple-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [error,  setError]  = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [storeFilter,   setStoreFilter]   = useState("");
  const [statusFilter,  setStatusFilter]  = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [dateFrom,      setDateFrom]      = useState("");
  const [dateTo,        setDateTo]        = useState("");
  const [pendingChange, setPendingChange] = useState<{ order: OrderRow; status: OrderRow["status"] } | null>(null);

  const fetchOrders = useCallback(async () => {
    const params = new URLSearchParams();
    if (storeFilter)   params.set("storeId", storeFilter);
    if (statusFilter)  params.set("status", statusFilter);
    if (paymentFilter) params.set("paymentMethod", paymentFilter);
    if (dateFrom)      params.set("dateFrom", dateFrom);
    if (dateTo)        params.set("dateTo", dateTo);
    const res = await fetch(`/api/admin/orders?${params}`);
    if (res.ok) setOrders(await res.json());
  }, [storeFilter, statusFilter, paymentFilter, dateFrom, dateTo]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { fetch("/api/admin/stores").then(r => r.ok ? r.json() : []).then(setStores); }, []);

  async function updateStatus(order: OrderRow, status: OrderRow["status"]) {
    setBusyId(order.id);
    setError("");
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    setPendingChange(null);
    if (!res.ok) { setError("Failed to update order status"); return; }
    fetchOrders();
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div className="sticky top-0 z-20 bg-white flex-shrink-0" style={{ boxShadow: "0 1px 0 #e5e7eb, 0 4px 16px rgba(0,0,0,0.04)" }}>
        <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #ec4899 0%, #0d9488 40%, #14b8a6 100%)" }} />
        <div className="px-6 md:px-8 py-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm bg-[#0d3d38]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-[17px] font-black text-gray-900 leading-tight tracking-tight">Orders</h1>
            <p className="text-[11.5px] text-gray-400 mt-0.5 font-medium truncate">Every order across every store</p>
          </div>
        </div>

        <div className="px-6 md:px-8 pb-3.5 flex flex-wrap items-center gap-2">
          <select value={storeFilter} onChange={e => setStoreFilter(e.target.value)}
            className="h-8 px-3 rounded-lg border border-gray-200 text-xs text-gray-600 outline-none focus:border-[#0d9488]">
            <option value="">All stores</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="h-8 px-3 rounded-lg border border-gray-200 text-xs text-gray-600 outline-none focus:border-[#0d9488]">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} placeholder="Payment method…"
            className="h-8 px-3 rounded-lg border border-gray-200 text-xs w-36 outline-none focus:border-[#0d9488]" />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="h-8 px-3 rounded-lg border border-gray-200 text-xs outline-none focus:border-[#0d9488]" />
          <span className="text-xs text-gray-300">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="h-8 px-3 rounded-lg border border-gray-200 text-xs outline-none focus:border-[#0d9488]" />
        </div>
      </div>

      <div className="flex-1 p-6 md:p-8">
        {error && (
          <div className="mb-4 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {!orders ? (
            <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">No orders match.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Store</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Payment</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-gray-900">{o.orderNumber}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-gray-600">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: o.storeColor }} />
                        {o.storeName}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">{o.customerName}</td>
                    <td className="px-6 py-3.5 font-semibold text-gray-900">{fmtRevenue(o.total)}</td>
                    <td className="px-6 py-3.5 text-gray-500 text-xs">{o.paymentMethod || "—"}</td>
                    <td className="px-6 py-3.5 text-gray-500 text-xs">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}</td>
                    <td className="px-6 py-3.5">
                      <select
                        value={o.status}
                        disabled={busyId === o.id}
                        onChange={e => setPendingChange({ order: o, status: e.target.value as OrderRow["status"] })}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border outline-none disabled:opacity-50 ${STATUS_BADGE[o.status]}`}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {pendingChange && (
        <ConfirmDialog
          title="Change Order Status"
          message={`Change ${pendingChange.order.orderNumber}'s status from "${pendingChange.order.status}" to "${pendingChange.status}"?${pendingChange.status === "cancelled" ? " This will also sync to the store's connected spreadsheet, if any." : ""}`}
          confirmLabel="Change Status"
          danger={pendingChange.status === "cancelled"}
          confirming={busyId === pendingChange.order.id}
          onClose={() => setPendingChange(null)}
          onConfirm={() => updateStatus(pendingChange.order, pendingChange.status)}
        />
      )}
    </div>
  );
}
