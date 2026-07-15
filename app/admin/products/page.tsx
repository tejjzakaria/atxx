"use client";

import { useState, useEffect, useCallback } from "react";
import { fmtRevenue } from "@/lib/stores";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

type ProductRow = {
  id: string;
  storeId: string;
  storeName: string;
  storeColor: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number | null;
  stock: number;
  status: "Active" | "Draft" | "Out of Stock";
};

type StoreOption = { id: string; name: string; color: string };

const STATUS_BADGE: Record<ProductRow["status"], string> = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Draft: "bg-gray-100 text-gray-600 border-gray-200",
  "Out of Stock": "bg-red-50 text-red-700 border-red-200",
};

function ProductModal({
  stores, product, onClose, onSaved,
}: {
  stores: StoreOption[];
  product: ProductRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [storeId,  setStoreId]  = useState(product?.storeId ?? "");
  const [name,     setName]     = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [price,    setPrice]    = useState(String(product?.price ?? ""));
  const [stock,    setStock]    = useState(String(product?.stock ?? ""));
  const [status,   setStatus]   = useState<ProductRow["status"]>(product?.status ?? "Active");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  async function handleSave() {
    if (!name.trim() || !category.trim() || !price || !stock) return;
    if (!product && !storeId) { setError("Select a store"); return; }
    setSaving(true);
    setError("");

    const url = product ? `/api/admin/products/${product.id}` : "/api/admin/products";
    const method = product ? "PATCH" : "POST";
    const body = product
      ? { name, category, price: Number(price), stock: Number(stock), status }
      : { storeId, name, category, price: Number(price), stock: Number(stock) };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#0d3d38] to-[#14b8a6]" />
        <div className="p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-5">{product ? "Edit Product" : "New Product"}</h2>

          {error && (
            <p className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex flex-col gap-3">
            {!product && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Store</label>
                <select value={storeId} onChange={e => setStoreId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20">
                  <option value="">Select a store…</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
              <input value={category} onChange={e => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Price</label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Stock</label>
                <input type="number" value={stock} onChange={e => setStock(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20" />
              </div>
            </div>
            {product && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as ProductRow["status"])}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20">
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 h-11 rounded-xl bg-[#0d3d38] hover:bg-[#0f4a43] text-white text-sm font-semibold transition-colors disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[] | null>(null);
  const [stores,   setStores]   = useState<StoreOption[]>([]);
  const [error,    setError]    = useState("");

  const [storeFilter,  setStoreFilter]  = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search,       setSearch]       = useState("");
  const [minPrice,     setMinPrice]     = useState("");
  const [maxPrice,     setMaxPrice]     = useState("");

  const [editing,  setEditing]  = useState<ProductRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ProductRow | null>(null);

  const fetchProducts = useCallback(async () => {
    const params = new URLSearchParams();
    if (storeFilter)  params.set("storeId", storeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (search)       params.set("search", search);
    if (minPrice)     params.set("minPrice", minPrice);
    if (maxPrice)      params.set("maxPrice", maxPrice);
    const res = await fetch(`/api/admin/products?${params}`);
    if (res.ok) setProducts(await res.json());
  }, [storeFilter, statusFilter, search, minPrice, maxPrice]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetch("/api/admin/stores").then(r => r.ok ? r.json() : []).then(setStores); }, []);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setDeletingId(null);
    setConfirmDelete(null);
    if (!res.ok) { setError("Failed to delete product"); return; }
    fetchProducts();
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div className="sticky top-0 z-20 bg-white flex-shrink-0" style={{ boxShadow: "0 1px 0 #e5e7eb, 0 4px 16px rgba(0,0,0,0.04)" }}>
        <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #ec4899 0%, #0d9488 40%, #14b8a6 100%)" }} />
        <div className="px-6 md:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm bg-[#0d3d38]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-[17px] font-black text-gray-900 leading-tight tracking-tight">Products</h1>
              <p className="text-[11.5px] text-gray-400 mt-0.5 font-medium truncate">Every product across every store</p>
            </div>
          </div>
          <button onClick={() => setCreating(true)}
            className="h-9 px-4 rounded-xl bg-[#0d3d38] hover:bg-[#0f4a43] text-white text-xs font-semibold transition-colors whitespace-nowrap">
            + New Product
          </button>
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
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name…"
            className="h-8 px-3 rounded-lg border border-gray-200 text-xs w-40 outline-none focus:border-[#0d9488]" />
          <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min price"
            className="h-8 px-3 rounded-lg border border-gray-200 text-xs w-24 outline-none focus:border-[#0d9488]" />
          <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max price"
            className="h-8 px-3 rounded-lg border border-gray-200 text-xs w-24 outline-none focus:border-[#0d9488]" />
        </div>
      </div>

      <div className="flex-1 p-6 md:p-8">
        {error && (
          <div className="mb-4 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {!products ? (
            <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">No products match.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Store</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Stock</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-gray-900">{p.name}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-gray-600">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.storeColor }} />
                        {p.storeName}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-500">{p.category}</td>
                    <td className="px-6 py-3.5 text-gray-700">{fmtRevenue(p.price)}</td>
                    <td className="px-6 py-3.5 text-gray-700">{p.stock}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_BADGE[p.status]}`}>{p.status}</span>
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => setEditing(p)} className="text-xs font-semibold text-[#0d9488] hover:underline">Edit</button>
                        <button
                          onClick={() => setConfirmDelete(p)}
                          disabled={deletingId === p.id}
                          className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-40"
                        >
                          {deletingId === p.id ? "…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Product"
          message={`Delete "${confirmDelete.name}" from ${confirmDelete.storeName}? This can't be undone.`}
          confirmLabel="Delete"
          danger
          confirming={deletingId === confirmDelete.id}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete.id)}
        />
      )}

      {(editing || creating) && (
        <ProductModal
          stores={stores}
          product={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={fetchProducts}
        />
      )}
    </div>
  );
}
