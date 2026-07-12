"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import ATXXLogo from "@/components/ATXXLogo";
import { STATUS_DOT } from "@/lib/stores";
import type { StoreDoc } from "@/lib/db/stores";

const navItems = (id: string) => [
  {
    label: "Overview", href: `/stores/${id}`,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  },
  {
    label: "Orders", href: `/stores/${id}/orders`,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  },
  {
    label: "Products", href: `/stores/${id}/products`,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  },
  {
    label: "Analytics", href: `/stores/${id}/analytics`,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
  {
    label: "Settings", href: `/stores/${id}/settings`,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  },
];

export default function StoreSidebar({ store, allStores }: { store: StoreDoc; allStores: StoreDoc[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        pickerRef.current && !pickerRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function openPicker() {
    if (pickerOpen) { setPickerOpen(false); return; }
    if (buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect();
      setDropdownRect({ top: r.bottom + 6, left: r.left, width: r.width });
    }
    setPickerOpen(true);
  }

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen bg-[#0d3d38] flex-shrink-0 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 100% 0%, #1a6b5e 0%, transparent 65%)" }} />

      {/* Logo */}
      <div className="relative z-10 flex items-center px-5 h-16 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
            <ATXXLogo size={18} variant="on-dark" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">ATXX</span>
        </div>
      </div>

      {/* Store selector */}
      <div className="relative z-10 px-4 py-4 border-b border-white/10 flex-shrink-0">
        <button ref={buttonRef} onClick={openPicker} type="button"
          className="w-full flex items-center gap-3 bg-white/10 rounded-xl px-3 py-3 border border-white/10 hover:bg-white/15 transition-colors text-left">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: store.color }}>
            {store.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{store.name}</p>
            <span className="flex items-center gap-1 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[store.status]}`} />
              <span className="text-[10px] text-white/40 font-medium">{store.status}</span>
            </span>
          </div>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"
            style={{ opacity: 0.4, transform: pickerOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

      </div>

      {pickerOpen && dropdownRect && (
        <div ref={pickerRef}
          style={{ position: "fixed", top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width, zIndex: 9999 }}
          className="bg-[#0a2e2a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-3 pt-3 pb-2">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1 mb-2">Your Stores</p>
            <div className="space-y-0.5">
              {allStores.map(s => (
                <button key={s._id} type="button"
                  onClick={() => { router.push(`/stores/${s._id}`); setPickerOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors text-left ${
                    s._id === store._id ? "bg-white/15" : "hover:bg-white/10"
                  }`}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ backgroundColor: s.color }}>
                    {s.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">{s.name}</p>
                  </div>
                  {s._id === store._id && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-white/10 p-2">
            <Link href="/stores" onClick={() => setPickerOpen(false)}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-white/40 hover:bg-white/10 hover:text-white/70 transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              All stores
            </Link>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="relative z-10 flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest px-3 mb-3">Menu</p>
        {navItems(store._id).map(({ label, href, icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-white/15 text-white shadow-sm border border-white/10"
                  : "text-white/50 hover:bg-white/10 hover:text-white/90"
              }`}>
              {icon}{label}
            </Link>
          );
        })}
        {session?.user?.role === "admin" && (
          <Link href="/admin/stores"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:bg-white/10 hover:text-white/80 transition-all duration-150 mt-3 border-t border-white/10 pt-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Admin
          </Link>
        )}
      </nav>

      {/* User */}
      <div className="relative z-10 px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-white/20 border border-white/10 flex items-center justify-center flex-shrink-0 flex-shrink-0">
            <span className="text-white text-xs font-semibold">
              {session?.user?.name?.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{session?.user?.name ?? "User"}</p>
            <p className="text-[10px] text-white/40 truncate">{session?.user?.email ?? ""}</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/" })}
            className="text-white/30 hover:text-white/70 transition-colors" aria-label="Log out">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
