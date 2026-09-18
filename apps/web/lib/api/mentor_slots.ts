import { apiClient } from "@/lib/api/client";

export interface MentorSlotRequest {
  id: string;
  team_id: string;
  team_name?: string;
  cohort_name?: string;
  requested_by_user_id: string;
  requester_name?: string;
  requester_email?: string;
  preferred_date: string;
  preferred_time_start: string;
  preferred_time_end: string;
  topic: string;
  status: "pending" | "approved" | "declined" | "cancelled";
  assigned_mentor_id?: string | null;
  assigned_mentor_name?: string | null;
  confirmed_start_time?: string | null;
  confirmed_end_time?: string | null;
  meet_link?: string | null;
  google_event_id?: string | null;
  admin_note?: string | null;
  created_at: string;
  responded_at?: string | null;
}

export interface MentorSlotRequestCreate {
  preferred_date: string;
  preferred_time_start: string;
  preferred_time_end: string;
  topic: string;
}

export interface MentorSlotApprove {
  assigned_mentor_id: string;
  confirmed_start_time: string;
  confirmed_end_time: string;
  admin_note?: string;
}

export interface MentorSlotDecline {
  admin_note: string;
}

export async function requestMentorSlot(
  teamId: string,
  data: MentorSlotRequestCreate
): Promise<MentorSlotRequest> {
  return apiClient<MentorSlotRequest>(`/teams/${teamId}/mentor-slot-requests`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchTeamMentorSlots(
  teamId: string
): Promise<MentorSlotRequest[]> {
  return apiClient<MentorSlotRequest[]>(`/teams/${teamId}/mentor-slot-requests`);
}

export async function fetchAdminMentorSlots(
  statusFilter?: string
): Promise<MentorSlotRequest[]> {
  const qs = statusFilter && statusFilter !== "all" ? `?status=${encodeURIComponent(statusFilter)}` : "";
  return apiClient<MentorSlotRequest[]>(`/admin/mentor-slot-requests${qs}`);
}

export async function approveMentorSlot(
  requestId: string,
  data: MentorSlotApprove
): Promise<MentorSlotRequest> {
  return apiClient<MentorSlotRequest>(`/admin/mentor-slot-requests/${requestId}/approve`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function declineMentorSlot(
  requestId: string,
  data: MentorSlotDecline
): Promise<MentorSlotRequest> {
  return apiClient<MentorSlotRequest>(`/admin/mentor-slot-requests/${requestId}/decline`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export interface MentorSlotRequestUpdateData {
  preferred_date?: string;
  preferred_time_start?: string;
  preferred_time_end?: string;
  topic?: string;
}

export async function updateMentorSlot(
  teamId: string,
  requestId: string,
  data: MentorSlotRequestUpdateData
): Promise<MentorSlotRequest> {
  return apiClient<MentorSlotRequest>(`/teams/${teamId}/mentor-slot-requests/${requestId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function cancelMentorSlot(
  teamId: string,
  requestId: string
): Promise<void> {
  return apiClient<void>(`/teams/${teamId}/mentor-slot-requests/${requestId}`, {
    method: "DELETE",
  });
}

/** Admin: reschedule an approved slot, regenerating the Meet link */
export async function rescheduleAdminMentorSlot(
  requestId: string,
  data: MentorSlotApprove
): Promise<MentorSlotRequest> {
  return apiClient<MentorSlotRequest>(
    `/admin/mentor-slot-requests/${requestId}/reschedule`,
    { method: "PATCH", body: JSON.stringify(data) }
  );
}

/** Admin: permanently delete any slot request regardless of status */
export async function deleteAdminMentorSlot(requestId: string): Promise<void> {
  return apiClient<void>(`/admin/mentor-slot-requests/${requestId}`, {
    method: "DELETE",
  });
}
