"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Status } from "@/lib/stores";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

type UserOption = { _id: string; name: string; email: string };

function ReassignOwnerModal({
  storeId, currentOwnerId, onClose, onReassigned,
}: {
  storeId: string; currentOwnerId: string; onClose: () => void; onReassigned: (name: string, email: string) => void;
}) {
  const [users,    setUsers]    = useState<UserOption[] | null>(null);
  const [selected, setSelected] = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    fetch("/api/admin/users").then(r => r.ok ? r.json() : []).then(setUsers);
  }, []);

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/stores/${storeId}/owner`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId: selected }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Failed to reassign"); return; }
    onReassigned(data.ownerName, data.ownerEmail);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#0d3d38] to-[#14b8a6]" />
        <div className="p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Reassign Owner</h2>
          <p className="text-sm text-gray-500 mb-5">Move this store to a different account.</p>

          {error && (
            <p className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          {!users ? (
            <p className="text-sm text-gray-400 py-4">Loading users…</p>
          ) : (
            <select
              value={selected} onChange={e => setSelected(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 transition-all mb-5"
            >
              <option value="">Select a new owner…</option>
              {users.filter(u => u._id !== currentOwnerId).map(u => (
                <option key={u._id} value={u._id}>{u.name || u.email} ({u.email})</option>
              ))}
            </select>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selected || saving}
              className="flex-1 h-11 rounded-xl bg-[#0d3d38] hover:bg-[#0f4a43] text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Reassign"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteStoreModal({ storeName, onClose, onConfirm, deleting }: {
  storeName: string; onClose: () => void; onConfirm: () => void; deleting: boolean;
}) {
  const [input, setInput] = useState("");
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="h-1.5 w-full bg-red-500" />
        <div className="p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Store</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            Deleting <span className="font-semibold text-gray-900">{storeName}</span> permanently removes all products, orders, and analytics. This cannot be reversed.
          </p>
          <p className="text-xs font-semibold text-gray-600 mb-2">
            Type <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">{storeName}</span> to confirm
          </p>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            placeholder={storeName} autoFocus
            className="w-full h-10 px-4 rounded-xl border-2 border-red-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 transition-all bg-red-50/50 mb-5"
          />
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={input !== storeName || deleting}
              className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
              {deleting ? "Deleting…" : "Delete Store"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminStoreActions({
  storeId, storeName, status, ownerId,
}: {
  storeId: string; storeName: string; status: Status; ownerId: string;
}) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [ownerLabel, setOwnerLabel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showReassign, setShowReassign] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [keyMessage, setKeyMessage] = useState("");
  const [confirmPause, setConfirmPause] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  async function togglePause() {
    const next: Status = currentStatus === "Paused" ? "Active" : "Paused";
    setBusy(true);
    setError("");
    const res = await fetch(`/api/stores/${storeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    setConfirmPause(false);
    if (!res.ok) { setError("Failed to update status"); return; }
    setCurrentStatus(next);
    router.refresh();
  }

  async function regenerateKey() {
    setBusy(true);
    setError("");
    setKeyMessage("");
    const res = await fetch(`/api/stores/${storeId}/apikey`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setConfirmRegenerate(false);
    if (!res.ok) { setError(data.error ?? "Failed to regenerate key"); return; }
    setKeyMessage("New API key generated — visible in this store's own Settings → API tab.");
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/stores/${storeId}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) { setError("Failed to delete store"); return; }
    router.push("/admin/stores");
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-6 space-y-4">
      <p className="text-sm font-bold text-gray-900">Admin Actions</p>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}
      {keyMessage && (
        <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <p className="text-xs text-emerald-700">{keyMessage}</p>
        </div>
      )}
      {ownerLabel && (
        <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <p className="text-xs text-emerald-700">Reassigned to {ownerLabel}. Refresh to see it reflected everywhere.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          onClick={() => currentStatus === "Paused" ? togglePause() : setConfirmPause(true)}
          disabled={busy}
          className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 text-left"
        >
          {currentStatus === "Paused" ? "Resume Store" : "Pause Store"}
        </button>

        <button
          onClick={() => setConfirmRegenerate(true)}
          disabled={busy}
          className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 text-left"
        >
          Regenerate API Key
        </button>

        <button
          onClick={() => setShowReassign(true)}
          className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-left"
        >
          Reassign Owner
        </button>

        <a
          href={`/stores/${storeId}/settings`}
          className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-[#0d9488] hover:bg-gray-50 transition-colors flex items-center"
        >
          Store Settings →
        </a>

        <a
          href={`/stores/${storeId}`}
          className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-[#0d9488] hover:bg-gray-50 transition-colors flex items-center"
        >
          Manage products, orders &amp; content →
        </a>

        <button
          onClick={() => setShowDelete(true)}
          className="h-10 px-4 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-sm font-semibold transition-colors text-left mt-2"
        >
          Delete Store
        </button>
      </div>

      {showReassign && (
        <ReassignOwnerModal
          storeId={storeId}
          currentOwnerId={ownerId}
          onClose={() => setShowReassign(false)}
          onReassigned={(name, email) => setOwnerLabel(`${name || email} (${email})`)}
        />
      )}

      {showDelete && (
        <DeleteStoreModal
          storeName={storeName}
          deleting={deleting}
          onClose={() => setShowDelete(false)}
          onConfirm={handleDelete}
        />
      )}

      {confirmPause && (
        <ConfirmDialog
          title="Pause Store"
          message={`Pause ${storeName}? Its storefront will stop being accessible to customers until you resume it.`}
          confirmLabel="Pause Store"
          danger
          confirming={busy}
          onClose={() => setConfirmPause(false)}
          onConfirm={togglePause}
        />
      )}

      {confirmRegenerate && (
        <ConfirmDialog
          title="Regenerate API Key"
          message={`This immediately invalidates ${storeName}'s current API key. Its deployed storefront will fail to submit orders until its CRM_API_KEY env var is updated and redeployed with the new key.`}
          confirmLabel="Regenerate Key"
          danger
          confirming={busy}
          onClose={() => setConfirmRegenerate(false)}
          onConfirm={regenerateKey}
        />
      )}
    </div>
  );
}
