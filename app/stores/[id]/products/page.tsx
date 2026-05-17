"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/hooks/useStore";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import { PageHeader } from "@/components/PageHeader";

/* ─── Mock product catalogue ─────────────────────────────────────────── */
type Product = {
  id: string;
  name: string;
  slug?: string;
  sku?: string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  sold: number;
  status: "Active" | "Draft" | "Out of Stock";
  tag: string;
  warranty?: string;
  rating?: string;
  reviews?: string;
  views?: string;
  shortDesc?: string;
  fullDesc?: string;
  images?: string[];
  features?: string[];
  specs?: { key: string; value: string }[];
  offers?: string[];
  customerReviews?: { name: string; rating: string; text: string }[];
};


const STATUS_STYLE: Record<Product["status"], string> = {
  "Active":       "bg-emerald-50 text-emerald-700 border border-emerald-100",
  "Draft":        "bg-gray-100 text-gray-500 border border-gray-200",
  "Out of Stock": "bg-red-50 text-red-600 border border-red-100",
};

const TAG_STYLE: Record<string, string> = {
  "Bestseller": "bg-violet-50 text-violet-700 border border-violet-100",
  "Top Bundle": "bg-blue-50 text-blue-700 border border-blue-100",
  "Low Stock":  "bg-amber-50 text-amber-700 border border-amber-100",
  "New":        "bg-teal-50 text-teal-700 border border-teal-100",
};

/* ─── Icons ──────────────────────────────────────────────────────────── */
function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  );
}
function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/>
      <circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/>
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

/* ─── Add Product Drawer ─────────────────────────────────────────────── */
const DEFAULT_CATEGORIES = ["Serums","Moisturisers","Bundles","Cleansers","Toners","Eye Care","Lips"];

