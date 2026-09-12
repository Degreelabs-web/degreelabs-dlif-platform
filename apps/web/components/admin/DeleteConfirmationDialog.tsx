"use client";

import { AlertCircle, Loader2, Trash2 } from "lucide-react";

interface DeleteConfirmationDialogProps {
  open: boolean;
  entityLabel: string;
  entityName: string;
  deleting?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export function DeleteConfirmationDialog({
  open,
  entityLabel,
  entityName,
  deleting = false,
  error,
  onCancel,
  onConfirm,
}: DeleteConfirmationDialogProps) {
  if (!open) return null;

  const titleId = `delete-${entityLabel.toLowerCase().replace(/\s+/g, "-")}-title`;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-bold text-slate-900">
              Delete {entityLabel}?
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              You are about to permanently delete{" "}
              <span className="break-words font-semibold text-slate-900">
                {entityName}
              </span>
              . This action cannot be undone.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={deleting}
            className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {deleting ? "Deleting..." : `Delete ${entityLabel}`}
          </button>
        </div>
      </div>
    </div>
  );
}
