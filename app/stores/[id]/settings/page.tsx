"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/hooks/useStore";
import type { StoreDoc, StoreContent } from "@/lib/db/stores";
import { PageHeader } from "@/components/PageHeader";

/* ─── Types ──────────────────────────────────────────────────────────── */
type Tab = "general" | "appearance" | "api" | "content" | "pixels" | "danger";

/* ─── Icons ──────────────────────────────────────────────────────────── */
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "general", label: "General",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  },
  {
    id: "appearance", label: "Appearance",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
  },
  {
    id: "api", label: "API",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  },
  {
    id: "content", label: "Content",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  },
  {
    id: "pixels", label: "Pixels",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  },
  {
    id: "danger", label: "Danger Zone",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  },
];

/* ─── Shared UI ──────────────────────────────────────────────────────── */
function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 py-5 border-b border-gray-100 last:border-0">
      <div className="sm:w-52 flex-shrink-0">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Input({ value, onChange, suffix, placeholder }: {
  value: string; onChange: (v: string) => void; suffix?: string; placeholder?: string;
}) {
  return (
    <div className="relative flex items-center">
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-10 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0d9488] focus:bg-[#f0faf9] focus:ring-2 focus:ring-[#0d9488]/20 transition-all"
        style={{ paddingRight: suffix ? `${suffix.length * 8 + 20}px` : undefined }}
      />
      {suffix && <span className="absolute right-3 text-xs text-gray-400 select-none pointer-events-none">{suffix}</span>}
    </div>
  );
}

function Textarea({ value, onChange, rows = 3, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0d9488] focus:bg-[#f0faf9] focus:ring-2 focus:ring-[#0d9488]/20 transition-all resize-none"
    />
  );
}

