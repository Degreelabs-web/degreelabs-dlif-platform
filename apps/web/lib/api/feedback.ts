import { apiClient } from "@/lib/api/client";
import { Feedback, FeedbackCreate, FeedbackUpdate } from "@/types/fellowship";

export async function fetchFeedback(params?: {
  submission_id?: string;
  reviewer_id?: string;
}): Promise<Feedback[]> {
  const query = new URLSearchParams();
  if (params?.submission_id) query.append("submission_id", params.submission_id);
  if (params?.reviewer_id) query.append("reviewer_id", params.reviewer_id);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiClient<Feedback[]>(`/feedback${qs}`);
}

export async function fetchFeedbackById(id: string): Promise<Feedback> {
  return apiClient<Feedback>(`/feedback/${id}`);
}

export async function createFeedback(data: FeedbackCreate): Promise<Feedback> {
  return apiClient<Feedback>("/feedback", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateFeedback(
  id: string,
  data: FeedbackUpdate
): Promise<Feedback> {
  return apiClient<Feedback>(`/feedback/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteFeedback(id: string): Promise<void> {
  return apiClient<void>(`/feedback/${id}`, {
    method: "DELETE",
  });
}
