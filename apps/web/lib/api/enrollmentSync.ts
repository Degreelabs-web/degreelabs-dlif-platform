import { apiClient } from "@/lib/api/client";

export interface EnrollmentSyncRun {
  id: string;
  trigger: string;
  source_type: string;
  status: "running" | "success" | "partial" | "failed";
  started_at: string;
  completed_at?: string | null;
  rows_processed: number;
  students_created: number;
  students_updated: number;
  mentors_created: number;
  mentors_updated: number;
  rows_skipped: number;
  validation_errors: Array<{
    sheet: string;
    row: number;
    message: string;
  }>;
  last_error?: string | null;
}

export interface EnrollmentSyncStatus {
  enabled: boolean;
  connected: boolean;
  upload_enabled: boolean;
  source_type: string;
  enrolled_students: number;
  enrolled_mentors: number;
  latest_run?: EnrollmentSyncRun | null;
}

export function fetchEnrollmentSyncStatus(): Promise<EnrollmentSyncStatus> {
  return apiClient<EnrollmentSyncStatus>("/admin/enrollment-sync/status");
}

export function triggerEnrollmentSync(): Promise<{
  accepted: boolean;
  message: string;
}> {
  return apiClient("/admin/enrollment-sync", { method: "POST" });
}

export function uploadEnrollmentWorkbook(file: File): Promise<{
  accepted: boolean;
  message: string;
}> {
  const body = new FormData();
  body.append("workbook", file);
  return apiClient("/admin/enrollment-sync/upload", {
    method: "POST",
    body,
  });
}
