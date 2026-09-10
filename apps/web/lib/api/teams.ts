import { apiClient } from "@/lib/api/client";
import {
  Team,
  TeamCreate,
  TeamMember,
  TeamMemberCreate,
  TeamUpdate,
} from "@/types/fellowship";

export async function fetchTeams(params?: {
  cohort_id?: string;
  status?: string;
}): Promise<Team[]> {
  const query = new URLSearchParams();
  if (params?.cohort_id) query.append("cohort_id", params.cohort_id);
  if (params?.status) query.append("status", params.status);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiClient<Team[]>(`/teams${qs}`);
}

export async function fetchTeamById(id: string): Promise<Team> {
  return apiClient<Team>(`/teams/${id}`);
}

export async function createTeam(data: TeamCreate): Promise<Team> {
  return apiClient<Team>("/teams", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTeam(id: string, data: TeamUpdate): Promise<Team> {
  return apiClient<Team>(`/teams/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteTeam(id: string): Promise<void> {
  return apiClient<void>(`/teams/${id}`, {
    method: "DELETE",
  });
}

export async function addTeamMember(
  teamId: string,
  data: TeamMemberCreate
): Promise<TeamMember> {
  return apiClient<TeamMember>(`/teams/${teamId}/members`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function removeTeamMember(
  teamId: string,
  studentId: string
): Promise<void> {
  return apiClient<void>(`/teams/${teamId}/members/${studentId}`, {
    method: "DELETE",
  });
}
