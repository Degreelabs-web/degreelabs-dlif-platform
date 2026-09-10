import { apiClient } from "@/lib/api/client";
import {
  Challenge,
  ChallengeAssignment,
  ChallengeCreate,
  ChallengeUpdate,
} from "@/types/fellowship";

export async function fetchChallenges(params?: {
  status?: string;
  difficulty?: string;
  search?: string;
}): Promise<Challenge[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append("status", params.status);
  if (params?.difficulty) query.append("difficulty", params.difficulty);
  if (params?.search) query.append("search", params.search);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiClient<Challenge[]>(`/challenges${qs}`);
}

export async function fetchChallengeById(id: string): Promise<Challenge> {
  return apiClient<Challenge>(`/challenges/${id}`);
}

export async function createChallenge(
  data: ChallengeCreate
): Promise<Challenge> {
  return apiClient<Challenge>("/challenges", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateChallenge(
  id: string,
  data: ChallengeUpdate
): Promise<Challenge> {
  return apiClient<Challenge>(`/challenges/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteChallenge(id: string): Promise<void> {
  return apiClient<void>(`/challenges/${id}`, {
    method: "DELETE",
  });
}

export async function fetchChallengeAssignments(params?: {
  cohort_id?: string;
  challenge_id?: string;
}): Promise<ChallengeAssignment[]> {
  const query = new URLSearchParams();
  if (params?.cohort_id) query.append("cohort_id", params.cohort_id);
  if (params?.challenge_id) query.append("challenge_id", params.challenge_id);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiClient<ChallengeAssignment[]>(`/challenge-assignments${qs}`);
}

export async function assignChallengeToCohort(data: {
  cohort_id: string;
  challenge_id: string;
  is_mandatory?: boolean;
  due_date?: string;
}): Promise<ChallengeAssignment> {
  return apiClient<ChallengeAssignment>("/challenge-assignments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
