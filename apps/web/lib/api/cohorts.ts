import { apiClient } from "@/lib/api/client";
import { Cohort, CohortCreate, CohortUpdate } from "@/types/fellowship";

export async function fetchCohorts(params?: {
  institution_id?: string;
  status?: string;
}): Promise<Cohort[]> {
  const query = new URLSearchParams();
  if (params?.institution_id) query.append("institution_id", params.institution_id);
  if (params?.status) query.append("status", params.status);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiClient<Cohort[]>(`/cohorts${qs}`);
}

export async function fetchCohortById(id: string): Promise<Cohort> {
  return apiClient<Cohort>(`/cohorts/${id}`);
}

export async function createCohort(data: CohortCreate): Promise<Cohort> {
  return apiClient<Cohort>("/cohorts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCohort(
  id: string,
  data: CohortUpdate
): Promise<Cohort> {
  return apiClient<Cohort>(`/cohorts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteCohort(id: string): Promise<void> {
  return apiClient<void>(`/cohorts/${id}`, {
    method: "DELETE",
  });
}
