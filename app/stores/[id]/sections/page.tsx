"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/hooks/useStore";
import { PageHeader } from "@/components/PageHeader";
import {
  SECTION_TYPES,
  SECTION_MAP,
  PAGE_TYPES,
  type SectionInstance,
  type FieldDef,
  type SubFieldDef,
} from "@/lib/sections";

/* ─── Section type icons ─────────────────────────────────────────────── */
const ICONS: Record<string, React.ReactNode> = {
  hero: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  announcement: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
  features: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  testimonials: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  faq: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  newsletter: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
};

const PAGE_ICONS: Record<string, React.ReactNode> = {
  home: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  shop: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  about: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  contact: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.17 6.17l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
};

/* ─── Shared field inputs ────────────────────────────────────────────── */
function FieldInput({ value, onChange, placeholder, type }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type ?? "text"}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-[#0d9488] focus:bg-[#f0faf9] focus:ring-2 focus:ring-[#0d9488]/20 transition-all"
    />
  );
}

function FieldTextarea({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-[#0d9488] focus:bg-[#f0faf9] focus:ring-2 focus:ring-[#0d9488]/20 transition-all resize-none"
    />
  );
}

function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || "#000000"}
        onChange={e => onChange(e.target.value)}
        className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5"
      />
      <FieldInput value={value} onChange={onChange} placeholder="#000000" />
    </div>
  );
}

/* ─── Items (repeatable sub-form) ────────────────────────────────────── */
function ItemsField({ value, onChange, itemFields, hint }: {
  value: Record<string, string>[];
  onChange: (v: Record<string, string>[]) => void;
  itemFields: SubFieldDef[];
  hint?: string;
}) {
  function updateItem(idx: number, fieldId: string, v: string) {
    onChange(value.map((item, i) => i === idx ? { ...item, [fieldId]: v } : item));
  }
  function addItem() {
    onChange([...value, Object.fromEntries(itemFields.map(f => [f.id, ""]))]);
  }
  function removeItem(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-3">
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
      {value.map((item, idx) => (
        <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Item {idx + 1}</span>
            <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-400 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          {itemFields.map(f => (
            <div key={f.id} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">{f.label}</label>
              {f.type === "textarea"
                ? <FieldTextarea value={item[f.id] ?? ""} onChange={v => updateItem(idx, f.id, v)} placeholder={f.placeholder} />
                : <FieldInput    value={item[f.id] ?? ""} onChange={v => updateItem(idx, f.id, v)} placeholder={f.placeholder} />
              }
            </div>
          ))}
        </div>
      ))}
      <button
        onClick={addItem}
        className="w-full h-9 rounded-xl border border-dashed border-gray-300 text-xs font-semibold text-gray-400 hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-[#f0faf9] transition-all flex items-center justify-center gap-1.5"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add item
      </button>
    </div>
  );
}

/* ─── Single field renderer ──────────────────────────────────────────── */
function SectionField({ field, value, onChange }: {
  field: FieldDef; value: unknown; onChange: (v: unknown) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600">{field.label}</label>
      {field.type === "items" ? (
        <ItemsField
          value={(value as Record<string, string>[]) ?? []}
          onChange={onChange}
          itemFields={field.itemFields ?? []}
          hint={field.hint}
        />
      ) : field.type === "textarea" ? (
        <FieldTextarea value={(value as string) ?? ""} onChange={onChange} placeholder={field.placeholder} />
      ) : field.type === "color" ? (
        <ColorField value={(value as string) ?? ""} onChange={onChange} />
      ) : (
        <FieldInput
          value={(value as string) ?? ""}
          onChange={onChange}
          placeholder={field.placeholder}
          type={field.type === "url" ? "url" : "text"}
        />
      )}
      {field.hint && field.type !== "items" && (
        <p className="text-[11px] text-gray-400">{field.hint}</p>
      )}
    </div>
  );
}

