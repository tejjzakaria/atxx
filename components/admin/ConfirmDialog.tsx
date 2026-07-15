"use client";

export default function ConfirmDialog({
  title, message, confirmLabel = "Confirm", danger = false, confirming = false, onConfirm, onClose,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  confirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className={`h-1.5 w-full ${danger ? "bg-red-500" : "bg-gradient-to-r from-[#0d3d38] to-[#14b8a6]"}`} />
        <div className="p-7">
          <h2 className="text-base font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={confirming}
              className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={confirming}
              className={`flex-1 h-10 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50 ${
                danger ? "bg-red-600 hover:bg-red-700" : "bg-[#0d3d38] hover:bg-[#0f4a43]"
              }`}
            >
              {confirming ? "…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
