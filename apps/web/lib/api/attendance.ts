import { apiClient } from "@/lib/api/client";
import { AttendanceMarkRequest, AttendanceRecord } from "@/types/fellowship";

export async function fetchAttendance(params?: {
  session_id?: string;
  student_id?: string;
  status?: string;
}): Promise<AttendanceRecord[]> {
  const query = new URLSearchParams();
  if (params?.session_id) query.append("session_id", params.session_id);
  if (params?.student_id) query.append("student_id", params.student_id);
  if (params?.status) query.append("status", params.status);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiClient<AttendanceRecord[]>(`/attendance${qs}`);
}

export async function recordAttendance(
  data: AttendanceMarkRequest
): Promise<AttendanceRecord> {
  return apiClient<AttendanceRecord>("/attendance", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
