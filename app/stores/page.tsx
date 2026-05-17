"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import ATXXLogo from "@/components/ATXXLogo";
import { STATUS_DOT, fmtRevenue } from "@/lib/stores";
import type { Status } from "@/lib/stores";

/* ─── Types ──────────────────────────────────────────────────────────── */
interface DbStore {
  _id: string;
  name: string;
  status: Status;
  revenue: number;
  orders: number;
  customers: number;
  products: number;
  color: string;
  initials: string;
}

/* ─── Icons ─────────────────────────────────────────────────────────── */
function PlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function ArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

/* ─── Hero quick-stat pill ───────────────────────────────────────────── */
function HeroPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-3 min-w-[100px]">
      <span className="text-white/50 text-[11px] font-medium uppercase tracking-widest">{label}</span>
      <span className="text-white text-xl font-bold leading-tight">{value}</span>
    </div>
  );
}

/* ─── Store card ─────────────────────────────────────────────────────── */
function StoreCard({ store }: { store: DbStore }) {
  return (
    <Link
      href={`/stores/${store._id}`}
      className="group relative bg-white rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
    >
      <div className="h-1 w-full" style={{ backgroundColor: store.color }} />

      <div className="p-6 flex flex-col gap-5 flex-1">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
            style={{ backgroundColor: store.color }}
          >
            {store.initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-snug">{store.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[store.status]}`} />
          <span className="text-xs text-gray-500 font-medium">{store.status}</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Revenue",  value: fmtRevenue(store.revenue) },
            { label: "Orders",   value: store.orders.toLocaleString() },
            { label: "Products", value: store.products.toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
              <p className="text-sm font-bold text-gray-900">{value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1 mt-auto">
          <span className="text-xs font-semibold text-[#0d3d38]">Open dashboard</span>
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0"
            style={{ backgroundColor: store.color }}
          >
            <ArrowRight />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─── Skeleton card ──────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
      <div className="h-1 w-full bg-gray-200" />
      <div className="p-6 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-gray-200 rounded w-3/4" />
            <div className="h-2.5 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
        <div className="h-2.5 bg-gray-100 rounded w-1/4" />
        <div className="grid grid-cols-3 gap-3">
          {[0,1,2].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
        </div>
        <div className="h-3 bg-gray-100 rounded w-1/3 mt-1" />
      </div>
    </div>
  );
}

/* ─── Add store card ─────────────────────────────────────────────────── */
function AddStoreCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group bg-white/60 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-4 p-8 hover:border-[#0d9488] hover:bg-white hover:shadow-md transition-all duration-200 min-h-[260px]"
    >
      <div className="w-14 h-14 rounded-2xl bg-gray-100 group-hover:bg-[#f0faf9] flex items-center justify-center text-gray-300 group-hover:text-[#0d9488] transition-colors duration-200">
        <PlusIcon />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">Create New Store</p>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">Set up a new ATXX store<br />in minutes</p>
      </div>
    </button>
  );
}

/* ─── Add store modal ────────────────────────────────────────────────── */
const COLORS = ["#ec4899","#3b82f6","#f59e0b","#8b5cf6","#10b981","#ef4444","#f97316","#0d9488"];

function AddStoreModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name,     setName]     = useState("");
  const [color,    setColor]    = useState(COLORS[0]);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");

    const initials = name.trim().split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

    const res = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), color, initials }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
      return;
    }
    onCreated();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#0d3d38] to-[#14b8a6]" />
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Create a New Store</h2>
              <p className="text-sm text-gray-400 mt-0.5">Your store will be hosted on ATXX.</p>
            </div>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors">
              <XIcon />
            </button>
          </div>

          {error && (
            <p className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Name</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Lumino Beauty" required
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0d9488] focus:bg-[#f0faf9] focus:ring-2 focus:ring-[#0d9488]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Store Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c} type="button"
                    onClick={() => setColor(c)}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
                    style={{ backgroundColor: c, outline: color === c ? `3px solid ${c}` : "none", outlineOffset: "2px" }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <button type="button" onClick={onClose}
                className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 h-11 rounded-xl bg-[#0d3d38] hover:bg-[#0f4a43] text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                {saving ? "Creating…" : "Create Store"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function StoreSelector() {
  const [stores,    setStores]    = useState<DbStore[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const { data: session } = useSession();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning ☀️" : hour < 17 ? "Good afternoon 🌤️" : hour < 21 ? "Good evening 🌙" : "Good night 🌑";

  const userName     = session?.user?.name ?? "there";
  const firstName    = userName.split(" ")[0];
  const userInitials = userName.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

  async function fetchStores() {
    setLoading(true);
    const res = await fetch("/api/stores");
    if (res.ok) {
      const data = await res.json();
      setStores(data);
    }
    setLoading(false);
  }

  useEffect(() => { fetchStores(); }, []);

  const activeCount  = stores.filter(s => s.status === "Active").length;
  const totalRevenue = stores.reduce((sum, s) => sum + s.revenue, 0);
  const totalOrders  = stores.reduce((sum, s) => sum + s.orders, 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f0f5f4", backgroundImage: "radial-gradient(#c8deda 1px, transparent 1px)", backgroundSize: "24px 24px" }}>

      {/* Dark teal hero */}
      <div className="relative overflow-hidden bg-[#0d3d38]">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 90% 0%, #1a6b5e 0%, transparent 55%)" }} />
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

        <header className="relative z-10 flex items-center justify-between px-8 pt-6 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
              <ATXXLogo size={22} variant="on-dark" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">ATXX</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 border border-white/20 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{userInitials}</span>
            </div>
            <span className="text-white/80 text-sm font-medium">{userName}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="ml-1 flex items-center gap-1.5 text-white/50 hover:text-white/90 text-xs font-medium transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>
          </div>
        </header>

        <div className="relative z-10 px-8 pt-10 pb-16">
          <p className="text-white/50 text-sm font-medium mb-2 tracking-wide">{greeting}</p>
          <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">Welcome back, {firstName}.</h1>
          <p className="text-white/50 text-base mt-2">Select a store to open its dashboard.</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <HeroPill label="Total Stores" value={String(stores.length)} />
            <HeroPill label="Active"       value={String(activeCount)} />
            <HeroPill label="Revenue"      value={fmtRevenue(totalRevenue)} />
            <HeroPill label="Orders"       value={totalOrders.toLocaleString()} />
          </div>
        </div>
      </div>

      {/* Store cards */}
      <div className="flex-1 px-8 pb-12 -mt-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading
            ? [0,1,2].map(i => <SkeletonCard key={i} />)
            : stores.map(store => <StoreCard key={store._id} store={store} />)
          }
          {!loading && <AddStoreCard onClick={() => setModalOpen(true)} />}
        </div>
      </div>

      {modalOpen && (
        <AddStoreModal
          onClose={() => setModalOpen(false)}
          onCreated={fetchStores}
        />
      )}
    </div>
  );
}
