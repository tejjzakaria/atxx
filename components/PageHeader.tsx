"use client";

import type { StoreDoc } from "@/lib/db/stores";

type Stat = { label: string; value: string };

type Props = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  store: StoreDoc;
  actions?: React.ReactNode;
  stats?: Stat[];
};

export function PageHeader({ title, subtitle, icon, store, actions, stats }: Props) {
  return (
    <div className="sticky top-0 z-20 bg-white flex-shrink-0" style={{ boxShadow: "0 1px 0 #e5e7eb, 0 4px 16px rgba(0,0,0,0.04)" }}>

      {/* gradient accent line */}
      <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${store.color} 0%, #0d9488 40%, #14b8a6 100%)` }} />

      <div className="px-6 md:px-8 py-3.5">

        {/* main row */}
        <div className="flex items-center justify-between gap-6">

          {/* left: icon + title */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm"
              style={{ backgroundColor: store.color }}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <h1 className="text-[17px] font-black text-gray-900 leading-tight tracking-tight">{title}</h1>
              <p className="text-[11.5px] text-gray-400 mt-0.5 font-medium truncate">{subtitle}</p>
            </div>
          </div>

          {/* right: stats + actions */}
          <div className="flex items-center gap-4 flex-shrink-0">

            {stats && stats.length > 0 && (
              <div className="hidden md:flex items-center gap-4">
                {stats.map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-[15px] font-black text-gray-900 leading-none">{s.value}</p>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5 uppercase tracking-wide">{s.label}</p>
                  </div>
                ))}
                {actions && <div className="w-px h-8 bg-gray-100 mx-1" />}
              </div>
            )}

            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}
