"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import ATXXLogo from "@/components/ATXXLogo";

const NAV_ITEMS = [
  {
    label: "All Stores", href: "/admin/stores",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  },
  {
    label: "Users", href: "/admin/users",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    label: "Analytics", href: "/admin/analytics",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

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

      {/* Admin badge */}
      <div className="relative z-10 px-4 py-4 border-b border-white/10 flex-shrink-0">
        <div className="w-full flex items-center gap-3 bg-white/10 rounded-xl px-3 py-3 border border-white/10">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-[#ec4899]">
            AD
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">Admin</p>
            <p className="text-[10px] text-white/40 font-medium">All stores &amp; users</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest px-3 mb-3">Menu</p>
        {NAV_ITEMS.map(({ label, href, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
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
      </nav>

      {/* User */}
      <div className="relative z-10 px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-white/20 border border-white/10 flex items-center justify-center flex-shrink-0">
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