function Toggle({ enabled, onChange, label, sub }: {
  enabled: boolean; onChange: (v: boolean) => void; label: string; sub?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <button onClick={() => onChange(!enabled)} type="button"
        className={`relative flex-shrink-0 rounded-full transition-colors duration-200 ${enabled ? "bg-[#0d9488]" : "bg-gray-200"}`}
        style={{ width: 40, height: 22 }}>
        <span className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-200 ${enabled ? "translate-x-[18px]" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function SaveButton({ onClick, saved, saving }: { onClick: () => void; saved: boolean; saving?: boolean }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-2">
      {saved && (
        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          Saved
        </span>
      )}
      <button onClick={onClick} disabled={saving}
        className="h-9 px-5 rounded-xl bg-[#0d3d38] hover:bg-[#0f4a43] disabled:opacity-50 text-white text-sm font-semibold transition-colors">
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <p className="text-sm font-bold text-gray-900">{title}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <div className="px-6 py-2">{children}</div>
    </div>
  );
}

/* ─── useSave hook ───────────────────────────────────────────────────── */
function useSave(storeId: string, onSaved?: () => void) {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  async function save(patch: Record<string, unknown>) {
    setSaving(true);
    await fetch(`/api/stores/${storeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    setSaved(true);
    onSaved?.();
    setTimeout(() => setSaved(false), 2500);
  }

  return { save, saving, saved };
}

/* ─── Tab: General ───────────────────────────────────────────────────── */
function GeneralTab({ store, onSaved }: { store: StoreDoc; onSaved: () => void }) {
  const [name,     setName]     = useState(store.name);
  const [url,      setUrl]      = useState(store.url      ?? "");
  const [desc,     setDesc]     = useState(store.desc     ?? "");
  const [email,    setEmail]    = useState(store.email    ?? "");
  const [phone,    setPhone]    = useState(store.phone    ?? "");
  const [country,  setCountry]  = useState(store.country  ?? "Morocco");
  const [currency, setCurrency] = useState(store.currency ?? "MAD – Moroccan Dirham");
  const [sheetsId, setSheetsId] = useState(store.sheetsId ?? "");

  const { save: saveInfo,    saving: savingInfo,    saved: savedInfo    } = useSave(store._id, onSaved);
  const { save: saveContact, saving: savingContact, saved: savedContact } = useSave(store._id, onSaved);
  const { save: saveLoc,     saving: savingLoc,     saved: savedLoc     } = useSave(store._id, onSaved);
  const { save: saveSheets,  saving: savingSheets,  saved: savedSheets  } = useSave(store._id, onSaved);

  return (
    <div className="space-y-4">
      <Section title="Store Information" sub="Basic details about your store">
        <Field label="Store Name" hint="Displayed across your dashboard and storefront.">
          <Input value={name} onChange={setName} placeholder="Store name" />
        </Field>
        <Field label="Storefront URL" hint="The public URL of your customer-facing website.">
          <Input value={url} onChange={setUrl} placeholder="https://mystore.com" />
        </Field>
        <Field label="Description" hint="A short summary shown to customers.">
          <Textarea value={desc} onChange={setDesc} />
        </Field>
        <SaveButton onClick={() => saveInfo({ name, url, desc })} saving={savingInfo} saved={savedInfo} />
      </Section>

      <Section title="Contact Details" sub="How customers and your team can reach you">
        <Field label="Contact Email">
          <Input value={email} onChange={setEmail} placeholder="hello@store.com" />
        </Field>
        <Field label="Phone Number">
          <Input value={phone} onChange={setPhone} placeholder="+212 6 00 00 00 00" />
        </Field>
        <SaveButton onClick={() => saveContact({ email, phone })} saving={savingContact} saved={savedContact} />
      </Section>

      <Section title="Localisation" sub="Currency and region settings">
        <Field label="Country">
          <select value={country} onChange={e => setCountry(e.target.value)}
            className="w-full h-10 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 transition-all bg-white">
            <option>Morocco</option><option>France</option><option>UAE</option><option>Saudi Arabia</option>
          </select>
        </Field>
        <Field label="Currency">
          <select value={currency} onChange={e => setCurrency(e.target.value)}
            className="w-full h-10 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 transition-all bg-white">
            <option>MAD – Moroccan Dirham</option><option>EUR – Euro</option>
            <option>USD – US Dollar</option><option>AED – UAE Dirham</option><option>SAR – Saudi Riyal</option>
          </select>
        </Field>
        <SaveButton onClick={() => saveLoc({ country, currency })} saving={savingLoc} saved={savedLoc} />
      </Section>

      <Section title="Google Sheets" sub="Automatically sync every order to a Google Sheet">
        <Field label="Spreadsheet ID" hint={
          <>
            Share the sheet with{" "}
            <span className="font-mono text-[11px] bg-gray-100 px-1 rounded select-all">
              {process.env.NEXT_PUBLIC_SHEETS_SERVICE_ACCOUNT ?? "your-service-account@project.iam.gserviceaccount.com"}
            </span>{" "}
            as Editor, then paste the spreadsheet ID or full URL here.
          </>
        }>
          <div className="flex items-center gap-2">
            <Input
              value={sheetsId}
              onChange={v => setSheetsId(v.replace(/.*\/d\/([^/]+).*/, "$1"))}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
            />
            {sheetsId && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 whitespace-nowrap">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                Connected
              </span>
            )}
          </div>
        </Field>
        <SaveButton onClick={() => saveSheets({ sheetsId })} saving={savingSheets} saved={savedSheets} />
      </Section>
    </div>
  );
}

/* ─── Tab: Appearance ────────────────────────────────────────────────── */
const PALETTE = ["#ec4899","#3b82f6","#f59e0b","#8b5cf6","#10b981","#ef4444","#f97316","#0d9488","#0d3d38","#64748b"];

function AppearanceTab({ store, onSaved }: { store: StoreDoc; onSaved: () => void }) {
  const [color,        setColor]        = useState(store.color);
  const [logo,            setLogo]            = useState(store.logo    ?? "");
  const [favicon,         setFavicon]         = useState(store.favicon ?? "");
  const [uploading,       setUploading]       = useState(false);
  const [uploadError,     setUploadError]     = useState("");
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [faviconError,    setFaviconError]    = useState("");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const { save: saveColor,   saving: savingColor,   saved: savedColor   } = useSave(store._id, onSaved);
  const { save: saveLogo,    saving: savingLogo,    saved: savedLogo    } = useSave(store._id, onSaved);
  const { save: saveFavicon, saving: savingFavicon, saved: savedFavicon } = useSave(store._id, onSaved);

  async function handleLogoFile(file: File) {
    setUploadError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/stores/${store._id}/logo`, { method: "POST", body: form });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Upload failed");
      }
      const { url } = await res.json();
      setLogo(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleFaviconFile(file: File) {
    setFaviconError("");
    setFaviconUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/stores/${store._id}/favicon`, { method: "POST", body: form });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Upload failed");
      }
      const { url } = await res.json();
      setFavicon(url);
    } catch (err) {
      setFaviconError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setFaviconUploading(false);
    }
  }

  const isUrl = logo.startsWith("http") || logo.startsWith("/");

  return (
    <div className="space-y-4">
      <Section title="Logo" sub="Shown on your storefront header and footer">
        <div className="py-5 space-y-4">
          {logo && (
            <div className="flex items-center gap-3">
              {isUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="Logo preview" className="h-12 max-w-[160px] object-contain rounded-lg border border-gray-100" />
              ) : (
                <span className="text-sm font-semibold text-gray-700">{logo}</span>
              )}
              <button
                type="button"
                onClick={() => { setLogo(""); saveLogo({ logo: "" }); }}
                className="text-xs text-red-500 hover:text-red-700 underline underline-offset-2 transition-colors">
                Remove
              </button>
            </div>
          )}
          <label className={`inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-colors cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            {uploading ? "Uploading…" : logo ? "Replace logo" : "Upload logo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoFile(f); e.target.value = ""; }}
            />
          </label>
          {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
          <p className="text-xs text-gray-400">JPEG, PNG, WebP or GIF · max 10 MB</p>
        </div>
        {savedLogo && (
          <p className="text-xs text-[#0d9488] font-semibold flex items-center gap-1 pb-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            Saved
          </p>
        )}
      </Section>

      <Section title="Favicon" sub="Browser tab icon for your storefront">
        <div className="py-5 space-y-4">
          {favicon && (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={favicon} alt="Favicon preview" className="w-8 h-8 object-contain rounded border border-gray-200 bg-gray-50" />
              <button
                type="button"
                onClick={() => { setFavicon(""); saveFavicon({ favicon: "" }); }}
                className="text-xs text-red-500 hover:text-red-700 underline underline-offset-2 transition-colors">
                Remove
              </button>
            </div>
          )}
          <label className={`inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-colors cursor-pointer ${faviconUploading ? "opacity-50 pointer-events-none" : ""}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            {faviconUploading ? "Uploading…" : favicon ? "Replace favicon" : "Upload favicon"}
            <input
              type="file"
              accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml,image/webp"
              className="sr-only"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFaviconFile(f); e.target.value = ""; }}
            />
          </label>
          {faviconError && <p className="text-xs text-red-500">{faviconError}</p>}
          <p className="text-xs text-gray-400">PNG, ICO, SVG or WebP · max 2 MB</p>
        </div>
        {savedFavicon && (
          <p className="text-xs text-[#0d9488] font-semibold flex items-center gap-1 pb-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            Saved
          </p>
        )}
      </Section>

      <Section title="Brand Color" sub="Used for your store avatar and accents">
        <div className="py-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Pick a color</p>
          <div className="flex flex-wrap gap-2.5 mb-5">
            {PALETTE.map(c => (
              <button key={c} onClick={() => setColor(c)} type="button"
                className="w-9 h-9 rounded-xl transition-all duration-150 relative"
                style={{ backgroundColor: c }}>
                {color === c && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ backgroundColor: color }} />
            <div>
              <p className="text-xs font-semibold text-gray-700">Preview</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{color}</p>
            </div>
          </div>
        </div>
        <SaveButton onClick={() => saveColor({ color })} saving={savingColor} saved={savedColor} />
      </Section>

      <Section title="Dashboard Theme" sub="How the ATXX dashboard looks for your team">
        <div className="py-5 grid grid-cols-3 gap-3">
          {(["light", "dark", "system"] as const).map(t => (
            <button key={t} onClick={() => setTheme(t)} type="button"
              className={`relative rounded-xl border-2 p-3 text-left transition-all ${theme === t ? "border-[#0d9488] bg-[#f0faf9]" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}>
              <div className={`w-full h-14 rounded-lg mb-3 overflow-hidden ${t === "dark" ? "bg-[#0d3d38]" : t === "system" ? "bg-gradient-to-br from-white to-[#0d3d38]" : "bg-white"} border border-gray-200`}>
                <div className={`h-2.5 w-full ${t === "dark" ? "bg-white/10" : "bg-gray-100"}`} />
                <div className="p-1.5 flex gap-1">
                  <div className={`w-1/3 h-4 rounded ${t === "dark" ? "bg-white/20" : "bg-gray-200"}`} />
                  <div className={`flex-1 h-4 rounded ${t === "dark" ? "bg-white/10" : "bg-gray-100"}`} />
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-700 capitalize">{t}</p>
              {theme === t && (
                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#0d9488] flex items-center justify-center">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
              )}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ─── API tab helpers ────────────────────────────────────────────────── */
const METHOD_COLOR: Record<string, string> = {
  GET:    "bg-blue-500",
  POST:   "bg-emerald-500",
  PUT:    "bg-amber-500",
  DELETE: "bg-red-500",
  PATCH:  "bg-purple-500",
};

function EndpointBadge({ method, path }: { method: string; path: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[11px]">
      <span className={`${METHOD_COLOR[method] ?? "bg-gray-500"} text-white font-bold px-2 py-0.5 rounded-md`}>{method}</span>
      <span className="text-gray-600 truncate">{path}</span>
    </div>
  );
}

function ResponseBadge({ code, color, desc }: { code: string; color: "emerald" | "amber" | "red" | "blue"; desc: string }) {
  const cls = {
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    amber:   "bg-amber-50 border-amber-100 text-amber-700",
    red:     "bg-red-50 border-red-100 text-red-700",
    blue:    "bg-blue-50 border-blue-100 text-blue-700",
  }[color];
  return (
    <div className={`border rounded-xl p-3 ${cls}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide mb-1">{code}</p>
      <p className="text-xs">{desc}</p>
    </div>
  );
}

/* ─── Tab: API ───────────────────────────────────────────────────────── */
function ApiTab({ store }: { store: StoreDoc }) {
  const [apiKey,      setApiKey]      = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [generating,  setGenerating]  = useState(false);
  const [showKey,     setShowKey]     = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);

  useEffect(() => {
    fetch(`/api/stores/${store._id}/apikey`)
      .then(r => r.ok ? r.json() : { apiKey: null })
      .then(d => { setApiKey(d.apiKey); setLoading(false); });
  }, [store._id]);

  async function generate() {
    setGenerating(true);
    setConfirmRegen(false);
    const res = await fetch(`/api/stores/${store._id}/apikey`, { method: "POST" });
    const d = await res.json();
    setApiKey(d.apiKey);
    setShowKey(true);
    setGenerating(false);
  }

  function copy() {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const masked = apiKey ? apiKey.slice(0, 12) + "•".repeat(Math.max(0, apiKey.length - 12)) : "";

  const curlExample = `curl -X POST https://atxx.store/api/stores/${store._id}/orders \\
  -H "Authorization: Bearer ${apiKey ?? "<your-api-key>"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "orderNumber": "ORD-001",
    "customerName": "Ahmed Benali",
    "customerPhone": "+212612345678",
    "customerAddress": "123 Rue Hassan II, Casablanca",
    "items": [{
      "productId": "abc123",
      "productSlug": "blue-sneakers",
      "productName": "Blue Sneakers",
      "productImage": "https://...",
      "price": 450,
      "originalPrice": 500,
      "quantity": 1,
      "subtotal": 450
    }],
    "subtotal": 450,
    "savings": 50,
    "total": 450,
    "status": "pending",
    "paymentMethod": "COD"
  }'`;

  return (
    <div className="space-y-4">
      <Section title="API Key" sub="Use this key to register orders from your external store code">
        <div className="py-5 space-y-4">
          {loading ? (
            <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
          ) : apiKey ? (
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-10 px-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center font-mono text-sm text-gray-700 overflow-hidden">
                  {showKey ? apiKey : masked}
                </div>
                <button onClick={() => setShowKey(v => !v)}
                  className="h-10 px-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-600 transition-colors flex-shrink-0">
                  {showKey ? "Hide" : "Show"}
                </button>
                <button onClick={copy}
                  className="h-10 px-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-600 transition-colors flex-shrink-0 flex items-center gap-1.5">
                  {copied ? (
                    <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Copied</>
                  ) : (
                    <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy</>
                  )}
                </button>
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <strong>Keep this key secret.</strong> Anyone with this key can create orders in your store. Do not share it publicly or commit it to source control.
              </p>
              {!confirmRegen ? (
                <button onClick={() => setConfirmRegen(true)}
                  className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors underline underline-offset-2">
                  Regenerate key
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Regenerating will invalidate the old key immediately.</span>
                  <button onClick={() => setConfirmRegen(false)} className="text-xs font-semibold text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">Cancel</button>
                  <button onClick={generate} disabled={generating}
                    className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors">
                    {generating ? "Generating…" : "Confirm Regenerate"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-4">No API key generated yet. Generate one to start accepting orders from your external store.</p>
              <button onClick={generate} disabled={generating}
                className="h-9 px-5 rounded-xl bg-[#0d3d38] hover:bg-[#0f4a43] disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                {generating ? "Generating…" : "Generate API Key"}
              </button>
            </div>
          )}
        </div>
      </Section>

      <Section title="Orders API" sub="Register orders from your store's backend">
        <div className="py-4 space-y-4">
          <EndpointBadge method="POST" path={`/api/stores/${store._id}/orders`} />
          <pre className="bg-[#0d1117] text-[#e6edf3] text-[11px] leading-relaxed rounded-xl p-4 overflow-x-auto whitespace-pre font-mono">
            {curlExample}
          </pre>
          <div className="grid grid-cols-2 gap-3">
            <ResponseBadge code="201 Created"      color="emerald" desc="Order registered" />
            <ResponseBadge code="401 Unauthorized" color="red"     desc="Invalid or missing API key" />
          </div>
        </div>
      </Section>

      <Section title="Products API" sub="Public read for storefronts · authenticated write for backend sync">
        <div className="py-4 space-y-6">

          {/* Public fetch — no auth */}
          <div className="space-y-3">
            <EndpointBadge method="GET" path={`/api/stores/${store._id}/products`} />
            <p className="text-[11px] text-gray-500 leading-relaxed">
              <strong>No authentication required.</strong> Call this from your storefront to list products. Supports query params: <code className="bg-gray-100 px-1 rounded font-mono">category</code>, <code className="bg-gray-100 px-1 rounded font-mono">status</code>, <code className="bg-gray-100 px-1 rounded font-mono">tag</code>, <code className="bg-gray-100 px-1 rounded font-mono">search</code>, <code className="bg-gray-100 px-1 rounded font-mono">limit</code>, <code className="bg-gray-100 px-1 rounded font-mono">skip</code>.
            </p>
            <pre className="bg-[#0d1117] text-[#e6edf3] text-[11px] leading-relaxed rounded-xl p-4 overflow-x-auto whitespace-pre font-mono">{`// Fetch all active products
const res = await fetch(
  'https://atxx.store/api/stores/${store._id}/products?status=Active'
);
const { products, total } = await res.json();

// Single product by slug (also public)
const res2 = await fetch(
  'https://atxx.store/api/stores/${store._id}/products/blue-sneakers'
);
const product = await res2.json();`}</pre>
            <p className="text-[11px] text-gray-500">
              Returns <code className="bg-gray-100 px-1 rounded font-mono">{`{ products: [...], total, skip, limit }`}</code>
            </p>
          </div>

          {/* Upsert */}
          <div className="space-y-3">
            <EndpointBadge method="POST" path={`/api/stores/${store._id}/products`} />
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Creates a new product, or <strong>updates an existing one by slug</strong> if a product with the same slug already exists. Returns <code className="bg-gray-100 px-1 rounded font-mono">{"{ id, updated: true/false }"}</code>.
            </p>
            <pre className="bg-[#0d1117] text-[#e6edf3] text-[11px] leading-relaxed rounded-xl p-4 overflow-x-auto whitespace-pre font-mono">{`curl -X POST https://atxx.store/api/stores/${store._id}/products \\
  -H "Authorization: Bearer ${apiKey ?? "<your-api-key>"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Blue Sneakers",
    "slug": "blue-sneakers",
    "category": "Shoes",
    "price": 450,
    "originalPrice": 500,
    "stock": 30,
    "images": ["https://..."],
    "shortDesc": "Lightweight everyday sneakers",
    "features": ["Memory foam insole", "Non-slip sole"]
  }'`}</pre>
          </div>

          {/* Update by ID or slug */}
          <div className="space-y-3">
            <EndpointBadge method="PUT" path={`/api/stores/${store._id}/products/:id_or_slug`} />
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Update a specific product. <code className="bg-gray-100 px-1 rounded font-mono">:id_or_slug</code> can be the MongoDB ObjectId <strong>or</strong> the product slug.
            </p>
            <pre className="bg-[#0d1117] text-[#e6edf3] text-[11px] leading-relaxed rounded-xl p-4 overflow-x-auto whitespace-pre font-mono">{`curl -X PUT https://atxx.store/api/stores/${store._id}/products/blue-sneakers \\
  -H "Authorization: Bearer ${apiKey ?? "<your-api-key>"}" \\
  -H "Content-Type: application/json" \\
  -d '{ "stock": 25, "price": 430 }'`}</pre>
          </div>

          {/* Delete */}
          <div className="space-y-3">
            <EndpointBadge method="DELETE" path={`/api/stores/${store._id}/products/:id_or_slug`} />
            <pre className="bg-[#0d1117] text-[#e6edf3] text-[11px] leading-relaxed rounded-xl p-4 overflow-x-auto whitespace-pre font-mono">{`curl -X DELETE https://atxx.store/api/stores/${store._id}/products/blue-sneakers \\
  -H "Authorization: Bearer ${apiKey ?? "<your-api-key>"}" `}</pre>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <ResponseBadge code="200 / 201"        color="emerald" desc="Created or updated" />
            <ResponseBadge code="404 Not Found"    color="amber"   desc="Product not found" />
            <ResponseBadge code="401 Unauthorized" color="red"     desc="Invalid API key" />
          </div>
        </div>
      </Section>
    </div>
  );
}

/* ─── Tab: Pixels ────────────────────────────────────────────────────── */
function PixelsTab({ store, onSaved }: { store: StoreDoc; onSaved: () => void }) {
  const [meta,      setMeta]      = useState(store.pixels?.metaPixelId ?? "");
  const [snap,      setSnap]      = useState(store.pixels?.snapPixelId ?? "");
  const [tt,        setTt]        = useState(store.pixels?.ttPixelId   ?? "");
  const [ga4,       setGa4]       = useState(store.pixels?.ga4Id       ?? "");
  const [gtm,       setGtm]       = useState(store.pixels?.gtmId       ?? "");
  const [pinterest, setPinterest] = useState(store.pixels?.pinterestId ?? "");
  const { save, saving, saved } = useSave(store._id, onSaved);

  function handleSave() {
    save({
      pixels: {
        metaPixelId: meta.trim(),
        snapPixelId: snap.trim(),
        ttPixelId:   tt.trim(),
        ga4Id:       ga4.trim(),
        gtmId:       gtm.trim(),
        pinterestId: pinterest.trim(),
      },
    });
  }

  return (
    <div className="space-y-4">
      <Section title="Tracking Pixels" sub="Paste your pixel or measurement IDs — the storefront injects them server-side">
        <Field label="Meta Pixel" hint="Facebook / Instagram ads">
          <Input value={meta} onChange={setMeta} placeholder="1234567890" />
        </Field>
        <Field label="Snapchat Pixel">
          <Input value={snap} onChange={setSnap} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
        </Field>
        <Field label="TikTok Pixel">
          <Input value={tt} onChange={setTt} placeholder="ABCDE1234" />
        </Field>
        <Field label="Google Analytics 4" hint="Measurement ID">
          <Input value={ga4} onChange={setGa4} placeholder="G-XXXXXXXXXX" />
        </Field>
        <Field label="Google Tag Manager" hint="Container ID">
          <Input value={gtm} onChange={setGtm} placeholder="GTM-XXXXXXX" />
        </Field>
        <Field label="Pinterest Tag">
          <Input value={pinterest} onChange={setPinterest} placeholder="1234567890123" />
        </Field>
        <SaveButton onClick={handleSave} saving={saving} saved={saved} />
      </Section>
    </div>
  );
}

/* ─── Tab: Danger ────────────────────────────────────────────────────── */
function DangerTab({ store }: { store: StoreDoc }) {
  const router = useRouter();
  const [pauseConfirm,  setPauseConfirm]  = useState(false);
  const [pausing,       setPausing]       = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput,   setDeleteInput]   = useState("");
  const [deleting,      setDeleting]      = useState(false);

  async function handlePause() {
    setPausing(true);
    await fetch(`/api/stores/${store._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: store.status === "Paused" ? "Active" : "Paused" }),
    });
    setPausing(false);
    setPauseConfirm(false);
    router.refresh();
  }

  async function handleDelete() {
    if (deleteInput !== store.name) return;
    setDeleting(true);
    await fetch(`/api/stores/${store._id}`, { method: "DELETE" });
    router.push("/stores");
  }

  const isPaused = store.status === "Paused";

  return (
    <div className="space-y-4">
      <Section title={isPaused ? "Resume Store" : "Pause Store"} sub="Temporarily hide your store from customers">
        <div className="py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-gray-600 leading-relaxed max-w-md">
            {isPaused
              ? "Your store is currently paused. Resume it to make it accessible to customers again."
              : "Pausing your store will make it inaccessible to customers. Your data and settings are preserved. You can resume at any time."}
          </p>
          {!pauseConfirm ? (
            <button onClick={() => setPauseConfirm(true)}
              className={`flex-shrink-0 h-9 px-5 rounded-xl border-2 text-sm font-semibold transition-colors ${
                isPaused
                  ? "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                  : "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
              }`}>
              {isPaused ? "Resume Store" : "Pause Store"}
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-gray-500 font-medium">Are you sure?</span>
              <button onClick={() => setPauseConfirm(false)}
                className="h-8 px-3 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handlePause} disabled={pausing}
                className="h-8 px-3 rounded-lg text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors">
                {pausing ? "…" : "Confirm"}
              </button>
            </div>
          )}
        </div>
      </Section>

      <div className="bg-white rounded-2xl shadow-sm border-2 border-red-100 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-red-100 bg-red-50/50">
          <div className="flex items-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <p className="text-sm font-bold text-red-700">Delete Store</p>
          </div>
          <p className="text-xs text-red-500 mt-0.5">This action is permanent and cannot be undone.</p>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Deleting <span className="font-semibold text-gray-900">{store.name}</span> will permanently remove all products, orders, customer data, and analytics. This cannot be reversed.
          </p>
          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)}
              className="h-9 px-5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-sm font-semibold transition-colors">
              I want to delete this store
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-600">
                Type <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">{store.name}</span> to confirm
              </p>
              <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)}
                placeholder={store.name}
                className="w-full h-10 px-4 rounded-xl border-2 border-red-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 transition-all bg-red-50/50"
              />
              <div className="flex gap-2">
                <button onClick={() => { setDeleteConfirm(false); setDeleteInput(""); }}
                  className="h-9 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleteInput !== store.name || deleting}
                  className="h-9 px-5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors">
                  {deleting ? "Deleting…" : "Permanently Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── ImageUploadField ───────────────────────────────────────────────── */
function ImageUploadField({ value, onChange, storeId, label, hint }: {
  value: string; onChange: (url: string) => void;
  storeId: string; label: string; hint?: string;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("storeId", storeId);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      onChange(url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Field label={label} hint={hint}>
      <div className="space-y-2.5">
        {value && (
          <div className="w-full h-28 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            <img src={value} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex items-center gap-2">
          <label className="cursor-pointer h-8 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-600 transition-colors flex items-center gap-1.5">
            {uploading ? (
              <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            )}
            {uploading ? "Uploading…" : value ? "Replace" : "Upload"}
            <input type="file" accept="image/*" className="hidden" disabled={uploading}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
            />
          </label>
          {value && !uploading && (
            <button type="button" onClick={() => onChange("")}
              className="text-[11px] font-semibold text-red-400 hover:text-red-600 transition-colors">
              Remove
            </button>
          )}
        </div>
      </div>
    </Field>
  );
}

/* ─── Tab: Content ───────────────────────────────────────────────────── */
type Locale = "en" | "fr" | "ar";
type ContentSubTab = "home" | "about" | "contact" | "shop" | "product";

const LOCALES: Array<{ id: Locale; label: string }> = [
  { id: "en", label: "English" },
  { id: "fr", label: "Français" },
  { id: "ar", label: "العربية" },
];

type ContentIssue = { localeId: Locale; localeLabel: string; section: string; fields: string[] };

function hasAnyContent(c: StoreContent | undefined): boolean {
  if (!c) return false;
  function scan(v: unknown): boolean {
    if (typeof v === "string") return v.trim().length > 0;
    if (Array.isArray(v)) return v.some(scan);
    if (v && typeof v === "object") return Object.values(v).some(scan);
    return false;
  }
  return scan(c);
}

function validateLocales(all: Record<string, StoreContent>, activeLocales: Locale[]): ContentIssue[] {
  const issues: ContentIssue[] = [];

  // Only cross-validate locales that are enabled and have at least one field filled in
  const active = LOCALES.filter(l => activeLocales.includes(l.id) && hasAnyContent(all[l.id]));
  if (active.length <= 1) return [];

  function check(section: string, fields: Array<[string, (c: StoreContent | undefined) => string | undefined]>) {
    for (const { id, label } of active) {
      const missing: string[] = [];
      for (const [fieldLabel, get] of fields) {
        const hasInAny = active.some(l => (get(all[l.id]) ?? "").trim().length > 0);
        if (hasInAny && !(get(all[id]) ?? "").trim()) missing.push(fieldLabel);
      }
      if (missing.length > 0) issues.push({ localeId: id, localeLabel: label, section, fields: missing });
    }
  }

  check("Home / Hero", [
    ["Headline",     c => c?.home?.hero?.headline],
    ["Subtext",      c => c?.home?.hero?.subtext],
    ["CTA Button",   c => c?.home?.hero?.ctaText],
    ["Social Proof", c => c?.home?.hero?.socialProof],
  ]);
  check("Home / About Snippet", [
    ["Headline",   c => c?.home?.about?.headline],
    ["Body",       c => c?.home?.about?.body],
    ["CTA Button", c => c?.home?.about?.ctaText],
  ]);
  check("Home / Testimonials", [
    ["Headline (Bold)",   c => c?.home?.testimonials?.headlineBold],
    ["Headline (Italic)", c => c?.home?.testimonials?.headlineItalic],
  ]);
  for (let i = 0; i < 3; i++) check(`Home / Testimonials / Stat ${i + 1}`, [
    ["Percent", c => c?.home?.testimonials?.stats?.[i]?.percent],
    ["Text",    c => c?.home?.testimonials?.stats?.[i]?.text],
  ]);
  check("Home / Benefits", [
    ["Headline (Bold)",   c => c?.home?.benefits?.headlineBold],
    ["Headline (Italic)", c => c?.home?.benefits?.headlineItalic],
  ]);
  for (let i = 0; i < 3; i++) check(`Home / Benefits / Item ${i + 1}`, [
    ["Title",       c => c?.home?.benefits?.items?.[i]?.title],
    ["Description", c => c?.home?.benefits?.items?.[i]?.description],
  ]);
  check("Home / Reviews", [
    ["Headline (Bold)",   c => c?.home?.reviews?.headlineBold],
    ["Headline (Italic)", c => c?.home?.reviews?.headlineItalic],
    ["Subtitle",          c => c?.home?.reviews?.subtitle],
    ["Total Reviews",     c => c?.home?.reviews?.totalReviews],
  ]);
  check("About / Hero", [
    ["Eyebrow",  c => c?.about?.hero?.eyebrow],
    ["Headline", c => c?.about?.hero?.headline],
    ["Subtitle", c => c?.about?.hero?.subtitle],
  ]);
  for (let i = 0; i < 4; i++) check(`About / Stats Bar / Stat ${i + 1}`, [
    ["Value", c => c?.about?.stats?.[i]?.value],
    ["Label", c => c?.about?.stats?.[i]?.label],
  ]);
  check("About / Mission", [
    ["Eyebrow",           c => c?.about?.mission?.eyebrow],
    ["Headline (Bold)",   c => c?.about?.mission?.headlineBold],
    ["Headline (Italic)", c => c?.about?.mission?.headlineItalic],
    ["Body 1",            c => c?.about?.mission?.body1],
    ["Body 2",            c => c?.about?.mission?.body2],
    ["CTA Button",        c => c?.about?.mission?.ctaText],
  ]);
  check("About / Values", [
    ["Eyebrow",           c => c?.about?.values?.eyebrow],
    ["Headline (Bold)",   c => c?.about?.values?.headlineBold],
    ["Headline (Italic)", c => c?.about?.values?.headlineItalic],
  ]);
  for (let i = 0; i < 3; i++) check(`About / Values / Item ${i + 1}`, [
    ["Title",       c => c?.about?.values?.items?.[i]?.title],
    ["Description", c => c?.about?.values?.items?.[i]?.description],
  ]);
  check("About / Timeline", [
    ["Eyebrow",           c => c?.about?.timeline?.eyebrow],
    ["Headline (Bold)",   c => c?.about?.timeline?.headlineBold],
    ["Headline (Italic)", c => c?.about?.timeline?.headlineItalic],
  ]);
  for (let i = 0; i < 4; i++) check(`About / Timeline / Milestone ${i + 1}`, [
    ["Year",  c => c?.about?.timeline?.items?.[i]?.year],
    ["Title", c => c?.about?.timeline?.items?.[i]?.title],
    ["Text",  c => c?.about?.timeline?.items?.[i]?.text],
  ]);
  check("About / CTA", [
    ["Headline",      c => c?.about?.cta?.headline],
    ["Subtitle",      c => c?.about?.cta?.subtitle],
    ["Primary CTA",   c => c?.about?.cta?.primaryCta],
    ["Secondary CTA", c => c?.about?.cta?.secondaryCta],
  ]);
  check("Contact", [
    ["Instagram", c => c?.contact?.instagram],
    ["TikTok",    c => c?.contact?.tiktok],
  ]);

  return issues;
}

function ContentTab({ store, onSaved }: { store: StoreDoc; onSaved: () => void }) {
  const [activeLocales, setActiveLocales] = useState<Locale[]>(
    (store.activeLocales as Locale[] | undefined) ?? ["en", "fr", "ar"]
  );
  const [locale, setLocale] = useState<Locale>("en");
  const [subTab, setSubTab] = useState<ContentSubTab>("home");
  const [validationIssues, setValidationIssues] = useState<ContentIssue[]>([]);

  useEffect(() => {
    if (!activeLocales.includes(locale)) setLocale(activeLocales[0]);
  }, [activeLocales]);

  // Seed initial state from the English locale so fields are pre-filled on mount
  const initC = store.content?.["en"];

  // Home state
  const [homeHero, setHomeHero] = useState({
    headline:    initC?.home?.hero?.headline    ?? "",
    subtext:     initC?.home?.hero?.subtext     ?? "",
    ctaText:     initC?.home?.hero?.ctaText     ?? "",
    socialProof: initC?.home?.hero?.socialProof ?? "",
  });
  const [homeAbout, setHomeAbout] = useState({
    headline: initC?.home?.about?.headline ?? "",
    body:     initC?.home?.about?.body     ?? "",
    ctaText:  initC?.home?.about?.ctaText  ?? "",
  });
  const [homeTestimonials, setHomeTestimonials] = useState({
    headlineBold:   initC?.home?.testimonials?.headlineBold   ?? "",
    headlineItalic: initC?.home?.testimonials?.headlineItalic ?? "",
  });
  const [homeTestimonialStats, setHomeTestimonialStats] = useState(
    initC?.home?.testimonials?.stats ?? [{ percent: "", text: "" }, { percent: "", text: "" }, { percent: "", text: "" }]
  );
  const [homeTestimonialItems, setHomeTestimonialItems] = useState<Array<{ video: string; quote: string }>>(
    initC?.home?.testimonials?.items ?? []
  );
  const [testimonialVideoUploading, setTestimonialVideoUploading] = useState<Set<number>>(new Set());
  const [homeBenefits, setHomeBenefits] = useState({
    headlineBold:   initC?.home?.benefits?.headlineBold   ?? "",
    headlineItalic: initC?.home?.benefits?.headlineItalic ?? "",
  });
  const [homeBenefitItems, setHomeBenefitItems] = useState(
    initC?.home?.benefits?.items ?? [{ title: "", description: "" }, { title: "", description: "" }, { title: "", description: "" }]
  );
  const [homeReviews, setHomeReviews] = useState({
    headlineBold:   initC?.home?.reviews?.headlineBold   ?? "",
    headlineItalic: initC?.home?.reviews?.headlineItalic ?? "",
    subtitle:       initC?.home?.reviews?.subtitle       ?? "",
    totalReviews:   initC?.home?.reviews?.totalReviews   ?? "",
  });
  const [homeReviewItems, setHomeReviewItems] = useState<Array<{
    image: string; name: string; date: string; rating: number;
    text: string; productImage: string; productName: string;
  }>>(initC?.home?.reviews?.items ?? []);

  // Section image state
  const [homeHeroImage,     setHomeHeroImage]     = useState(initC?.home?.hero?.image      ?? "");
  const [homeAboutImage,    setHomeAboutImage]    = useState(initC?.home?.about?.image     ?? "");
  const [aboutHeroImage,    setAboutHeroImage]    = useState(initC?.about?.hero?.image     ?? "");
  const [aboutMissionImage, setAboutMissionImage] = useState(initC?.about?.mission?.image  ?? "");
  const [shopHeroImage,     setShopHeroImage]     = useState(initC?.shop?.hero?.image      ?? "");
  const [shopHeroTitle,     setShopHeroTitle]     = useState(initC?.shop?.hero?.title      ?? "");
  const [shopHeroSubtitle,  setShopHeroSubtitle]  = useState(initC?.shop?.hero?.subtitle   ?? "");
  const [shopHeroStatsText, setShopHeroStatsText] = useState(initC?.shop?.hero?.statsText  ?? "");
  const [shopCtaTitle,      setShopCtaTitle]      = useState(initC?.shop?.cta?.title       ?? "");
  const [shopCtaSubtitle,   setShopCtaSubtitle]   = useState(initC?.shop?.cta?.subtitle    ?? "");
  const [shopCtaButton,     setShopCtaButton]     = useState(initC?.shop?.cta?.button      ?? "");

  // About state
  const [aboutHero, setAboutHero] = useState({
    eyebrow:  initC?.about?.hero?.eyebrow  ?? "",
    headline: initC?.about?.hero?.headline ?? "",
    subtitle: initC?.about?.hero?.subtitle ?? "",
  });
  const [aboutStats, setAboutStats] = useState(
    initC?.about?.stats ?? [{ value: "", label: "" }, { value: "", label: "" }, { value: "", label: "" }, { value: "", label: "" }]
  );
  const [aboutMission, setAboutMission] = useState({
    eyebrow:        initC?.about?.mission?.eyebrow        ?? "",
    headlineBold:   initC?.about?.mission?.headlineBold   ?? "",
    headlineItalic: initC?.about?.mission?.headlineItalic ?? "",
    body1:          initC?.about?.mission?.body1          ?? "",
    body2:          initC?.about?.mission?.body2          ?? "",
    ctaText:        initC?.about?.mission?.ctaText        ?? "",
  });
  const [aboutValues, setAboutValues] = useState({
    eyebrow:        initC?.about?.values?.eyebrow        ?? "",
    headlineBold:   initC?.about?.values?.headlineBold   ?? "",
    headlineItalic: initC?.about?.values?.headlineItalic ?? "",
  });
  const [aboutValueItems, setAboutValueItems] = useState(
    initC?.about?.values?.items ?? [{ title: "", description: "" }, { title: "", description: "" }, { title: "", description: "" }]
  );
  const [aboutTimeline, setAboutTimeline] = useState({
    eyebrow:        initC?.about?.timeline?.eyebrow        ?? "",
    headlineBold:   initC?.about?.timeline?.headlineBold   ?? "",
    headlineItalic: initC?.about?.timeline?.headlineItalic ?? "",
  });
  const [aboutTimelineItems, setAboutTimelineItems] = useState(
    initC?.about?.timeline?.items ?? [
      { year: "", title: "", text: "" },
      { year: "", title: "", text: "" },
      { year: "", title: "", text: "" },
      { year: "", title: "", text: "" },
    ]
  );
  const [aboutCta, setAboutCta] = useState({
    headline:     initC?.about?.cta?.headline     ?? "",
    subtitle:     initC?.about?.cta?.subtitle     ?? "",
    primaryCta:   initC?.about?.cta?.primaryCta   ?? "",
    secondaryCta: initC?.about?.cta?.secondaryCta ?? "",
  });

  // Contact state
  const [instagram, setInstagram] = useState(initC?.contact?.instagram ?? "");
  const [tiktok,    setTiktok]    = useState(initC?.contact?.tiktok    ?? "");

  // Product state
  const [howToUseEyebrow,  setHowToUseEyebrow]  = useState(initC?.product?.howToUse?.eyebrow  ?? "");
  const [howToUseHeadline, setHowToUseHeadline] = useState(initC?.product?.howToUse?.headline ?? "");
  const [howToUseSteps,    setHowToUseSteps]    = useState<Array<{ step: string; title: string; description: string }>>(
    initC?.product?.howToUse?.steps ?? []
  );
  const [whyUsEyebrow,  setWhyUsEyebrow]  = useState(initC?.product?.whyUs?.eyebrow  ?? "");
  const [whyUsHeadline, setWhyUsHeadline] = useState(initC?.product?.whyUs?.headline ?? "");
  const [whyUsItems,    setWhyUsItems]    = useState<Array<{ title: string; description: string }>>(
    initC?.product?.whyUs?.items ?? []
  );

  // Reload all form fields when the active locale changes
  useEffect(() => {
    const c = store.content?.[locale];
    setHomeHero({ headline: c?.home?.hero?.headline ?? "", subtext: c?.home?.hero?.subtext ?? "", ctaText: c?.home?.hero?.ctaText ?? "", socialProof: c?.home?.hero?.socialProof ?? "" });
    setHomeAbout({ headline: c?.home?.about?.headline ?? "", body: c?.home?.about?.body ?? "", ctaText: c?.home?.about?.ctaText ?? "" });
    setHomeTestimonials({ headlineBold: c?.home?.testimonials?.headlineBold ?? "", headlineItalic: c?.home?.testimonials?.headlineItalic ?? "" });
    setHomeTestimonialStats(c?.home?.testimonials?.stats ?? [{ percent: "", text: "" }, { percent: "", text: "" }, { percent: "", text: "" }]);
    setHomeTestimonialItems(c?.home?.testimonials?.items ?? []);
    setHomeBenefits({ headlineBold: c?.home?.benefits?.headlineBold ?? "", headlineItalic: c?.home?.benefits?.headlineItalic ?? "" });
    setHomeBenefitItems(c?.home?.benefits?.items ?? [{ title: "", description: "" }, { title: "", description: "" }, { title: "", description: "" }]);
    setHomeReviews({ headlineBold: c?.home?.reviews?.headlineBold ?? "", headlineItalic: c?.home?.reviews?.headlineItalic ?? "", subtitle: c?.home?.reviews?.subtitle ?? "", totalReviews: c?.home?.reviews?.totalReviews ?? "" });
    setHomeReviewItems(c?.home?.reviews?.items ?? []);
    setHomeHeroImage(c?.home?.hero?.image      ?? "");
    setHomeAboutImage(c?.home?.about?.image    ?? "");
    setAboutHeroImage(c?.about?.hero?.image    ?? "");
    setAboutMissionImage(c?.about?.mission?.image ?? "");
    setShopHeroImage(c?.shop?.hero?.image         ?? "");
    setShopHeroTitle(c?.shop?.hero?.title         ?? "");
    setShopHeroSubtitle(c?.shop?.hero?.subtitle   ?? "");
    setShopHeroStatsText(c?.shop?.hero?.statsText ?? "");
    setShopCtaTitle(c?.shop?.cta?.title           ?? "");
    setShopCtaSubtitle(c?.shop?.cta?.subtitle     ?? "");
    setShopCtaButton(c?.shop?.cta?.button         ?? "");
    setAboutHero({ eyebrow: c?.about?.hero?.eyebrow ?? "", headline: c?.about?.hero?.headline ?? "", subtitle: c?.about?.hero?.subtitle ?? "" });
    setAboutStats(c?.about?.stats ?? [{ value: "", label: "" }, { value: "", label: "" }, { value: "", label: "" }, { value: "", label: "" }]);
    setAboutMission({ eyebrow: c?.about?.mission?.eyebrow ?? "", headlineBold: c?.about?.mission?.headlineBold ?? "", headlineItalic: c?.about?.mission?.headlineItalic ?? "", body1: c?.about?.mission?.body1 ?? "", body2: c?.about?.mission?.body2 ?? "", ctaText: c?.about?.mission?.ctaText ?? "" });
    setAboutValues({ eyebrow: c?.about?.values?.eyebrow ?? "", headlineBold: c?.about?.values?.headlineBold ?? "", headlineItalic: c?.about?.values?.headlineItalic ?? "" });
    setAboutValueItems(c?.about?.values?.items ?? [{ title: "", description: "" }, { title: "", description: "" }, { title: "", description: "" }]);
    setAboutTimeline({ eyebrow: c?.about?.timeline?.eyebrow ?? "", headlineBold: c?.about?.timeline?.headlineBold ?? "", headlineItalic: c?.about?.timeline?.headlineItalic ?? "" });
    setAboutTimelineItems(c?.about?.timeline?.items ?? [{ year: "", title: "", text: "" }, { year: "", title: "", text: "" }, { year: "", title: "", text: "" }, { year: "", title: "", text: "" }]);
    setAboutCta({ headline: c?.about?.cta?.headline ?? "", subtitle: c?.about?.cta?.subtitle ?? "", primaryCta: c?.about?.cta?.primaryCta ?? "", secondaryCta: c?.about?.cta?.secondaryCta ?? "" });
    setInstagram(c?.contact?.instagram ?? "");
    setTiktok(c?.contact?.tiktok ?? "");
    setHowToUseEyebrow(c?.product?.howToUse?.eyebrow   ?? "");
    setHowToUseHeadline(c?.product?.howToUse?.headline ?? "");
    setHowToUseSteps(c?.product?.howToUse?.steps       ?? []);
    setWhyUsEyebrow(c?.product?.whyUs?.eyebrow         ?? "");
    setWhyUsHeadline(c?.product?.whyUs?.headline       ?? "");
    setWhyUsItems(c?.product?.whyUs?.items             ?? []);
  }, [locale, store.content]);

  const { save, saving, saved } = useSave(store._id, onSaved);

  async function uploadTestimonialVideo(file: File, idx: number) {
    setTestimonialVideoUploading(s => new Set(s).add(idx));
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("storeId", store._id);
      const res = await fetch("/api/upload-video", { method: "POST", body: form });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Upload failed");
      }
      const { url } = await res.json();
      setHomeTestimonialItems(a => updArr(a, idx, { video: url }));
    } finally {
      setTestimonialVideoUploading(s => { const next = new Set(s); next.delete(idx); return next; });
    }
  }

  const [reviewPhotoUploading, setReviewPhotoUploading] = useState<Set<number>>(new Set());

  async function uploadReviewPhoto(file: File, idx: number) {
    setReviewPhotoUploading(s => new Set(s).add(idx));
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("storeId", store._id);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setHomeReviewItems(a => updArr(a, idx, { image: url }));
    } finally {
      setReviewPhotoUploading(s => { const next = new Set(s); next.delete(idx); return next; });
    }
  }

  function handleSave() {
    const localeContent: StoreContent = {
      home: {
        hero:  { ...homeHero,  image: homeHeroImage },
        about: { ...homeAbout, image: homeAboutImage },
        testimonials: { ...homeTestimonials, stats: homeTestimonialStats, items: homeTestimonialItems },
        benefits: { ...homeBenefits, items: homeBenefitItems },
        reviews: { ...homeReviews, items: homeReviewItems },
      },
      about: {
        hero:    { ...aboutHero,    image: aboutHeroImage },
        stats:   aboutStats,
        mission: { ...aboutMission, image: aboutMissionImage },
        values:   { ...aboutValues,   items: aboutValueItems },
        timeline: { ...aboutTimeline, items: aboutTimelineItems },
        cta: aboutCta,
      },
      contact: { instagram, tiktok },
      shop: {
        hero: { image: shopHeroImage, title: shopHeroTitle, subtitle: shopHeroSubtitle, statsText: shopHeroStatsText },
        cta:  { title: shopCtaTitle, subtitle: shopCtaSubtitle, button: shopCtaButton },
      },
      product: {
        howToUse: { eyebrow: howToUseEyebrow, headline: howToUseHeadline, steps: howToUseSteps },
        whyUs:    { eyebrow: whyUsEyebrow,    headline: whyUsHeadline,    items: whyUsItems    },
      },
    };
    const allContent = { ...(store.content ?? {}), [locale]: localeContent };
    const issues = validateLocales(allContent, activeLocales);
    if (issues.length > 0) { setValidationIssues(issues); return; }
    setValidationIssues([]);
    save({ content: allContent, activeLocales });
  }

  function updArr<T>(arr: T[], i: number, patch: Partial<T>): T[] {
    return arr.map((item, j) => j === i ? { ...item, ...patch } : item);
  }

  function moveItem<T>(arr: T[], from: number, to: number): T[] {
    const next = [...arr];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  }

  const ABOUT_STAT_PLACEHOLDERS = [
    { value: "125K+", label: "Happy Customers" },
    { value: "4.8★",  label: "Average Rating" },
    { value: "12+",   label: "Signature Scents" },
    { value: "3yr",   label: "Of Craftsmanship" },
  ];

  const [previewOpen, setPreviewOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);

  const PREVIEW_PATHS: Record<ContentSubTab, string> = {
    home:    "",
    about:   "/about",
    contact: "/contact",
    shop:    "/shop",
    product: "/shop",
  };

  useEffect(() => {
    if (previewOpen) setIframeReady(false);
  }, [subTab]);

  useEffect(() => {
    if (!previewOpen || !iframeReady || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      {
        type: "PREVIEW_UPDATE",
        locale,
        home: {
          hero:         { ...homeHero,         image: homeHeroImage },
          about:        { ...homeAbout,        image: homeAboutImage },
          testimonials: { ...homeTestimonials, stats: homeTestimonialStats, items: homeTestimonialItems },
          benefits:     { ...homeBenefits,     items: homeBenefitItems },
          reviews:      { ...homeReviews,      items: homeReviewItems },
        },
        about: {
          hero:     { ...aboutHero,     image: aboutHeroImage },
          stats:    aboutStats,
          mission:  { ...aboutMission,  image: aboutMissionImage },
          values:   { ...aboutValues,   items: aboutValueItems },
          timeline: { ...aboutTimeline, items: aboutTimelineItems },
          cta:      aboutCta,
        },
        contact: { instagram, tiktok },
        shop: {
          hero: { image: shopHeroImage, title: shopHeroTitle, subtitle: shopHeroSubtitle, statsText: shopHeroStatsText },
          cta:  { title: shopCtaTitle, subtitle: shopCtaSubtitle, button: shopCtaButton },
        },
        product: {
          howToUse: { eyebrow: howToUseEyebrow, headline: howToUseHeadline, steps: howToUseSteps },
          whyUs:    { eyebrow: whyUsEyebrow,    headline: whyUsHeadline,    items: whyUsItems },
        },
      },
      "*"
    );
  }, [
    previewOpen, iframeReady, locale,
    homeHero, homeHeroImage, homeAbout, homeAboutImage, homeTestimonials, homeTestimonialStats, homeTestimonialItems, homeBenefits, homeBenefitItems, homeReviews, homeReviewItems,
    aboutHero, aboutHeroImage, aboutStats, aboutMission, aboutMissionImage, aboutValues, aboutValueItems, aboutTimeline, aboutTimelineItems, aboutCta,
    instagram, tiktok,
    shopHeroImage, shopHeroTitle, shopHeroSubtitle, shopHeroStatsText, shopCtaTitle, shopCtaSubtitle, shopCtaButton,
    howToUseEyebrow, howToUseHeadline, howToUseSteps, whyUsEyebrow, whyUsHeadline, whyUsItems,
  ]);

  const form = (
    <div className="space-y-4">
      {/* Website Language mode selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <p className="text-sm font-semibold text-gray-700">Website Language</p>
          </div>
          {!previewOpen && (
            <button
              type="button"
              onClick={() => { setIframeReady(false); setPreviewOpen(true); }}
              disabled={!store.url}
              title={!store.url ? "Add a storefront URL in General settings to enable preview" : "Open live preview"}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-semibold transition-all border border-gray-200 text-gray-400 hover:border-[#0d9488] hover:text-[#0d9488] disabled:opacity-40 disabled:cursor-not-allowed">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Preview
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveLocales(["en", "fr", "ar"])}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              activeLocales.length === 3
                ? "bg-[#0d3d38] text-white border-[#0d3d38]"
                : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}>
            Multilingual
          </button>
          {LOCALES.map(loc => (
            <button
              key={loc.id}
              type="button"
              onClick={() => setActiveLocales([loc.id])}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                activeLocales.length === 1 && activeLocales[0] === loc.id
                  ? "bg-[#0d3d38] text-white border-[#0d3d38]"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}>
              {loc.label}
            </button>
          ))}
        </div>
        {activeLocales.length === 1 && (
          <p className="text-xs text-gray-400 mt-2">Your website will only display content in {LOCALES.find(l => l.id === activeLocales[0])?.label}.</p>
        )}
      </div>

      {/* Language switcher — only shown when multiple languages are active */}
      {activeLocales.length > 1 && (
      <div className="flex items-center gap-3 px-1">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Editing</span>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {LOCALES.filter(loc => activeLocales.includes(loc.id)).map(loc => (
            <button key={loc.id} onClick={() => setLocale(loc.id)} type="button" title={loc.label}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all duration-150 ${
                locale === loc.id ? "bg-[#0d3d38] text-white shadow-sm" : "text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              }`}>
              {loc.id.toUpperCase()}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 font-medium">{LOCALES.find(l => l.id === locale)?.label}</span>
      </div>
      )}

      {/* Sub-tab nav */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-2 flex gap-1">
        {(["home", "about", "contact", "shop", "product"] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)} type="button"
            className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 capitalize ${
              subTab === t ? "bg-[#f0faf9] text-[#0d3d38]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Cross-locale validation errors */}
      {validationIssues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-2.5">
            <svg className="flex-shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <p className="text-sm font-bold text-red-700">All languages must have the same fields filled in before saving.</p>
          </div>
          {LOCALES.filter(loc => validationIssues.some(i => i.localeId === loc.id)).map(loc => {
            const locIssues = validationIssues.filter(i => i.localeId === loc.id);
            return (
              <div key={loc.id} className="pl-6">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-bold text-red-600">{loc.label} is missing:</p>
                  <button onClick={() => setLocale(loc.id)} type="button"
                    className="text-xs font-semibold text-[#0d9488] hover:text-[#0d3d38] transition-colors">
                    Switch to {loc.label} →
                  </button>
                </div>
                <div className="space-y-0.5">
                  {locIssues.map((issue, i) => (
                    <p key={i} className="text-xs text-red-500">
                      <span className="font-semibold">{issue.section}:</span> {issue.fields.join(", ")}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div dir={locale === "ar" ? "rtl" : "ltr"}>
      {subTab === "home" && (
        <div className="space-y-4">
          <Section title="Hero" sub="Main banner at the top of the home page">
            <ImageUploadField label="Background Image" hint="Full-width hero background" value={homeHeroImage} onChange={setHomeHeroImage} storeId={store._id} />
            <Field label="Headline" hint="Large heading text">
              <Input value={homeHero.headline} onChange={v => setHomeHero(p => ({ ...p, headline: v }))} placeholder="Own Your Allure" />
            </Field>
            <Field label="Subtext" hint="Supporting line below the headline">
              <Textarea value={homeHero.subtext} onChange={v => setHomeHero(p => ({ ...p, subtext: v }))} rows={2} placeholder="Scents crafted to turn heads and leave a lasting impression." />
            </Field>
            <Field label="CTA Button">
              <Input value={homeHero.ctaText} onChange={v => setHomeHero(p => ({ ...p, ctaText: v }))} placeholder="Shop Now" />
            </Field>
            <Field label="Social Proof" hint="Trust signal shown near the CTA">
              <Input value={homeHero.socialProof} onChange={v => setHomeHero(p => ({ ...p, socialProof: v }))} placeholder="4.5/5 From 125,000+ Customers" />
            </Field>
          </Section>

          <Section title="About Snippet" sub="Short brand section on the home page">
            <ImageUploadField label="Side Image" hint="Image displayed beside the about text" value={homeAboutImage} onChange={setHomeAboutImage} storeId={store._id} />
            <Field label="Headline">
              <Input value={homeAbout.headline} onChange={v => setHomeAbout(p => ({ ...p, headline: v }))} placeholder="About Venom" />
            </Field>
            <Field label="Body" hint="Brand description paragraph">
              <Textarea value={homeAbout.body} onChange={v => setHomeAbout(p => ({ ...p, body: v }))} rows={4} placeholder="At Venom, we're more than just a perfume brand, we're a movement..." />
            </Field>
            <Field label="CTA Button">
              <Input value={homeAbout.ctaText} onChange={v => setHomeAbout(p => ({ ...p, ctaText: v }))} placeholder="Shop Now" />
            </Field>
          </Section>

          <Section title="Testimonials" sub="Customer testimonial stats section">
            <Field label="Headline (Bold)">
              <Input value={homeTestimonials.headlineBold} onChange={v => setHomeTestimonials(p => ({ ...p, headlineBold: v }))} placeholder="Women" />
            </Field>
            <Field label="Headline (Italic)">
              <Input value={homeTestimonials.headlineItalic} onChange={v => setHomeTestimonials(p => ({ ...p, headlineItalic: v }))} placeholder="Speak up" />
            </Field>
            <div className="py-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Stats</p>
              <div className="space-y-3">
                {homeTestimonialStats.map((stat, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <p className="text-xs font-semibold text-gray-400 mb-3">Stat {i + 1}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Percent</label>
                        <Input value={stat.percent} onChange={v => setHomeTestimonialStats(a => updArr(a, i, { percent: v }))} placeholder="93%" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Text</label>
                        <Input value={stat.text} onChange={v => setHomeTestimonialStats(a => updArr(a, i, { text: v }))} placeholder="of women noticed a difference" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="py-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                Videos <span className="font-normal text-gray-400 normal-case">(max 6)</span>
              </p>
              <div className="space-y-3">
                {homeTestimonialItems.map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-400">Video {i + 1}</p>
                      <button type="button"
                        onClick={() => setHomeTestimonialItems(a => a.filter((_, j) => j !== i))}
                        className="text-[11px] font-semibold text-red-400 hover:text-red-600 transition-colors">
                        Remove
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Video</label>
                        {item.video ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 truncate flex-1 font-mono">{item.video.split("/").pop()}</span>
                            <button type="button"
                              onClick={() => setHomeTestimonialItems(a => updArr(a, i, { video: "" }))}
                              className="text-[11px] font-semibold text-red-400 hover:text-red-600 flex-shrink-0 transition-colors">
                              Remove
                            </button>
                          </div>
                        ) : (
                          <label className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-600 transition-colors cursor-pointer ${testimonialVideoUploading.has(i) ? "opacity-50 pointer-events-none" : ""}`}>
                            {testimonialVideoUploading.has(i) ? (
                              <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            )}
                            {testimonialVideoUploading.has(i) ? "Uploading…" : "Upload video"}
                            <input type="file" accept="video/mp4,video/webm,video/quicktime"
                              className="sr-only"
                              onChange={e => { const f = e.target.files?.[0]; if (f) uploadTestimonialVideo(f, i); e.target.value = ""; }}
                            />
                          </label>
                        )}
                        <p className="text-[11px] text-gray-400 mt-1.5">MP4, WebM or MOV · max 100 MB</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Quote</label>
                        <Input value={item.quote} onChange={v => setHomeTestimonialItems(a => updArr(a, i, { quote: v }))} placeholder="This scent changed how I walk into a room." />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {homeTestimonialItems.length < 6 && (
                <button type="button"
                  onClick={() => setHomeTestimonialItems(a => [...a, { video: "", quote: "" }])}
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#0d9488] hover:text-[#0d3d38] transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add video
                </button>
              )}
            </div>
          </Section>

          <Section title="Benefits" sub="Feature highlights section">
            <Field label="Headline (Bold)">
              <Input value={homeBenefits.headlineBold} onChange={v => setHomeBenefits(p => ({ ...p, headlineBold: v }))} placeholder="Unlock the Secret to" />
            </Field>
            <Field label="Headline (Italic)">
              <Input value={homeBenefits.headlineItalic} onChange={v => setHomeBenefits(p => ({ ...p, headlineItalic: v }))} placeholder="Timeless Charm" />
            </Field>
            <div className="py-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Items</p>
              <div className="space-y-3">
                {homeBenefitItems.map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <p className="text-xs font-semibold text-gray-400 mb-3">Benefit {i + 1}</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title</label>
                        <Input value={item.title} onChange={v => setHomeBenefitItems(a => updArr(a, i, { title: v }))} placeholder="Long-Lasting Scent" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                        <Textarea value={item.description} onChange={v => setHomeBenefitItems(a => updArr(a, i, { description: v }))} rows={2} placeholder="Up to 12 hours of lasting fragrance..." />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Reviews" sub="Reviews section header and card list">
            <Field label="Headline (Bold)">
              <Input value={homeReviews.headlineBold} onChange={v => setHomeReviews(p => ({ ...p, headlineBold: v }))} placeholder="Proof in Every" />
            </Field>
            <Field label="Headline (Italic)">
              <Input value={homeReviews.headlineItalic} onChange={v => setHomeReviews(p => ({ ...p, headlineItalic: v }))} placeholder="Compliment." />
            </Field>
            <Field label="Subtitle">
              <Textarea value={homeReviews.subtitle} onChange={v => setHomeReviews(p => ({ ...p, subtitle: v }))} rows={2} placeholder="Hear from women who've seen the spark, the stares, and the chemistry in action." />
            </Field>
            <Field label="Total Reviews">
              <Input value={homeReviews.totalReviews} onChange={v => setHomeReviews(p => ({ ...p, totalReviews: v }))} placeholder="3,091 Reviews" />
            </Field>

            {/* Review cards */}
            <div className="py-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Review Cards</p>
              <div className="space-y-3">
                {homeReviewItems.map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-400">Review {i + 1}</p>
                      <div className="flex items-center gap-1">
                        <button type="button" disabled={i === 0}
                          onClick={() => setHomeReviewItems(a => moveItem(a, i, i - 1))}
                          className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:opacity-30 transition-colors">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                        </button>
                        <button type="button" disabled={i === homeReviewItems.length - 1}
                          onClick={() => setHomeReviewItems(a => moveItem(a, i, i + 1))}
                          className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:opacity-30 transition-colors">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <button type="button"
                          onClick={() => setHomeReviewItems(a => a.filter((_, j) => j !== i))}
                          className="w-6 h-6 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors ml-1">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reviewer Name</label>
                          <Input value={item.name} onChange={v => setHomeReviewItems(a => updArr(a, i, { name: v }))} placeholder="Sarah M." />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date</label>
                          <Input value={item.date} onChange={v => setHomeReviewItems(a => updArr(a, i, { date: v }))} placeholder="2/28/2026" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Rating</label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} type="button"
                              onClick={() => setHomeReviewItems(a => updArr(a, i, { rating: star }))}
                              className="transition-colors">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill={star <= item.rating ? "#f59e0b" : "none"} stroke={star <= item.rating ? "#f59e0b" : "#d1d5db"} strokeWidth="2" strokeLinecap="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                            </button>
                          ))}
                          <span className="text-xs text-gray-400 ml-1">{item.rating}/5</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Review Text</label>
                        <Textarea value={item.text} onChange={v => setHomeReviewItems(a => updArr(a, i, { text: v }))} rows={3} placeholder="This scent is absolutely incredible..." />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reviewer Photo</label>
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0 flex items-center justify-center">
                            {reviewPhotoUploading.has(i) ? (
                              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                            ) : item.image ? (
                              <img src={item.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            )}
                          </div>
                          <label className="cursor-pointer h-8 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-600 transition-colors flex items-center gap-1.5 flex-shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            {reviewPhotoUploading.has(i) ? "Uploading…" : "Upload Photo"}
                            <input type="file" accept="image/*" className="hidden" onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) uploadReviewPhoto(f, i);
                              e.target.value = "";
                            }} />
                          </label>
                          {item.image && !reviewPhotoUploading.has(i) && (
                            <button type="button" onClick={() => setHomeReviewItems(a => updArr(a, i, { image: "" }))}
                              className="text-[11px] font-semibold text-red-400 hover:text-red-600 transition-colors">
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Product Name</label>
                          <Input value={item.productName} onChange={v => setHomeReviewItems(a => updArr(a, i, { productName: v }))} placeholder="Venom™ Black Opium Collection" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Product Image URL</label>
                          <Input value={item.productImage} onChange={v => setHomeReviewItems(a => updArr(a, i, { productImage: v }))} placeholder="https://..." />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button"
                onClick={() => setHomeReviewItems(a => [...a, { image: "", name: "", date: "", rating: 5, text: "", productImage: "", productName: "" }])}
                className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#0d9488] hover:text-[#0d3d38] transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Review Card
              </button>
            </div>
          </Section>
          <SaveButton onClick={handleSave} saving={saving} saved={saved} />
        </div>
      )}

      {subTab === "about" && (
        <div className="space-y-4">
          <Section title="Hero" sub="Top banner on the about page">
            <ImageUploadField label="Background Image" hint="Full-width hero background" value={aboutHeroImage} onChange={setAboutHeroImage} storeId={store._id} />
            <Field label="Eyebrow">
              <Input value={aboutHero.eyebrow} onChange={v => setAboutHero(p => ({ ...p, eyebrow: v }))} placeholder="Our Story" />
            </Field>
            <Field label="Headline">
              <Input value={aboutHero.headline} onChange={v => setAboutHero(p => ({ ...p, headline: v }))} placeholder="Scent That Speaks Before You Do" />
            </Field>
            <Field label="Subtitle">
              <Textarea value={aboutHero.subtitle} onChange={v => setAboutHero(p => ({ ...p, subtitle: v }))} rows={2} placeholder="Venom was built on a single conviction — that the right fragrance doesn't just complement who you are, it announces it." />
            </Field>
          </Section>

          <Section title="Stats Bar" sub="Key numbers shown on the about page">
            <div className="py-4">
              <div className="space-y-3">
                {aboutStats.map((stat, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <p className="text-xs font-semibold text-gray-400 mb-3">Stat {i + 1}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Value</label>
                        <Input value={stat.value} onChange={v => setAboutStats(a => updArr(a, i, { value: v }))} placeholder={ABOUT_STAT_PLACEHOLDERS[i]?.value ?? ""} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Label</label>
                        <Input value={stat.label} onChange={v => setAboutStats(a => updArr(a, i, { label: v }))} placeholder={ABOUT_STAT_PLACEHOLDERS[i]?.label ?? ""} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Mission" sub="Why we exist section">
            <ImageUploadField label="Side Image" hint="Image shown beside the mission text" value={aboutMissionImage} onChange={setAboutMissionImage} storeId={store._id} />
            <Field label="Eyebrow">
              <Input value={aboutMission.eyebrow} onChange={v => setAboutMission(p => ({ ...p, eyebrow: v }))} placeholder="Why We Exist" />
            </Field>
            <Field label="Headline (Bold)">
              <Input value={aboutMission.headlineBold} onChange={v => setAboutMission(p => ({ ...p, headlineBold: v }))} placeholder="We Didn't Create a Perfume." />
            </Field>
            <Field label="Headline (Italic)">
              <Input value={aboutMission.headlineItalic} onChange={v => setAboutMission(p => ({ ...p, headlineItalic: v }))} placeholder="We Created a Feeling." />
            </Field>
            <Field label="Body (First Paragraph)">
              <Textarea value={aboutMission.body1} onChange={v => setAboutMission(p => ({ ...p, body1: v }))} rows={3} placeholder="Most fragrances are designed to smell pleasant..." />
            </Field>
            <Field label="Body (Second Paragraph)">
              <Textarea value={aboutMission.body2} onChange={v => setAboutMission(p => ({ ...p, body2: v }))} rows={3} placeholder="That obsession drove three years of research..." />
            </Field>
            <Field label="CTA Button">
              <Input value={aboutMission.ctaText} onChange={v => setAboutMission(p => ({ ...p, ctaText: v }))} placeholder="Explore the Collection" />
            </Field>
          </Section>

          <Section title="Values" sub="What we stand for section">
            <Field label="Eyebrow">
              <Input value={aboutValues.eyebrow} onChange={v => setAboutValues(p => ({ ...p, eyebrow: v }))} placeholder="What We Stand For" />
            </Field>
            <Field label="Headline (Bold)">
              <Input value={aboutValues.headlineBold} onChange={v => setAboutValues(p => ({ ...p, headlineBold: v }))} placeholder="Built on" />
            </Field>
            <Field label="Headline (Italic)">
              <Input value={aboutValues.headlineItalic} onChange={v => setAboutValues(p => ({ ...p, headlineItalic: v }))} placeholder="Principles, Not Trends" />
            </Field>
            <div className="py-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Items</p>
              <div className="space-y-3">
                {aboutValueItems.map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <p className="text-xs font-semibold text-gray-400 mb-3">Value {i + 1}</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title</label>
                        <Input value={item.title} onChange={v => setAboutValueItems(a => updArr(a, i, { title: v }))} placeholder="Craftsmanship First" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                        <Textarea value={item.description} onChange={v => setAboutValueItems(a => updArr(a, i, { description: v }))} rows={2} placeholder="Every formula is refined until it's exceptional..." />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Timeline" sub="Brand journey section">
            <Field label="Eyebrow">
              <Input value={aboutTimeline.eyebrow} onChange={v => setAboutTimeline(p => ({ ...p, eyebrow: v }))} placeholder="How We Got Here" />
            </Field>
            <Field label="Headline (Bold)">
              <Input value={aboutTimeline.headlineBold} onChange={v => setAboutTimeline(p => ({ ...p, headlineBold: v }))} placeholder="The" />
            </Field>
            <Field label="Headline (Italic)">
              <Input value={aboutTimeline.headlineItalic} onChange={v => setAboutTimeline(p => ({ ...p, headlineItalic: v }))} placeholder="Venom Journey" />
            </Field>
            <div className="py-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Milestones</p>
              <div className="space-y-3">
                {aboutTimelineItems.map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <p className="text-xs font-semibold text-gray-400 mb-3">Milestone {i + 1}</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Year</label>
                        <Input value={item.year} onChange={v => setAboutTimelineItems(a => updArr(a, i, { year: v }))} placeholder={String(2022 + i)} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title</label>
                        <Input value={item.title} onChange={v => setAboutTimelineItems(a => updArr(a, i, { title: v }))} placeholder="The Beginning" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Text</label>
                        <Textarea value={item.text} onChange={v => setAboutTimelineItems(a => updArr(a, i, { text: v }))} rows={2} placeholder="Describe this milestone..." />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section title="CTA" sub="Call-to-action at the bottom of the about page">
            <Field label="Headline">
              <Input value={aboutCta.headline} onChange={v => setAboutCta(p => ({ ...p, headline: v }))} placeholder="Ready to Own Your Allure?" />
            </Field>
            <Field label="Subtitle">
              <Textarea value={aboutCta.subtitle} onChange={v => setAboutCta(p => ({ ...p, subtitle: v }))} rows={2} placeholder="Discover the collection crafted to turn heads..." />
            </Field>
            <Field label="Primary CTA">
              <Input value={aboutCta.primaryCta} onChange={v => setAboutCta(p => ({ ...p, primaryCta: v }))} placeholder="Shop the Collection" />
            </Field>
            <Field label="Secondary CTA">
              <Input value={aboutCta.secondaryCta} onChange={v => setAboutCta(p => ({ ...p, secondaryCta: v }))} placeholder="Back to Home" />
            </Field>
          </Section>
          <SaveButton onClick={handleSave} saving={saving} saved={saved} />
        </div>
      )}

      {subTab === "contact" && (
        <div className="space-y-4">
          <Section title="Social Handles" sub="Social media usernames displayed on your contact page">
            <Field label="Instagram" hint="Include the @ symbol">
              <Input value={instagram} onChange={setInstagram} placeholder="@venomscents" />
            </Field>
            <Field label="TikTok" hint="Include the @ symbol">
              <Input value={tiktok} onChange={setTiktok} placeholder="@venomscents" />
            </Field>
          </Section>
          <SaveButton onClick={handleSave} saving={saving} saved={saved} />
        </div>
      )}

      {subTab === "shop" && (
        <div className="space-y-4">
          <Section title="Shop Banner" sub="Header banner on the shop / collection page">
            <ImageUploadField label="Banner Image" hint="Background image for the shop page header" value={shopHeroImage} onChange={setShopHeroImage} storeId={store._id} />
            <Field label="Title">
              <Input value={shopHeroTitle} onChange={setShopHeroTitle} placeholder="The Collection" />
            </Field>
            <Field label="Subtitle">
              <Textarea value={shopHeroSubtitle} onChange={setShopHeroSubtitle} rows={2} placeholder="Every drop crafted to captivate." />
            </Field>
            <Field label="Stats Text" hint="Social proof line shown in the banner">
              <Input value={shopHeroStatsText} onChange={setShopHeroStatsText} placeholder="4.8 · 125,000+ customers" />
            </Field>
          </Section>

          <Section title="CTA" sub="Call-to-action banner at the bottom of the shop page">
            <Field label="Title">
              <Input value={shopCtaTitle} onChange={setShopCtaTitle} placeholder="Can't find your scent?" />
            </Field>
            <Field label="Subtitle">
              <Textarea value={shopCtaSubtitle} onChange={setShopCtaSubtitle} rows={2} placeholder="Answer a few questions and we'll match you with your perfect fragrance." />
            </Field>
            <Field label="Button Label">
              <Input value={shopCtaButton} onChange={setShopCtaButton} placeholder="Take the Quiz" />
            </Field>
          </Section>
          <SaveButton onClick={handleSave} saving={saving} saved={saved} />
        </div>
      )}

      {subTab === "product" && (
        <div className="space-y-4">
          <Section title="How To Use" sub="Step-by-step application guide shown on product pages">
            <Field label="Eyebrow">
              <Input value={howToUseEyebrow} onChange={setHowToUseEyebrow} placeholder="Application Guide" />
            </Field>
            <Field label="Headline">
              <Input value={howToUseHeadline} onChange={setHowToUseHeadline} placeholder="How to Get the Most Out of Your Scent" />
            </Field>
            <div className="py-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Steps</p>
              <div className="space-y-3">
                {howToUseSteps.map((step, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-400">Step {i + 1}</p>
                      <button onClick={() => setHowToUseSteps(s => s.filter((_, j) => j !== i))} type="button"
                        className="text-[11px] font-semibold text-red-400 hover:text-red-600 transition-colors">Remove</button>
                    </div>
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Step Number</label>
                        <Input value={step.step} onChange={v => setHowToUseSteps(s => updArr(s, i, { step: v }))} placeholder="01" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title</label>
                        <Input value={step.title} onChange={v => setHowToUseSteps(s => updArr(s, i, { title: v }))} placeholder="Apply to Pulse Points" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                        <Textarea value={step.description} onChange={v => setHowToUseSteps(s => updArr(s, i, { description: v }))} rows={2} placeholder="Spritz on wrists, neck, and behind the ears..." />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setHowToUseSteps(s => [...s, { step: String(s.length + 1).padStart(2, "0"), title: "", description: "" }])} type="button"
                className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#0d9488] hover:text-[#0d3d38] transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Step
              </button>
            </div>
          </Section>

          <Section title="Why Us" sub="Reason cards shown on product pages">
            <Field label="Eyebrow">
              <Input value={whyUsEyebrow} onChange={setWhyUsEyebrow} placeholder="Why Venom" />
            </Field>
            <Field label="Headline">
              <Input value={whyUsHeadline} onChange={setWhyUsHeadline} placeholder="Crafted to a Different Standard" />
            </Field>
            <div className="py-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                Items <span className="font-normal text-gray-400 normal-case">(max 4)</span>
              </p>
              <div className="space-y-3">
                {whyUsItems.map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-400">Item {i + 1}</p>
                      <button onClick={() => setWhyUsItems(s => s.filter((_, j) => j !== i))} type="button"
                        className="text-[11px] font-semibold text-red-400 hover:text-red-600 transition-colors">Remove</button>
                    </div>
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title</label>
                        <Input value={item.title} onChange={v => setWhyUsItems(s => updArr(s, i, { title: v }))} placeholder="Premium Ingredients" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                        <Textarea value={item.description} onChange={v => setWhyUsItems(s => updArr(s, i, { description: v }))} rows={2} placeholder="Only the finest raw materials sourced globally..." />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {whyUsItems.length < 4 && (
                <button onClick={() => setWhyUsItems(s => [...s, { title: "", description: "" }])} type="button"
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#0d9488] hover:text-[#0d3d38] transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Item
                </button>
              )}
            </div>
          </Section>
          <SaveButton onClick={handleSave} saving={saving} saved={saved} />
        </div>
      )}
      </div>
    </div>
  );

  return (
    <>
      {!previewOpen && form}

      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ backgroundColor: "#f0f5f4", backgroundImage: "radial-gradient(#c8deda 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
          {/* Header bar */}
          <div className="h-12 px-5 flex items-center justify-between bg-white border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-semibold text-gray-700">Live Preview</span>
              <span className="text-xs text-gray-400">· {subTab.charAt(0).toUpperCase() + subTab.slice(1)} Page</span>
            </div>
            <button
              type="button"
              onClick={() => { setPreviewOpen(false); setIframeReady(false); }}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 transition-all bg-white">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Exit Preview
            </button>
          </div>

          {/* Split layout */}
          <div className="flex-1 flex min-h-0">
            {/* Left: scrollable settings panel */}
            <div className="w-[460px] flex-shrink-0 overflow-y-auto border-r border-gray-200/80 p-5">
              {form}
            </div>

            {/* Right: iframe */}
            <div className="flex-1 bg-white relative">
              {!iframeReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    <p className="text-sm text-gray-400 font-medium">Loading preview…</p>
                  </div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                src={`${store.url}${PREVIEW_PATHS[subTab]}?preview=1`}
                className="w-full h-full border-0"
                onLoad={() => setIframeReady(true)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { id } = useParams<{ id: string }>();
  const { store, loading, refresh } = useStore(id);
  const [tab, setTab] = useState<Tab>("general");

  if (loading || !store) return null;

  return (
    <div className="flex-1 flex flex-col min-h-screen"
      style={{ backgroundColor: "#f0f5f4", backgroundImage: "radial-gradient(#c8deda 1px, transparent 1px)", backgroundSize: "24px 24px" }}>

      <PageHeader
        title="Settings"
        subtitle="Manage your store configuration, integrations and preferences"
        store={store}
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>}
      />

      <main className="flex-1 p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6 max-w-4xl">

          <aside className="md:w-48 flex-shrink-0">
            <nav className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-2 flex flex-row md:flex-col gap-0.5 overflow-x-auto md:overflow-visible">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 whitespace-nowrap w-full text-left ${
                    tab === t.id
                      ? t.id === "danger" ? "bg-red-50 text-red-600" : "bg-[#f0faf9] text-[#0d3d38]"
                      : t.id === "danger" ? "text-red-400 hover:bg-red-50 hover:text-red-600" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}>
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="flex-1 min-w-0">
            {tab === "general"    && <GeneralTab    store={store} onSaved={refresh} />}
            {tab === "appearance" && <AppearanceTab store={store} onSaved={refresh} />}
            {tab === "api"        && <ApiTab        store={store} />}
            {tab === "content"    && <ContentTab    store={store} onSaved={refresh} />}
            {tab === "pixels"     && <PixelsTab     store={store} onSaved={refresh} />}
            {tab === "danger"     && <DangerTab     store={store} />}
          </div>
        </div>
      </main>
    </div>
  );
}
