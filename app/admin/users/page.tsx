"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

type UserRow = {
  _id: string;
  name: string;
  email: string;
  role: "owner" | "admin";
  storeCount: number;
};

function RoleBadge({ role }: { role: "owner" | "admin" }) {
  return role === "admin" ? (
    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200">Admin</span>
  ) : (
    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">Owner</span>
  );
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users,   setUsers]   = useState<UserRow[] | null>(null);
  const [busyId,  setBusyId]  = useState<string | null>(null);
  const [error,   setError]   = useState("");

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function toggleRole(user: UserRow) {
    const nextRole = user.role === "admin" ? "owner" : "admin";
    setBusyId(user._id);
    setError("");
    const res = await fetch(`/api/admin/users/${user._id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) { setError(data.error ?? "Failed to update role"); return; }
    fetchUsers();
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div className="sticky top-0 z-20 bg-white flex-shrink-0" style={{ boxShadow: "0 1px 0 #e5e7eb, 0 4px 16px rgba(0,0,0,0.04)" }}>
        <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #ec4899 0%, #0d9488 40%, #14b8a6 100%)" }} />
        <div className="px-6 md:px-8 py-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm bg-[#0d3d38]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-[17px] font-black text-gray-900 leading-tight tracking-tight">Users</h1>
            <p className="text-[11.5px] text-gray-400 mt-0.5 font-medium truncate">Every account across the platform</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-8">
        {error && (
          <div className="mb-4 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {!users ? (
            <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">No users yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Stores</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => {
                  const isSelf = u._id === session?.user?.id;
                  return (
                    <tr key={u._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-3.5 font-semibold text-gray-900">
                        {u.name || "—"}{isSelf && <span className="ml-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">You</span>}
                      </td>
                      <td className="px-6 py-3.5 text-gray-600">{u.email}</td>
                      <td className="px-6 py-3.5"><RoleBadge role={u.role} /></td>
                      <td className="px-6 py-3.5 text-gray-700">{u.storeCount}</td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => toggleRole(u)}
                          disabled={busyId === u._id}
                          className="text-xs font-semibold text-[#0d9488] hover:underline disabled:opacity-50 whitespace-nowrap"
                        >
                          {busyId === u._id ? "…" : u.role === "admin" ? "Demote to owner" : "Promote to admin"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
