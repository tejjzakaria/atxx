"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";

type UserRow = {
  _id: string;
  name: string;
  email: string;
  role: "owner" | "admin";
  status: "active" | "suspended";
  lastLoginAt: string | null;
  storeCount: number;
};

function RoleBadge({ role }: { role: "owner" | "admin" }) {
  return role === "admin" ? (
    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200">Admin</span>
  ) : (
    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">Owner</span>
  );
}

function StatusBadge({ status }: { status: "active" | "suspended" }) {
  return status === "suspended" ? (
    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">Suspended</span>
  ) : (
    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
  );
}

function formatLastActive(iso: string | null) {
  if (!iso) return "Never";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function DeleteUserModal({ user, onClose, onDeleted }: { user: UserRow; onClose: () => void; onDeleted: () => void }) {
  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (confirmInput !== user.email) return;
    setDeleting(true);
    setError("");
    const res = await fetch(`/api/admin/users/${user._id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Failed to delete user"); setDeleting(false); return; }
    onDeleted();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="h-1.5 w-full bg-red-500" />
        <div className="p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Delete User</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            Deleting <span className="font-semibold text-gray-900">{user.email}</span> permanently removes their account. This cannot be reversed.
          </p>
          {error && (
            <p className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-600">
              Type <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">{user.email}</span> to confirm
            </p>
            <input
              value={confirmInput} onChange={e => setConfirmInput(e.target.value)}
              placeholder={user.email} autoFocus
              className="w-full h-10 px-4 rounded-xl border-2 border-red-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 transition-all bg-red-50/50"
            />
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmInput !== user.email || deleting}
                className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {deleting ? "Deleting…" : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users,      setUsers]      = useState<UserRow[] | null>(null);
  const [busyId,     setBusyId]     = useState<string | null>(null);
  const [error,      setError]      = useState("");
  const [search,     setSearch]     = useState("");
  const [deletingUser, setDeletingUser] = useState<UserRow | null>(null);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = useMemo(() => {
    if (!users) return null;
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, search]);

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

  async function toggleStatus(user: UserRow) {
    const nextStatus = user.status === "suspended" ? "active" : "suspended";
    setBusyId(user._id);
    setError("");
    const res = await fetch(`/api/admin/users/${user._id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) { setError(data.error ?? "Failed to update status"); return; }
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
          <div className="min-w-0 flex-1">
            <h1 className="text-[17px] font-black text-gray-900 leading-tight tracking-tight">Users</h1>
            <p className="text-[11.5px] text-gray-400 mt-0.5 font-medium truncate">Every account across the platform</p>
          </div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="hidden sm:block w-64 h-9 px-3.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0d9488] focus:bg-[#f0faf9] focus:ring-2 focus:ring-[#0d9488]/20 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 p-6 md:p-8">
        {error && (
          <div className="mb-4 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {!filtered ? (
            <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">No users match.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Stores</th>
                  <th className="px-6 py-3">Last active</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => {
                  const isSelf = u._id === session?.user?.id;
                  return (
                    <tr key={u._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-3.5 font-semibold text-gray-900">
                        {u.name || "—"}{isSelf && <span className="ml-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">You</span>}
                      </td>
                      <td className="px-6 py-3.5 text-gray-600">{u.email}</td>
                      <td className="px-6 py-3.5"><RoleBadge role={u.role} /></td>
                      <td className="px-6 py-3.5"><StatusBadge status={u.status} /></td>
                      <td className="px-6 py-3.5 text-gray-700">{u.storeCount}</td>
                      <td className="px-6 py-3.5 text-gray-500 text-xs">{formatLastActive(u.lastLoginAt)}</td>
                      <td className="px-6 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => toggleRole(u)}
                            disabled={busyId === u._id || isSelf}
                            title={isSelf ? "You can't change your own role" : undefined}
                            className="text-xs font-semibold text-[#0d9488] hover:underline disabled:opacity-40 disabled:no-underline whitespace-nowrap"
                          >
                            {busyId === u._id ? "…" : u.role === "admin" ? "Demote" : "Promote"}
                          </button>
                          <button
                            onClick={() => toggleStatus(u)}
                            disabled={busyId === u._id || isSelf}
                            title={isSelf ? "You can't suspend your own account" : undefined}
                            className="text-xs font-semibold text-amber-600 hover:underline disabled:opacity-40 disabled:no-underline whitespace-nowrap"
                          >
                            {u.status === "suspended" ? "Reactivate" : "Suspend"}
                          </button>
                          <button
                            onClick={() => setDeletingUser(u)}
                            disabled={isSelf}
                            title={isSelf ? "You can't delete your own account" : undefined}
                            className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-40 disabled:no-underline whitespace-nowrap"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {deletingUser && (
        <DeleteUserModal
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onDeleted={fetchUsers}
        />
      )}
    </div>
  );
}