/* ─── Add section modal ──────────────────────────────────────────────── */
function AddSectionModal({ onAdd, onClose }: { onAdd: (type: string) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">Add a section</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="p-3 space-y-1.5 max-h-[420px] overflow-y-auto">
          {SECTION_TYPES.map(def => (
            <button
              key={def.type}
              onClick={() => { onAdd(def.type); onClose(); }}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left hover:bg-[#f0faf9] hover:border-[#c8ede8] border border-transparent transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-[#e0f5f2] flex items-center justify-center text-gray-500 group-hover:text-[#0d9488] flex-shrink-0 transition-colors">
                {ICONS[def.iconKey]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800">{def.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{def.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function SectionsPage() {
  const { id } = useParams<{ id: string }>();
  const { store, loading: storeLoading } = useStore(id);

  const [pages,      setPages]      = useState<Record<string, SectionInstance[]>>({});
  const [activePage, setActivePage] = useState("home");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showModal,  setShowModal]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [dirty,      setDirty]      = useState(false);

  const dragSrc = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // Current page's sections
  const sections = pages[activePage] ?? [];

  useEffect(() => {
    if (!store) return;
    // Migrate legacy flat sections array → home page
    if (store.pages && Object.keys(store.pages).length > 0) {
      setPages(store.pages);
    } else if (store.sections?.length) {
      setPages({ home: store.sections });
    }
  }, [store]);

  const selected    = sections.find(s => s.id === selectedId) ?? null;
  const selectedDef = selected ? SECTION_MAP[selected.type] : null;

  function markDirty() { setDirty(true); setSaved(false); }

  function updatePageSections(updater: (prev: SectionInstance[]) => SectionInstance[]) {
    setPages(prev => ({ ...prev, [activePage]: updater(prev[activePage] ?? []) }));
    markDirty();
  }

  /* ── Mutations ── */
  function addSection(type: string) {
    const def = SECTION_MAP[type];
    if (!def) return;
    const instance: SectionInstance = {
      id: `${type}-${Date.now()}`,
      type,
      enabled: true,
      content: { ...def.defaultContent },
    };
    updatePageSections(prev => [...prev, instance]);
    setSelectedId(instance.id);
  }

  function toggleEnabled(secId: string) {
    updatePageSections(prev => prev.map(s => s.id === secId ? { ...s, enabled: !s.enabled } : s));
  }

  function deleteSection(secId: string) {
    updatePageSections(prev => prev.filter(s => s.id !== secId));
    if (selectedId === secId) setSelectedId(null);
  }

  function updateContent(secId: string, fieldId: string, value: unknown) {
    updatePageSections(prev =>
      prev.map(s => s.id === secId ? { ...s, content: { ...s.content, [fieldId]: value } } : s)
    );
  }

  /* ── Drag reorder ── */
  function onDragStart(idx: number) { dragSrc.current = idx; }
  function onDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setDragOver(idx); }
  function onDrop(idx: number) {
    const src = dragSrc.current;
    if (src === null || src === idx) { setDragOver(null); return; }
    updatePageSections(prev => {
      const next = [...prev];
      const [moved] = next.splice(src, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    dragSrc.current = null;
    setDragOver(null);
  }
  function onDragEnd() { dragSrc.current = null; setDragOver(null); }

  /* ── Page switch ── */
  function switchPage(key: string) {
    setActivePage(key);
    setSelectedId(null);
  }

  /* ── Save ── */
  async function save() {
    setSaving(true);
    await fetch(`/api/stores/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pages }),
    });
    setSaving(false);
    setSaved(true);
    setDirty(false);
  }

  if (storeLoading || !store) return null;

  const activePageDef = PAGE_TYPES.find(p => p.key === activePage);

  return (
    <div className="flex-1 flex flex-col min-h-screen"
      style={{ backgroundColor: "#f0f5f4", backgroundImage: "radial-gradient(#c8deda 1px, transparent 1px)", backgroundSize: "24px 24px" }}>

      <PageHeader
        title="Sections"
        subtitle="Control the content of your store's website sections"
        store={store}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="5" rx="1"/><rect x="3" y="11" width="18" height="5" rx="1"/><rect x="3" y="19" width="18" height="2" rx="1"/>
          </svg>
        }
        actions={
          <button
            onClick={save}
            disabled={!dirty || saving}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
              saved
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : dirty
                  ? "bg-[#0d3d38] text-white hover:bg-[#0f4f48] shadow-sm"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
            }`}
          >
            {saving ? (
              <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
              </svg>
            ) : saved ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            )}
            {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
          </button>
        }
      />

      <main className="flex-1 flex flex-col gap-4 p-6 md:p-8 overflow-hidden min-h-0">

        {/* ── Page tabs ── */}
        <div className="flex gap-1.5 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100/80 self-start">
          {PAGE_TYPES.map(page => {
            const count = (pages[page.key] ?? []).length;
            const isActive = activePage === page.key;
            return (
              <button
                key={page.key}
                onClick={() => switchPage(page.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#0d3d38] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <span className={isActive ? "text-white/70" : "text-gray-400"}>
                  {PAGE_ICONS[page.key]}
                </span>
                {page.label}
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Two-panel editor ── */}
        <div className="flex-1 flex gap-5 min-h-0">

          {/* Left: section list */}
          <div className="w-72 flex-shrink-0 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
              <div>
                <p className="text-xs font-bold text-gray-900">
                  {activePageDef?.label ?? activePage} sections
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">Drag to reorder</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="w-7 h-7 rounded-lg bg-[#0d3d38] hover:bg-[#0f4f48] text-white flex items-center justify-center transition-colors"
                title="Add section"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3 text-gray-300">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <rect x="3" y="3" width="18" height="5" rx="1"/><rect x="3" y="11" width="18" height="5" rx="1"/>
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-gray-400">No sections yet</p>
                  <p className="text-[11px] text-gray-300 mt-1">Click + to add your first section</p>
                </div>
              ) : (
                sections.map((sec, idx) => {
                  const def = SECTION_MAP[sec.type];
                  const isSelected = sec.id === selectedId;
                  const isOver = dragOver === idx;
                  return (
                    <div
                      key={sec.id}
                      draggable
                      onDragStart={() => onDragStart(idx)}
                      onDragOver={e => onDragOver(e, idx)}
                      onDrop={() => onDrop(idx)}
                      onDragEnd={onDragEnd}
                      onClick={() => setSelectedId(sec.id)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all select-none border ${
                        isSelected
                          ? "bg-[#f0faf9] border-[#c8ede8] shadow-sm"
                          : isOver
                            ? "bg-gray-50 border-[#0d9488] border-dashed"
                            : "border-transparent hover:bg-gray-50 hover:border-gray-100"
                      }`}
                    >
                      <span className="text-gray-300 flex-shrink-0 cursor-grab active:cursor-grabbing">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <line x1="9" y1="6" x2="9" y2="6"/><line x1="15" y1="6" x2="15" y2="6"/>
                          <line x1="9" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="15" y2="12"/>
                          <line x1="9" y1="18" x2="9" y2="18"/><line x1="15" y1="18" x2="15" y2="18"/>
                        </svg>
                      </span>
                      <span className={`flex-shrink-0 ${isSelected ? "text-[#0d9488]" : "text-gray-400"}`}>
                        {ICONS[def?.iconKey ?? "hero"]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${isSelected ? "text-[#0d3d38]" : "text-gray-700"}`}>
                          {def?.label ?? sec.type}
                        </p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); toggleEnabled(sec.id); }}
                        className="relative flex-shrink-0 rounded-full transition-colors"
                        style={{ height: "18px", width: "32px", backgroundColor: sec.enabled ? "#0d9488" : "#e5e7eb" }}
                        title={sec.enabled ? "Disable" : "Enable"}
                      >
                        <span
                          className="absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform"
                          style={{ transform: sec.enabled ? "translateX(14px)" : "translateX(2px)" }}
                        />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); deleteSection(sec.id); }}
                        className="text-gray-200 hover:text-red-400 transition-colors flex-shrink-0"
                        title="Delete"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: content editor */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm border border-gray-100/80 flex flex-col overflow-hidden">
            {!selected || !selectedDef ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-300">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </div>
                <p className="text-sm font-bold text-gray-500">Select a section to edit</p>
                <p className="text-xs text-gray-400 mt-1.5 max-w-xs leading-relaxed">
                  Pick a section from the left, or add a new one with the + button.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 flex-shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-[#f0faf9] flex items-center justify-center text-[#0d9488]">
                    {ICONS[selectedDef.iconKey]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{selectedDef.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{selectedDef.description}</p>
                  </div>
                  <span className={`ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                    selected.enabled
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-gray-100 text-gray-500 border border-gray-200"
                  }`}>
                    {selected.enabled ? "Visible" : "Hidden"}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {selectedDef.fields.map(field => (
                    <SectionField
                      key={field.id}
                      field={field}
                      value={selected.content[field.id]}
                      onChange={v => updateContent(selected.id, field.id, v)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <AddSectionModal onAdd={addSection} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
