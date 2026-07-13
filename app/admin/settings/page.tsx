"use client";

import { useState, useEffect } from "react";
import StoreSettingsPanel from "@/components/settings/StoreSettingsPanel";

type SettingsData = {
  defaultCurrency: string;
  defaultCountry: string;
  deploy: {
    vercelTokenConfigured: boolean;
    storefrontRepo: string | null;
    vercelTeamId: string | null;
  };
};

type StoreOption = { id: string; name: string; color: string };

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
      ok ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"
    }`}>
      {label}
    </span>
  );
}

function PlatformSettingsView() {
  const [data,    setData]    = useState<SettingsData | null>(null);
  const [currency, setCurrency] = useState("");
  const [country,  setCountry]  = useState("");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.ok ? r.json() : null).then(d => {
      if (!d) return;
      setData(d);
      setCurrency(d.defaultCurrency);
      setCountry(d.defaultCountry);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defaultCurrency: currency, defaultCountry: country }),
    });
    setSaving(false);
    if (!res.ok) { setError("Failed to save settings"); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">New Store Defaults</p>
          <p className="text-xs text-gray-400 mt-0.5">Applied automatically when a new store is created — owners can still change these per-store afterward.</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Default Currency</label>
            <input value={currency} onChange={e => setCurrency(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Default Country</label>
            <input value={country} onChange={e => setCountry(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20" />
          </div>
          <div className="flex items-center justify-end gap-3 pt-1">
            {saved && <span className="text-xs text-emerald-600 font-semibold">Saved</span>}
            <button onClick={handleSave} disabled={saving}
              className="h-9 px-5 rounded-xl bg-[#0d3d38] hover:bg-[#0f4a43] disabled:opacity-50 text-white text-sm font-semibold transition-colors">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">Deploy Integration</p>
          <p className="text-xs text-gray-400 mt-0.5">Read-only — configured via environment variables, not editable here.</p>
        </div>
        <div className="px-6 py-5 space-y-3">
          {!data ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Vercel API Token</span>
                <StatusPill ok={data.deploy.vercelTokenConfigured} label={data.deploy.vercelTokenConfigured ? "Configured" : "Not set"} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Storefront Repo</span>
                <span className="font-mono text-xs text-gray-700">{data.deploy.storefrontRepo ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Vercel Team</span>
                <span className="font-mono text-xs text-gray-700">{data.deploy.vercelTeamId ?? "Personal account"}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StoreSettingsView() {
  const [stores,   setStores]   = useState<StoreOption[]>([]);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    fetch("/api/admin/stores").then(r => r.ok ? r.json() : []).then(setStores);
  }, []);

  return (
    <div className="space-y-4">
      <div className="max-w-md">
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Choose a store to manage</label>
        <select value={selected} onChange={e => setSelected(e.target.value)}
          className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 bg-white">
          <option value="">Select a store…</option>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {selected ? (
        <div className="-mx-6 md:-mx-8 -mb-6 md:-mb-8">
          <StoreSettingsPanel storeId={selected} showHeader={false} />
        </div>
      ) : (
        <p className="text-sm text-gray-400 py-8">Pick a store above to see and edit its full settings — General, Appearance, API, Pixels, Deploy, Domains, Content, and Danger Zone.</p>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  const [view, setView] = useState<"platform" | "store">("platform");

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div className="sticky top-0 z-20 bg-white flex-shrink-0" style={{ boxShadow: "0 1px 0 #e5e7eb, 0 4px 16px rgba(0,0,0,0.04)" }}>
        <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #ec4899 0%, #0d9488 40%, #14b8a6 100%)" }} />
        <div className="px-6 md:px-8 py-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm bg-[#0d3d38]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-[17px] font-black text-gray-900 leading-tight tracking-tight">Settings</h1>
            <p className="text-[11.5px] text-gray-400 mt-0.5 font-medium truncate">Platform defaults, integrations, and per-store configuration</p>
          </div>
        </div>

        <div className="px-6 md:px-8 pb-3.5 flex items-center gap-2">
          <button onClick={() => setView("platform")}
            className={`h-8 px-4 rounded-lg text-xs font-semibold transition-colors ${view === "platform" ? "bg-[#0d3d38] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            Platform
          </button>
          <button onClick={() => setView("store")}
            className={`h-8 px-4 rounded-lg text-xs font-semibold transition-colors ${view === "store" ? "bg-[#0d3d38] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            Store Settings
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-8">
        {view === "platform" ? <PlatformSettingsView /> : <StoreSettingsView />}
      </div>
    </div>
  );
}
