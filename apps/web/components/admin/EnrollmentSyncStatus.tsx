"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Database,
  Loader2,
  RefreshCw,
  Upload,
} from "lucide-react";

import {
  EnrollmentSyncStatus as EnrollmentSyncStatusData,
  fetchEnrollmentSyncStatus,
  triggerEnrollmentSync,
  uploadEnrollmentWorkbook,
} from "@/lib/api/enrollmentSync";

type EnrollmentSyncStatusProps = {
  entity: "students" | "mentors";
  onSynced: () => void | Promise<void>;
  refreshKey?: number;
};

const POLL_DELAY_MS = 1500;
const MAX_POLL_ATTEMPTS = 20;

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export function EnrollmentSyncStatus({
  entity,
  onSynced,
  refreshKey = 0,
}: EnrollmentSyncStatusProps) {
  const [status, setStatus] = useState<EnrollmentSyncStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  async function loadStatus() {
    const data = await fetchEnrollmentSyncStatus();
    setStatus(data);
    return data;
  }

  useEffect(() => {
    let active = true;
    fetchEnrollmentSyncStatus()
      .then((data) => {
        if (active) setStatus(data);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Could not load enrollment sync status."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  async function pollUntilComplete(previousRunId?: string) {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      await wait(POLL_DELAY_MS);
      const nextStatus = await loadStatus();
      const run = nextStatus.latest_run;
      if (run && run.id !== previousRunId && run.status !== "running") {
        setMessage(
          run.status === "success"
            ? "Enrollment synchronization completed."
            : `Synchronization completed with ${run.rows_skipped} skipped row(s).`
        );
        await onSynced();
        return;
      }
    }
    setMessage("Synchronization is still running. Refresh shortly for its result.");
  }

  async function handleSyncNow() {
    setSyncing(true);
    setError(null);
    setMessage(null);
    const previousRunId = status?.latest_run?.id;

    try {
      const response = await triggerEnrollmentSync();
      setMessage(response.message);

      await pollUntilComplete(previousRunId);
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not start enrollment synchronization."
      );
    } finally {
      setSyncing(false);
    }
  }

  async function handleWorkbookUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    setMessage(null);
    const previousRunId = status?.latest_run?.id;
    try {
      const response = await uploadEnrollmentWorkbook(file);
      setMessage(response.message);
      await pollUntilComplete(previousRunId);
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not upload the enrollment workbook."
      );
    } finally {
      setUploading(false);
    }
  }

  const latestRun = status?.latest_run;
  const count =
    entity === "students"
      ? status?.enrolled_students ?? 0
      : status?.enrolled_mentors ?? 0;
  const entityLabel = entity === "students" ? "enrolled students" : "enrolled mentors";
  const isLocalSource = status?.source_type?.toLowerCase() === "local";

  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-brand-50 p-2.5 text-brand-600">
              <Database className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-500">
                {status?.source_type === "google_sheets"
                  ? "Google Sheets source"
                  : "Enrollment source"}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-slate-900">
                {loading ? (
                  "Checking..."
                ) : status?.connected ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Connected
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-amber-500" /> Not connected
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
              <Clock3 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-500">Last synchronized</p>
              <p className="mt-0.5 text-sm font-bold text-slate-900">
                {latestRun?.completed_at
                  ? new Date(latestRun.completed_at).toLocaleString()
                  : "Not synchronized yet"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-500">Directory total</p>
              <p className="mt-0.5 text-sm font-bold text-slate-900">
                {count} {entityLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {isLocalSource && (
            <>
              <input
                ref={uploadInputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleWorkbookUpload}
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                disabled={loading || uploading || syncing || !status?.upload_enabled}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? "Uploading..." : "Upload Excel"}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleSyncNow}
            disabled={loading || syncing || uploading || !status?.connected}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {syncing ? "Synchronizing..." : "Sync Now"}
          </button>
        </div>
      </div>

      {(message || error || latestRun?.last_error) && (
        <div
          className={`mt-4 rounded-xl px-3 py-2 text-xs font-medium ${
            error || latestRun?.last_error
              ? "bg-rose-50 text-rose-700"
              : "bg-brand-50 text-brand-700"
          }`}
        >
          {error || latestRun?.last_error || message}
        </div>
      )}
    </section>
  );
}
