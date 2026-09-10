import { apiClient } from "@/lib/api/client";
import {
  Session,
  SessionCreate,
  SessionResource,
  SessionResourceCreate,
  SessionTask,
  SessionTaskCreate,
  SessionUpdate,
} from "@/types/fellowship";

export async function fetchSessions(params?: {
  cohort_id?: string;
  week_number?: number;
  status?: string;
}): Promise<Session[]> {
  const query = new URLSearchParams();
  if (params?.cohort_id) query.append("cohort_id", params.cohort_id);
  if (params?.week_number) query.append("week_number", params.week_number.toString());
  if (params?.status) query.append("status", params.status);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiClient<Session[]>(`/sessions${qs}`);
}

export async function fetchSessionById(id: string): Promise<Session> {
  return apiClient<Session>(`/sessions/${id}`);
}

export async function createSession(data: SessionCreate): Promise<Session> {
  return apiClient<Session>("/sessions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSession(
  id: string,
  data: SessionUpdate
): Promise<Session> {
  return apiClient<Session>(`/sessions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteSession(id: string): Promise<void> {
  return apiClient<void>(`/sessions/${id}`, {
    method: "DELETE",
  });
}

export async function generateDiscoverCurriculum(
  cohortId: string,
  requestData?: {
    total_weeks?: number;
    start_date?: string;
  }
): Promise<{
  cohort_id: string;
  generated_sessions_count: number;
  sessions: Session[];
}> {
  return apiClient(`/sessions/cohorts/${cohortId}/generate-discover`, {
    method: "POST",
    body: JSON.stringify(requestData || {}),
  });
}

export async function fetchSessionTasks(
  sessionId: string
): Promise<SessionTask[]> {
  return apiClient<SessionTask[]>(`/sessions/${sessionId}/tasks`);
}

export async function createSessionTask(
  sessionId: string,
  data: SessionTaskCreate
): Promise<SessionTask> {
  return apiClient<SessionTask>(`/sessions/${sessionId}/tasks`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchSessionResources(
  sessionId: string
): Promise<SessionResource[]> {
  return apiClient<SessionResource[]>(`/sessions/${sessionId}/resources`);
}

export async function createSessionResource(
  sessionId: string,
  data: SessionResourceCreate
): Promise<SessionResource> {
  return apiClient<SessionResource>(`/sessions/${sessionId}/resources`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
