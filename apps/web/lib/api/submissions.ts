import { apiClient } from "@/lib/api/client";
import {
  Submission,
  SubmissionCreate,
  SubmissionVersion,
  SubmissionVersionSubmit,
} from "@/types/fellowship";

export async function fetchSubmissions(params?: {
  team_id?: string;
  task_id?: string;
  status?: string;
}): Promise<Submission[]> {
  const query = new URLSearchParams();
  if (params?.team_id) query.append("team_id", params.team_id);
  if (params?.task_id) query.append("task_id", params.task_id);
  if (params?.status) query.append("status", params.status);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiClient<Submission[]>(`/submissions${qs}`);
}

export async function fetchSubmissionById(id: string): Promise<Submission> {
  return apiClient<Submission>(`/submissions/${id}`);
}

export async function submitTask(data: SubmissionCreate): Promise<Submission> {
  return apiClient<Submission>("/submissions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function submitNewVersion(
  submissionId: string,
  data: SubmissionVersionSubmit
): Promise<Submission> {
  return apiClient<Submission>(`/submissions/${submissionId}/versions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchSubmissionVersions(
  submissionId: string
): Promise<SubmissionVersion[]> {
  return apiClient<SubmissionVersion[]>(`/submissions/${submissionId}/versions`);
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: string
): Promise<Submission> {
  return apiClient<Submission>(`/submissions/${submissionId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteSubmission(submissionId: string): Promise<void> {
  return apiClient<void>(`/submissions/${submissionId}`, {
    method: "DELETE",
  });
}