/* Shared React Select styles matching the existing input design */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rsStyles = (height = "40px"): any => ({
  control: (base: object, state: { isFocused: boolean }) => ({
    ...base,
    minHeight: height,
    height,
    borderRadius: "12px",
    borderColor: state.isFocused ? "#0d9488" : "#e5e7eb",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(13,148,136,0.2)" : "none",
    backgroundColor: state.isFocused ? "#f0faf9" : "white",
    fontSize: "14px",
    "&:hover": { borderColor: state.isFocused ? "#0d9488" : "#e5e7eb" },
  }),
  valueContainer: (base: object) => ({ ...base, padding: "0 14px", flexWrap: "nowrap" }),
  singleValue:    (base: object) => ({ ...base, color: "#111827" }),
  placeholder:    (base: object) => ({ ...base, color: "#d1d5db" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base: object) => ({ ...base, padding: "0 8px", color: "#9ca3af" }),
  clearIndicator:    (base: object) => ({ ...base, padding: "0 4px", color: "#9ca3af" }),
  menu:     (base: object) => ({ ...base, borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb", overflow: "hidden", zIndex: 100 }),
  menuList: (base: object) => ({ ...base, padding: "4px" }),
  option: (base: object, state: { isSelected: boolean; isFocused: boolean }) => ({
    ...base,
    borderRadius: "8px",
    fontSize: "14px",
    color: state.isSelected ? "#0d3d38" : "#374151",
    backgroundColor: state.isSelected ? "#f0faf9" : state.isFocused ? "#f9fafb" : "white",
    fontWeight: state.isSelected ? 600 : 400,
  }),
});

const SECTION_IDS = ["basic", "descriptions", "pricing", "images", "features", "specs", "offers", "reviews"] as const;
type SectionId = typeof SECTION_IDS[number];

const SECTION_META: Record<SectionId, { label: string; icon: React.ReactNode; color: string }> = {
  basic: {
    label: "Basic Info",
    color: "#0d3d38",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  },
  descriptions: {
    label: "Descriptions",
    color: "#8b5cf6",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  },
  pricing: {
    label: "Pricing & Stock",
    color: "#0d9488",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  },
  images: {
    label: "Images",
    color: "#ec4899",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  },
  features: {
    label: "Features",
    color: "#f59e0b",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  },
  specs: {
    label: "Specifications",
    color: "#3b82f6",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  },
  offers: {
    label: "Special Offers",
    color: "#ef4444",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  },
  reviews: {
    label: "Reviews",
    color: "#10b981",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  },
};


function DField({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

function DInput({ value, onChange, placeholder, suffix, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; suffix?: string; type?: string;
}) {
  return (
    <div className="relative flex items-center">
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-[#0d9488] focus:bg-[#f0faf9] focus:ring-2 focus:ring-[#0d9488]/20 transition-all"
        style={{ paddingRight: suffix ? `${suffix.length * 8 + 16}px` : undefined }}
      />
      {suffix && <span className="absolute right-3 text-xs text-gray-400 select-none pointer-events-none">{suffix}</span>}
    </div>
  );
}

function DTextarea({ value, onChange, placeholder, rows = 4 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden focus-within:border-[#0d9488] focus-within:ring-2 focus-within:ring-[#0d9488]/20 transition-all">
      {/* Minimal toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/70">
        {["B","I","U","S"].map(f => (
          <button key={f} type="button" className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
            style={{ fontStyle: f === "I" ? "italic" : undefined, textDecoration: f === "U" ? "underline" : f === "S" ? "line-through" : undefined }}>
            {f}
          </button>
        ))}
        <div className="w-px h-4 bg-gray-200 mx-1" />
        {["H1","H2","H3"].map(h => (
          <button key={h} type="button" className="px-1.5 h-6 rounded text-[10px] font-bold text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors">{h}</button>
        ))}
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <button type="button" className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        </button>
        <button type="button" className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><line x1="4" y1="6" x2="4.01" y2="6"/><line x1="4" y1="12" x2="4.01" y2="12"/><line x1="4" y1="18" x2="4.01" y2="18"/></svg>
        </button>
      </div>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full px-3.5 py-3 text-sm text-gray-900 placeholder-gray-300 outline-none resize-none bg-white"
      />
    </div>
  );
}

type FormState = {
  name: string; slug: string; sku: string; category: string;
  shortDesc: string; fullDesc: string;
  price: string; originalPrice: string; stock: string; badge: string; warranty: string;
  rating: string; reviews: string; sales: string; views: string;
  features: string[]; specs: { key: string; value: string }[];
  offers: string[]; customerReviews: { name: string; rating: string; text: string }[];
};

const EMPTY_FORM: FormState = {
  name: "", slug: "", sku: "", category: "",
  shortDesc: "", fullDesc: "",
  price: "", originalPrice: "", stock: "", badge: "", warranty: "30",
  rating: "0", reviews: "0", sales: "0", views: "0",
  features: [""], specs: [{ key: "", value: "" }],
  offers: [""], customerReviews: [{ name: "", rating: "5", text: "" }],
};

const BADGES = ["", "Bestseller", "Top Bundle", "Low Stock", "New", "Sale", "Limited"];

function AddProductDrawer({ open, onClose, onAdd, onUpdate, storeColor, storeId, editProduct }: {
  open: boolean; onClose: () => void; onAdd: (p: Product) => void;
  onUpdate?: (p: Product) => void; storeColor: string; storeId: string; editProduct?: Product | null;
}) {
  const isEdit = !!editProduct;

  const initialForm = (): FormState => editProduct ? {
    name: editProduct.name,
    slug: editProduct.slug ?? editProduct.name.toLowerCase().replace(/\s+/g, "-"),
    sku: editProduct.sku ?? editProduct.id,
    category: editProduct.category,
    shortDesc: editProduct.shortDesc ?? "",
    fullDesc: editProduct.fullDesc ?? "",
    price: String(editProduct.price),
    originalPrice: editProduct.originalPrice ? String(editProduct.originalPrice) : "",
    stock: String(editProduct.stock),
    badge: editProduct.tag,
    warranty: editProduct.warranty ?? "30",
    rating: editProduct.rating ?? "0",
    reviews: editProduct.reviews ?? "0",
    sales: String(editProduct.sold),
    views: editProduct.views ?? "0",
    features: editProduct.features?.length ? editProduct.features : [""],
    specs: editProduct.specs?.length ? editProduct.specs : [{ key: "", value: "" }],
    offers: editProduct.offers?.length ? editProduct.offers : [""],
    customerReviews: editProduct.customerReviews?.length ? editProduct.customerReviews : [{ name: "", rating: "5", text: "" }],
  } : EMPTY_FORM;

  const [form, setForm]            = useState<FormState>(initialForm);
  const [step, setStep]            = useState(0);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [dragOver, setDragOver]       = useState(false);
  const [imageFiles, setImageFiles]   = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const totalSteps = SECTION_IDS.length;

  // Re-initialise form whenever the product being edited changes
  useEffect(() => {
    setForm(initialForm());
    setStep(0);
    setImageFiles(editProduct?.images ?? []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editProduct]);

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function goTo(s: number) {
    setStep(s);
    bodyRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }
  function next() { if (step < totalSteps - 1) goTo(step + 1); }
  function back() { if (step > 0) goTo(step - 1); }

  async function uploadFiles(files: File[]) {
    if (!files.length) return;
    setUploadingCount(c => c + files.length);
    await Promise.all(files.map(async file => {
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size, storeId }),
        });
        if (!res.ok) throw new Error("Failed to get upload URL");
        const { uploadUrl, publicUrl } = await res.json();
        await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        setImageFiles(prev => [...prev, publicUrl]);
      } finally {
        setUploadingCount(c => c - 1);
      }
    }));
  }

  function handleImageDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    uploadFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/")));
  }
  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    uploadFiles(Array.from(e.target.files ?? []));
    e.target.value = "";
  }

  function handleSubmit() {
    if (!form.name || !form.price || !form.stock || !form.category) return;
    const updated: Product = {
      id: editProduct?.id ?? `P${String(Date.now()).slice(-3)}`,
      name: form.name,
      slug: form.slug,
      sku: form.sku,
      category: form.category,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      stock: Number(form.stock),
      sold: Number(form.sales) || editProduct?.sold || 0,
      status: Number(form.stock) === 0 ? "Out of Stock" : "Active",
      tag: form.badge,
      warranty: form.warranty,
      rating: form.rating,
      reviews: form.reviews,
      views: form.views,
      shortDesc: form.shortDesc,
      fullDesc: form.fullDesc,
      images: imageFiles,
      features: form.features.filter(f => f.trim()),
      specs: form.specs.filter(s => s.key.trim()),
      offers: form.offers.filter(o => o.trim()),
      customerReviews: form.customerReviews.filter(r => r.name.trim()),
    };
    if (isEdit && onUpdate) onUpdate(updated);
    else onAdd(updated);
    setForm(EMPTY_FORM); setImageFiles([]); setStep(0);
    onClose();
  }

  function handleClose() { setForm(EMPTY_FORM); setImageFiles([]); setStep(0); onClose(); }

  const currentId   = SECTION_IDS[step];
  const currentMeta = SECTION_META[currentId];
  const isLast      = step === totalSteps - 1;
  const canSubmit   = !!(form.name && form.price && form.stock && form.category);

  /* step validity dots */
  const stepDone: Record<SectionId, boolean> = {
    basic:        !!(form.name && form.category),
    descriptions: !!(form.shortDesc && form.fullDesc),
    pricing:      !!(form.price && form.stock),
    images:       imageFiles.length > 0,
    features:     form.features.some(f => f.trim()),
    specs:        form.specs.some(s => s.key.trim()),
    offers:       form.offers.some(o => o.trim()),
    reviews:      form.customerReviews.some(r => r.name.trim()),
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none`}>
      <div className={`relative w-full max-w-xl flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto transition-all duration-200 ${open ? "opacity-100 scale-100" : "opacity-0 scale-95"}`} style={{ height: "680px" }}>

        {/* ── Top progress bar ── */}
        <div className="h-1 bg-gray-100 flex-shrink-0">
          <div className="h-full transition-all duration-500 rounded-r-full"
            style={{ width: `${((step + 1) / totalSteps) * 100}%`, background: "linear-gradient(90deg, #0d3d38, #0d9488)" }} />
        </div>

        {/* ── Header ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
              style={{ backgroundColor: currentMeta.color }}>
              <span style={{ transform: "scale(1.3)", display: "flex" }}>{currentMeta.icon}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{isEdit ? "Edit Product" : "Add New Product"} · {currentMeta.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Step {step + 1} of {totalSteps}</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Step pills ── */}
        <div className="flex-shrink-0 flex flex-wrap gap-1.5 px-6 py-3 border-b border-gray-100">
          {SECTION_IDS.map((id, i) => {
            const m    = SECTION_META[id];
            const done = stepDone[id];
            const active = i === step;
            const past   = i < step;
            return (
              <button key={id} onClick={() => goTo(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-150 flex-shrink-0 border ${
                  active
                    ? "text-white border-transparent shadow-sm"
                    : past && done
                      ? "text-white border-transparent opacity-80"
                      : "text-gray-500 bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
                style={active || (past && done) ? { backgroundColor: m.color, borderColor: m.color } : {}}>
                {past && done
                  ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <span className={`w-3.5 h-3.5 rounded-full text-[9px] font-bold flex items-center justify-center flex-shrink-0 ${active ? "bg-white/30" : "bg-gray-200 text-gray-500"}`}>{i + 1}</span>
                }
                {m.label}
              </button>
            );
          })}
        </div>

        {/* ── Step body ── */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto px-6 py-5">

          {/* STEP: Basic Info */}
          {currentId === "basic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DField label="Product Name" required>
                  <DInput value={form.name} onChange={v => { set("name", v); set("slug", v.toLowerCase().replace(/\s+/g, "-")); }} placeholder="e.g. Rose Serum 50ml" />
                </DField>
                <DField label="URL Slug" required>
                  <DInput value={form.slug} onChange={v => set("slug", v)} placeholder="rose-serum-50ml" />
                </DField>
                <DField label="Category" required>
                  <CreatableSelect
                    isClearable
                    placeholder="Search or create category…"
                    value={form.category ? { value: form.category, label: form.category } : null}
                    options={categories.map(c => ({ value: c, label: c }))}
                    onChange={opt => set("category", opt?.value ?? "")}
                    onCreateOption={inputValue => { setCategories(prev => [...prev, inputValue]); set("category", inputValue); }}
                    styles={rsStyles()}
                  />
                </DField>
                <DField label="SKU">
                  <DInput value={form.sku} onChange={v => set("sku", v)} placeholder="SKU-001" />
                </DField>
              </div>
            </div>
          )}

          {/* STEP: Descriptions */}
          {currentId === "descriptions" && (
            <div className="space-y-5">
              <DField label="Short Description" required hint="Shown in search results and product cards.">
                <DTextarea value={form.shortDesc} onChange={v => set("shortDesc", v)} placeholder="A brief, punchy summary of the product…" rows={3} />
              </DField>
              <DField label="Full Description" required hint="The detailed page description customers read.">
                <DTextarea value={form.fullDesc} onChange={v => set("fullDesc", v)} placeholder="Describe ingredients, usage, benefits…" rows={7} />
              </DField>
            </div>
          )}

          {/* STEP: Pricing & Stock */}
          {currentId === "pricing" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <DField label="Price" required>
                  <DInput value={form.price} onChange={v => set("price", v)} placeholder="299" suffix="MAD" type="number" />
                </DField>
                <DField label="Original Price" hint="Crossed-out price for sale items.">
                  <DInput value={form.originalPrice} onChange={v => set("originalPrice", v)} placeholder="399" suffix="MAD" type="number" />
                </DField>
                <DField label="Stock Quantity" required>
                  <DInput value={form.stock} onChange={v => set("stock", v)} placeholder="100" type="number" />
                </DField>
                <DField label="Warranty">
                  <DInput value={form.warranty} onChange={v => set("warranty", v)} placeholder="30" suffix="days" type="number" />
                </DField>
                <DField label="Badge / Tag">
                  <Select
                    isClearable
                    placeholder="No badge"
                    value={form.badge ? { value: form.badge, label: form.badge } : null}
                    options={BADGES.filter(b => b).map(b => ({ value: b, label: b }))}
                    onChange={opt => set("badge", opt?.value ?? "")}
                    styles={rsStyles()}
                  />
                </DField>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-3">Initial Stats</p>
                <div className="grid grid-cols-4 gap-4">
                  {([["rating","Rating","/ 5"],["reviews","Reviews",""],["sales","Sales",""],["views","Views",""]] as const).map(([k, lbl, suf]) => (
                    <DField key={k} label={lbl}>
                      <DInput value={form[k]} onChange={v => set(k, v)} placeholder="0" suffix={suf || undefined} type="number" />
                    </DField>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP: Google Sheets */}
          {/* STEP: Images */}
          {currentId === "images" && (
            <div className="max-w-2xl">
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleImageDrop}
                onClick={() => fileRef.current?.click()}
                className={`rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${dragOver ? "border-[#0d9488] bg-[#f0faf9]" : "border-gray-200 bg-gray-50/60 hover:border-[#0d9488]/50 hover:bg-[#f7fdf9]"}`}>
                <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImagePick} />
                {imageFiles.length === 0 && uploadingCount === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${dragOver ? "bg-[#0d9488] text-white" : "bg-gray-100 text-gray-400"}`}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-600">Drop images here or click to upload</p>
                      <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, GIF · max 10 MB each</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-5">
                    <div className="grid grid-cols-5 gap-3 mb-3">
                      {imageFiles.map((src, i) => (
                        <div key={src} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
                          <img src={src} alt="" className="w-full h-full object-cover" />
                          <button type="button"
                            onClick={e => { e.stopPropagation(); setImageFiles(prev => prev.filter((_, j) => j !== i)); }}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                          {i === 0 && <span className="absolute top-1 left-1 text-[9px] font-bold bg-[#0d3d38] text-white px-1.5 py-0.5 rounded-md">Main</span>}
                        </div>
                      ))}
                      {Array.from({ length: uploadingCount }).map((_, i) => (
                        <div key={`uploading-${i}`} className="aspect-square rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center">
                          <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                          </svg>
                        </div>
                      ))}
                      {uploadingCount === 0 && (
                        <div className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#0d9488] hover:text-[#0d9488] transition-colors">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 text-center">
                      {uploadingCount > 0
                        ? `Uploading ${uploadingCount} image${uploadingCount !== 1 ? "s" : ""}…`
                        : `${imageFiles.length} image${imageFiles.length !== 1 ? "s" : ""} added · click to add more`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP: Features */}
          {currentId === "features" && (
            <div className="space-y-2.5">
              {form.features.map((feat, i) => (
                <div key={i} className="flex gap-2.5 items-center">
                  <span className="w-6 h-6 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                  <input value={feat} onChange={e => { const next = [...form.features]; next[i] = e.target.value; set("features", next); }}
                    placeholder={`Feature ${i + 1} — e.g. "Dermatologist tested"`}
                    className="flex-1 h-10 px-3.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 transition-all" />
                  {form.features.length > 1 && (
                    <button type="button" onClick={() => set("features", form.features.filter((_, j) => j !== i))}
                      className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => set("features", [...form.features, ""])}
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors mt-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add feature
              </button>
            </div>
          )}

          {/* STEP: Specifications */}
          {currentId === "specs" && (
            <div className="space-y-2.5">
              {form.specs.map((spec, i) => (
                <div key={i} className="flex gap-2.5 items-center">
                  <input value={spec.key} onChange={e => { const next = [...form.specs]; next[i] = { ...next[i], key: e.target.value }; set("specs", next); }}
                    placeholder="Property (e.g. Volume)"
                    className="w-44 h-10 px-3.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 transition-all flex-shrink-0" />
                  <input value={spec.value} onChange={e => { const next = [...form.specs]; next[i] = { ...next[i], value: e.target.value }; set("specs", next); }}
                    placeholder="Value (e.g. 50ml)"
                    className="flex-1 h-10 px-3.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 transition-all" />
                  {form.specs.length > 1 && (
                    <button type="button" onClick={() => set("specs", form.specs.filter((_, j) => j !== i))}
                      className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => set("specs", [...form.specs, { key: "", value: "" }])}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors mt-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add specification
              </button>
            </div>
          )}

          {/* STEP: Special Offers */}
          {currentId === "offers" && (
            <div className="space-y-2.5">
              {form.offers.map((offer, i) => (
                <div key={i} className="flex gap-2.5 items-center">
                  <span className="w-6 h-6 rounded-full bg-red-50 border border-red-200 text-red-500 flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                  </span>
                  <input value={offer} onChange={e => { const next = [...form.offers]; next[i] = e.target.value; set("offers", next); }}
                    placeholder={`Offer ${i + 1} — e.g. "Buy 2 get 10% off"`}
                    className="flex-1 h-10 px-3.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 transition-all" />
                  {form.offers.length > 1 && (
                    <button type="button" onClick={() => set("offers", form.offers.filter((_, j) => j !== i))}
                      className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => set("offers", [...form.offers, ""])}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors mt-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add offer
              </button>
            </div>
          )}

          {/* STEP: Reviews */}
          {currentId === "reviews" && (
            <div className="space-y-3">
              {form.customerReviews.map((rev, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                  <div className="flex gap-2.5">
                    <div className="flex-1">
                      <p className="text-[11px] text-gray-500 font-semibold mb-1.5">Customer Name</p>
                      <input value={rev.name} onChange={e => { const next = [...form.customerReviews]; next[i] = { ...next[i], name: e.target.value }; set("customerReviews", next); }}
                        placeholder="e.g. Yasmine M."
                        className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 transition-all bg-white" />
                    </div>
                    <div className="w-36">
                      <p className="text-[11px] text-gray-500 font-semibold mb-1.5">Rating</p>
                      <Select
                        isSearchable={false}
                        value={{ value: rev.rating, label: "★".repeat(Number(rev.rating)) }}
                        options={["5","4","3","2","1"].map(r => ({ value: r, label: "★".repeat(Number(r)) }))}
                        onChange={opt => { const next = [...form.customerReviews]; next[i] = { ...next[i], rating: opt?.value ?? "5" }; set("customerReviews", next); }}
                        styles={rsStyles("36px")}
                      />
                    </div>
                    {form.customerReviews.length > 1 && (
                      <button type="button" onClick={() => set("customerReviews", form.customerReviews.filter((_, j) => j !== i))}
                        className="mt-6 w-8 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors flex-shrink-0">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 font-semibold mb-1.5">Review Text</p>
                    <textarea value={rev.text} onChange={e => { const next = [...form.customerReviews]; next[i] = { ...next[i], text: e.target.value }; set("customerReviews", next); }}
                      placeholder="What did the customer say about this product?" rows={2}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 transition-all bg-white resize-none" />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => set("customerReviews", [...form.customerReviews, { name: "", rating: "5", text: "" }])}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add review
              </button>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 border-t border-gray-100 px-6 py-4 bg-white flex items-center justify-between gap-3">
          {/* Back */}
          <button type="button" onClick={back} disabled={step === 0}
            className="h-10 px-5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back
          </button>

          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {SECTION_IDS.map((id, i) => (
              <button key={id} type="button" onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-200 ${i === step ? "w-5 h-2" : "w-2 h-2"}`}
                style={{ backgroundColor: i === step ? currentMeta.color : i < step ? "#9ca3af" : "#e5e7eb" }} />
            ))}
          </div>

          {/* Next / Submit */}
          {isLast ? (
            <button type="button" onClick={handleSubmit} disabled={!canSubmit}
              className="h-10 px-6 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #0d3d38, #0d9488)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              {isEdit ? "Save Changes" : "Create Product"}
            </button>
          ) : (
            <button type="button" onClick={next}
              className="h-10 px-5 rounded-xl text-white text-sm font-semibold transition-colors flex items-center gap-2"
              style={{ backgroundColor: currentMeta.color }}>
              Next
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          )}
        </div>
      </div>
      </div>
    </>
  );
}

/* ─── Stat card (products) ───────────────────────────────────────────── */
function ProdMiniSpark({ vals, id }: { vals: number[]; id: string }) {
  const W = 140; const H = 36; const P = 3;
  const min = Math.min(...vals); const max = Math.max(...vals);
  const norm = vals.map(v => max === min ? 0.5 : (v - min) / (max - min));
  const pts = norm.map((n, i) => [
    P + (i / (norm.length - 1)) * (W - P * 2),
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
function ProdStatCard({ label, value, sub, icon, grad, vals, sparkId, delay }: {
  label: string; value: string; sub: string; icon: React.ReactNode;
  grad: string; vals: number[]; sparkId: string; delay: string;
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
        <p className="text-[11px] text-white/40 mt-1 font-medium">{sub}</p>
        <div className="mt-3 -mx-1"><ProdMiniSpark vals={vals} id={sparkId} /></div>
      </div>
      <div className="absolute bottom-1 right-2 text-[3.5rem] font-black text-white/[0.05] leading-none select-none pointer-events-none tracking-tighter">
        {value.replace(/[^0-9KM.]/g, "")}
      </div>
    </div>
  );
}

/* ─── Stock bar ──────────────────────────────────────────────────────── */
function StockBar({ stock, max = 200 }: { stock: number; max?: number }) {
  const pct = Math.min((stock / max) * 100, 100);
  const color = stock === 0 ? "bg-red-400" : stock < 20 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-500 w-6 text-right">{stock}</span>
    </div>
  );
}

/* ─── Grid card ──────────────────────────────────────────────────────── */
function ProductCard({ p, onView, onEdit, onDelete }: {
  p: Product;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const initials = p.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const hues = ["#ec4899","#3b82f6","#f59e0b","#8b5cf6","#10b981","#ef4444","#f97316","#0d9488"];
  const color = hues[p.id.charCodeAt(1) % hues.length];

  return (
    <div className="group bg-white rounded-2xl p-5 flex flex-col gap-4 shadow-sm border border-gray-100/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ backgroundColor: color }}>
          {initials}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[p.status]}`}>
            {p.status}
          </span>
          {p.tag && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TAG_STYLE[p.tag]}`}>
              {p.tag}
            </span>
          )}
        </div>
      </div>

      {/* Name + category */}
      <div>
        <p className="text-sm font-bold text-gray-900 leading-snug">{p.name}</p>
        <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{p.category}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-xl px-3 py-2">
          <p className="text-sm font-bold text-gray-900">{p.price} MAD</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Price</p>
        </div>
        <div className="bg-gray-50 rounded-xl px-3 py-2">
          <p className="text-sm font-bold text-gray-900">{p.sold.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Sold</p>
        </div>
      </div>

      {/* Stock bar */}
      <div>
        <p className="text-[10px] text-gray-400 font-medium mb-1.5">Stock</p>
        <StockBar stock={p.stock} />
      </div>

      {/* Actions — slide up on hover */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
        <button onClick={onView}
          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl bg-gray-50 hover:bg-[#f0faf9] hover:text-[#0d3d38] text-gray-500 text-xs font-semibold transition-colors border border-gray-100 hover:border-[#c8ede8]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
          View
        </button>
        <button onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-500 text-xs font-semibold transition-colors border border-gray-100 hover:border-blue-200">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </button>
        <button onClick={onDelete}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-red-50 hover:text-red-500 text-gray-400 transition-colors border border-gray-100 hover:border-red-200 flex-shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>

      {/* ID */}
      <p className="font-mono text-[10px] text-gray-300 font-semibold -mt-2">{p.id}</p>
    </div>
  );
}

/* ─── List row ───────────────────────────────────────────────────────── */
function ProductRow({ p, onView, onEdit, onDelete }: {
  p: Product;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const hues = ["#ec4899","#3b82f6","#f59e0b","#8b5cf6","#10b981","#ef4444","#f97316","#0d9488"];
  const color = hues[p.id.charCodeAt(1) % hues.length];
  const initials = p.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <tr className="group border-b border-gray-100 last:border-0 hover:bg-[#f7faf9] transition-colors">
      <td className="py-3.5 pl-6 pr-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
            style={{ backgroundColor: color }}>
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{p.name}</p>
            <p className="text-[11px] text-gray-400">{p.category}</p>
          </div>
        </div>
      </td>
      <td className="py-3.5 px-4 font-mono text-xs text-gray-400">{p.id}</td>
      <td className="py-3.5 px-4 text-sm font-bold text-gray-900">{p.price} MAD</td>
      <td className="py-3.5 px-4 w-40"><StockBar stock={p.stock} /></td>
      <td className="py-3.5 px-4 text-sm text-gray-500">{p.sold.toLocaleString()}</td>
      <td className="py-3.5 px-4">
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[p.status]}`}>{p.status}</span>
      </td>
      <td className="py-3.5 px-4">
        {p.tag && <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${TAG_STYLE[p.tag]}`}>{p.tag}</span>}
      </td>
      <td className="py-3.5 pl-2 pr-5">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onView} title="View"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#0d3d38] hover:bg-[#f0faf9] transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button onClick={onEdit} title="Edit"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button onClick={onDelete} title="Delete"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ─── View modal ─────────────────────────────────────────────────────── */
function ViewProductModal({ p, onClose, onEdit }: { p: Product; onClose: () => void; onEdit: () => void }) {
  const hues = ["#ec4899","#3b82f6","#f59e0b","#8b5cf6","#10b981","#ef4444","#f97316","#0d9488"];
  const color = hues[p.id.charCodeAt(1) % hues.length];
  const initials = p.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{title}</p>
        {children}
      </div>
    );
  }

  function Field({ label, value }: { label: string; value?: string | number }) {
    if (!value && value !== 0) return null;
    return (
      <div className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
        <span className="text-xs text-gray-400 w-28 flex-shrink-0 pt-0.5">{label}</span>
        <span className="text-xs font-medium text-gray-800 flex-1">{value}</span>
      </div>
    );
  }

  const starRating = (r: string) => {
    const n = Math.round(Number(r));
    return "★".repeat(n) + "☆".repeat(5 - n);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl pointer-events-auto overflow-hidden flex flex-col" style={{ maxHeight: "90vh" }}>

          {/* Header banner */}
          <div className="h-24 flex items-end px-6 pb-0 relative flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${color}15, ${color}35)` }}>
            <div className="absolute inset-0 opacity-5"
              style={{ backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`, backgroundSize: "18px 18px" }} />
            <div className="flex items-end gap-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg translate-y-8 flex-shrink-0 border-4 border-white"
                style={{ backgroundColor: color }}>
                {initials}
              </div>
              <div className="pb-2 translate-y-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                  {p.tag && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TAG_STYLE[p.tag] ?? "bg-gray-100 text-gray-600"}`}>{p.tag}</span>}
                </div>
              </div>
            </div>
            {/* Close button */}
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors shadow-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Name + ID */}
          <div className="px-6 pt-10 pb-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900">{p.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{p.category} · {p.id}{p.sku ? ` · SKU: ${p.sku}` : ""}{p.slug ? ` · /${p.slug}` : ""}</p>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Stats strip */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Price", value: `${p.price} MAD`, sub: p.originalPrice ? `Was ${p.originalPrice} MAD` : undefined },
                { label: "Stock", value: p.stock, sub: `units left` },
                { label: "Sold", value: p.sold.toLocaleString(), sub: `units` },
                { label: "Rating", value: p.rating ? `${p.rating} / 5` : "—", sub: p.reviews ? `${p.reviews} reviews` : undefined },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-gray-50 rounded-xl px-3 py-3 text-center">
                  <p className="text-sm font-bold text-gray-900">{value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
                  {sub && <p className="text-[9px] text-gray-300 mt-0.5">{sub}</p>}
                </div>
              ))}
            </div>

            {/* Stock bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] text-gray-400 font-medium">Stock level</p>
                <p className="text-[10px] text-gray-400">{p.stock} units</p>
              </div>
              <StockBar stock={p.stock} />
            </div>

            {/* Basic info */}
            <Section title="Basic Information">
              <div className="bg-gray-50 rounded-xl px-4 py-1">
                <Field label="Product Name" value={p.name} />
                <Field label="Slug" value={p.slug} />
                <Field label="SKU" value={p.sku} />
                <Field label="Category" value={p.category} />
                <Field label="Badge / Tag" value={p.tag} />
                <Field label="Warranty" value={p.warranty ? `${p.warranty} days` : undefined} />
                <Field label="Views" value={p.views} />
              </div>
            </Section>

            {/* Descriptions */}
            {(p.shortDesc || p.fullDesc) && (
              <Section title="Descriptions">
                {p.shortDesc && (
                  <div className="mb-3">
                    <p className="text-[10px] text-gray-400 font-medium mb-1">Short Description</p>
                    <p className="text-xs text-gray-700 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">{p.shortDesc}</p>
                  </div>
                )}
                {p.fullDesc && (
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium mb-1">Full Description</p>
                    <p className="text-xs text-gray-700 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed whitespace-pre-line">{p.fullDesc}</p>
                  </div>
                )}
              </Section>
            )}

            {/* Pricing detail */}
            <Section title="Pricing & Stock">
              <div className="bg-gray-50 rounded-xl px-4 py-1">
                <Field label="Price" value={`${p.price} MAD`} />
                <Field label="Original Price" value={p.originalPrice ? `${p.originalPrice} MAD` : undefined} />
                <Field label="Discount" value={p.originalPrice ? `${Math.round((1 - p.price / p.originalPrice) * 100)}% off` : undefined} />
                <Field label="Stock" value={`${p.stock} units`} />
                <Field label="Units Sold" value={p.sold} />
                <Field label="Rating" value={p.rating ? `${p.rating} ★` : undefined} />
                <Field label="Reviews" value={p.reviews} />
                <Field label="Sales" value={p.sold} />
              </div>
            </Section>

            {/* Images */}
            {p.images && p.images.length > 0 && (
              <Section title={`Images (${p.images.length})`}>
                <div className="grid grid-cols-4 gap-2">
                  {p.images.map((src, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                      <img src={src} alt={`${p.name} ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Features */}
            {p.features && p.features.length > 0 && (
              <Section title="Features">
                <ul className="space-y-1.5">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-gray-700">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: `${color}20`, color }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Specifications */}
            {p.specs && p.specs.length > 0 && (
              <Section title="Specifications">
                <div className="rounded-xl overflow-hidden border border-gray-100">
                  {p.specs.map((s, i) => (
                    <div key={i} className={`flex gap-0 text-xs ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                      <span className="w-36 px-4 py-2.5 font-medium text-gray-500 border-r border-gray-100 flex-shrink-0">{s.key}</span>
                      <span className="px-4 py-2.5 text-gray-800 flex-1">{s.value}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Special Offers */}
            {p.offers && p.offers.length > 0 && (
              <Section title="Special Offers">
                <div className="space-y-2">
                  {p.offers.map((o, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round"><polyline points="20.84 4.61 23 6.77 12 17.77 1 6.77 3.16 4.61 12 13.45 20.84 4.61"/></svg>
                      <span className="text-xs text-amber-800 font-medium">{o}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Customer Reviews */}
            {p.customerReviews && p.customerReviews.length > 0 && (
              <Section title={`Customer Reviews (${p.customerReviews.length})`}>
                <div className="space-y-3">
                  {p.customerReviews.map((r, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl px-4 py-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-900">{r.name}</p>
                        <span className="text-amber-400 text-xs tracking-tight">{starRating(r.rating)}</span>
                      </div>
                      {r.text && <p className="text-xs text-gray-500 leading-relaxed">{r.text}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            )}

          </div>

          {/* Footer */}
          <div className="flex gap-2.5 px-6 py-4 border-t border-gray-100 flex-shrink-0">
            <button onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Close
            </button>
            <button onClick={() => { onClose(); onEdit(); }}
              className="flex-1 h-10 rounded-xl bg-[#0d3d38] hover:bg-[#0f4a43] text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit Product
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Delete confirm modal ───────────────────────────────────────────── */
function DeleteConfirmModal({ p, onClose, onConfirm }: { p: Product; onClose: () => void; onConfirm: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs pointer-events-auto p-6 space-y-4">
          <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mx-auto">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-900">Delete product?</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              <span className="font-semibold text-gray-600">{p.name}</span> will be permanently removed from your catalogue.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 h-9 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={onConfirm}
              className="flex-1 h-9 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function ProductsPage() {
  const { id } = useParams<{ id: string }>();
  const { store, loading: storeLoading } = useStore(id);

  const [products,        setProducts]     = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [search,          setSearch]       = useState("");
  const [category,        setCategory]     = useState("All");
  const [view,            setView]         = useState<"grid" | "list">("grid");
  const [modalOpen,       setModalOpen]    = useState(false);
  const [editProduct,     setEditProduct]  = useState<Product | null>(null);
  const [viewProduct,     setViewProduct]  = useState<Product | null>(null);
  const [deleteProduct,   setDeleteProduct] = useState<Product | null>(null);

  async function fetchProducts() {
    const res = await fetch(`/api/stores/${id}/products`);
    if (res.ok) {
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : (data.products ?? []));
    }
    setProductsLoading(false);
  }

  useEffect(() => { fetchProducts(); }, [id]);

  function openAdd()  { setEditProduct(null); setModalOpen(true); }
  function openEdit(p: Product) { setEditProduct(p); setModalOpen(true); }

  async function handleAdd(p: Product) {
    await fetch(`/api/stores/${id}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    fetchProducts();
  }

  async function handleUpdate(p: Product) {
    await fetch(`/api/stores/${id}/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    fetchProducts();
  }

  async function handleDelete(p: Product) {
    await fetch(`/api/stores/${id}/products/${p.id}`, { method: "DELETE" });
    setDeleteProduct(null);
    fetchProducts();
  }

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map(p => p.category)))],
    [products]
  );

  const filtered = useMemo(() => {
    let list = products;
    if (category !== "All") list = list.filter(p => p.category === category);
    if (search.trim())      list = list.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [search, category, products]);

  const active       = products.filter(p => p.status === "Active").length;
  const outOfStock   = products.filter(p => p.status === "Out of Stock").length;
  const totalRevenue = products.reduce((s, p) => s + p.price * p.sold, 0);
  const categoryCount = categories.length - 1; // exclude "All"

  if (storeLoading || !store) return null;

  return (
    <div className="flex-1 flex flex-col min-h-screen"
      style={{ backgroundColor: "#f0f5f4", backgroundImage: "radial-gradient(#c8deda 1px, transparent 1px)", backgroundSize: "24px 24px" }}>

      <PageHeader
        title="Products"
        subtitle={`${products.length} products listed · manage your catalogue`}
        store={store}
        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
        stats={[
          { label: "Listed",  value: String(products.length) },
          { label: "Active",  value: String(products.filter(p => p.status === "Active").length) },
          { label: "In Stock", value: String(products.filter(p => p.stock > 0).length) },
        ]}
        actions={
          <button onClick={openAdd} className="flex items-center gap-2 text-xs font-semibold text-white bg-[#0d3d38] hover:bg-[#0f4a43] px-3.5 py-2 rounded-xl transition-colors shadow-sm">
            <PlusIcon /> Add Product
          </button>
        }
      />

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <main className="flex-1 p-6 md:p-8 space-y-5">

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              label: "Total Products", value: String(products.length), sub: "in catalogue",
              grad: "linear-gradient(135deg, #0d3d38 0%, #0f766e 60%, #14b8a6 100%)",
              sparkId: "sp-ptot", delay: "0ms", vals: [10,11,11,12,13,13,14,14,14,15,15,15],
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
            },
            {
              label: "Active", value: String(active), sub: "live in store",
              grad: "linear-gradient(135deg, #064e3b 0%, #059669 60%, #34d399 100%)",
              sparkId: "sp-pact", delay: "70ms", vals: [8,9,9,10,11,11,12,12,11,12,12,12],
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
            },
            {
              label: "Out of Stock", value: String(outOfStock), sub: "needs restocking",
              grad: "linear-gradient(135deg, #7f1d1d 0%, #dc2626 60%, #f87171 100%)",
              sparkId: "sp-poos", delay: "140ms", vals: [1,2,2,3,2,3,3,2,3,3,2,3],
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
            },
            {
              label: "Est. Revenue", value: `${(totalRevenue / 1000).toFixed(0)}K MAD`, sub: "price × units sold",
              grad: "linear-gradient(135deg, #3b0764 0%, #7c3aed 60%, #a78bfa 100%)",
              sparkId: "sp-prev", delay: "210ms", vals: [45,62,51,78,66,90,74,82,70,80,88,95],
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
            },
            {
              label: "Categories", value: String(categoryCount), sub: "product types",
              grad: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #60a5fa 100%)",
              sparkId: "sp-pcat", delay: "280ms", vals: [6,6,7,7,7,7,8,8,8,8,8,8],
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
            },
          ].map(({ label, value, sub, grad, sparkId, delay, vals, icon }) => (
            <ProdStatCard key={label} label={label} value={value} sub={sub} grad={grad} sparkId={sparkId} delay={delay} vals={vals} icon={icon} />
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <SearchIcon />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#0d9488] focus:bg-[#f0faf9] focus:ring-2 focus:ring-[#0d9488]/20 transition-all"
            />
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  category === c
                    ? "bg-[#0d3d38] text-white shadow-sm"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700"
                }`}>
                {c}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="ml-auto flex items-center bg-white border border-gray-200 rounded-xl p-1 gap-0.5">
            <button onClick={() => setView("grid")}
              className={`p-1.5 rounded-lg transition-colors ${view === "grid" ? "bg-[#0d3d38] text-white" : "text-gray-400 hover:text-gray-600"}`}>
              <GridIcon />
            </button>
            <button onClick={() => setView("list")}
              className={`p-1.5 rounded-lg transition-colors ${view === "list" ? "bg-[#0d3d38] text-white" : "text-gray-400 hover:text-gray-600"}`}>
              <ListIcon />
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        {productsLoading ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100/80 animate-pulse">
            <p className="text-sm text-gray-300">Loading products…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100/80">
            <p className="text-sm text-gray-400">{products.length === 0 ? "No products yet. Add your first product." : "No products match your search."}</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(p => <ProductCard key={p.id} p={p} onView={() => setViewProduct(p)} onEdit={() => openEdit(p)} onDelete={() => setDeleteProduct(p)} />)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th className="py-3 pl-6 pr-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product</th>
                  <th className="py-3 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">SKU</th>
                  <th className="py-3 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price</th>
                  <th className="py-3 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest w-40">Stock</th>
                  <th className="py-3 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sold</th>
                  <th className="py-3 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="py-3 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tag</th>
                  <th className="py-3 pl-2 pr-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => <ProductRow key={p.id} p={p} onView={() => setViewProduct(p)} onEdit={() => openEdit(p)} onDelete={() => setDeleteProduct(p)} />)}
              </tbody>
            </table>
            <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-400">
                Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of <span className="font-semibold text-gray-600">{products.length}</span> products
              </p>
            </div>
          </div>
        )}
      </main>

      <AddProductDrawer
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditProduct(null); }}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        storeColor={store.color}
        storeId={store._id}
        editProduct={editProduct}
      />

      {viewProduct && (
        <ViewProductModal
          p={viewProduct}
          onClose={() => setViewProduct(null)}
          onEdit={() => { setViewProduct(null); openEdit(viewProduct!); }}
        />
      )}

      {deleteProduct && (
        <DeleteConfirmModal
          p={deleteProduct}
          onClose={() => setDeleteProduct(null)}
          onConfirm={() => handleDelete(deleteProduct)}
        />
      )}
    </div>
  );
}
