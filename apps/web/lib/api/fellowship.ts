import { apiClient } from "@/lib/api/client";
import {
  Company,
  Mentor,
  MentorPortalContext,
  Project,
  StudentCohortAssignment,
  StudentPortalContext,
  TeamMentorAssignment,
  TeamProjectAssignment,
} from "@/types/fellowship";

// ==================== Mentors ====================

export async function fetchMentors(params?: {
  status?: string;
  search?: string;
}): Promise<Mentor[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append("status", params.status);
  if (params?.search) query.append("search", params.search);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiClient<Mentor[]>(`/mentors${qs}`);
}

export async function fetchMentorById(id: string): Promise<Mentor> {
  return apiClient<Mentor>(`/mentors/${id}`);
}

export async function createMentor(data: {
  full_name: string;
  email: string;
  password?: string;
  company_name?: string;
  designation?: string;
  expertise?: string[];
  years_of_experience?: number;
  linkedin_url?: string;
  bio?: string;
}): Promise<Mentor> {
  return apiClient<Mentor>("/mentors", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ==================== Companies ====================

export async function fetchCompanies(params?: {
  industry?: string;
  status?: string;
  search?: string;
}): Promise<Company[]> {
  const query = new URLSearchParams();
  if (params?.industry) query.append("industry", params.industry);
  if (params?.status) query.append("status", params.status);
  if (params?.search) query.append("search", params.search);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiClient<Company[]>(`/companies${qs}`);
}

export async function fetchCompanyById(id: string): Promise<Company> {
  return apiClient<Company>(`/companies/${id}`);
}

export async function createCompany(data: {
  name: string;
  industry: string;
  profile: string;
  contact_email: string;
  website?: string;
  contact_name?: string;
  contact_phone?: string;
  logo_url?: string;
}): Promise<Company> {
  return apiClient<Company>("/companies", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ==================== Projects ====================

export async function fetchProjects(params?: {
  company_id?: string;
  status?: string;
  search?: string;
}): Promise<Project[]> {
  const query = new URLSearchParams();
  if (params?.company_id) query.append("company_id", params.company_id);
  if (params?.status) query.append("status", params.status);
  if (params?.search) query.append("search", params.search);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiClient<Project[]>(`/projects${qs}`);
}

export async function fetchProjectById(id: string): Promise<Project> {
  return apiClient<Project>(`/projects/${id}`);
}

export async function createProject(data: {
  company_id: string;
  title: string;
  description: string;
  objectives: string;
  expected_deliverables: string;
  difficulty?: string;
  max_teams?: number;
  start_date?: string;
  end_date?: string;
}): Promise<Project> {
  return apiClient<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ==================== Assignments ====================

export async function fetchMentorAssignments(params?: {
  team_id?: string;
  mentor_id?: string;
  status?: string;
}): Promise<TeamMentorAssignment[]> {
  const query = new URLSearchParams();
  if (params?.team_id) query.append("team_id", params.team_id);
  if (params?.mentor_id) query.append("mentor_id", params.mentor_id);
  if (params?.status) query.append("status", params.status);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiClient<TeamMentorAssignment[]>(`/team-assignments/mentors${qs}`);
}

export async function assignMentorToTeam(data: {
  team_id: string;
  mentor_id: string;
  notes?: string;
}): Promise<TeamMentorAssignment> {
  return apiClient<TeamMentorAssignment>("/team-assignments/mentors", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function unassignMentorFromTeam(assignmentId: string): Promise<void> {
  return apiClient<void>(`/team-assignments/mentors/${assignmentId}`, {
    method: "DELETE",
  });
}

export async function fetchProjectAssignments(params?: {
  team_id?: string;
  project_id?: string;
  company_id?: string;
  status?: string;
}): Promise<TeamProjectAssignment[]> {
  const query = new URLSearchParams();
  if (params?.team_id) query.append("team_id", params.team_id);
  if (params?.project_id) query.append("project_id", params.project_id);
  if (params?.company_id) query.append("company_id", params.company_id);
  if (params?.status) query.append("status", params.status);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiClient<TeamProjectAssignment[]>(`/team-assignments/projects${qs}`);
}

export async function assignProjectToTeam(data: {
  team_id: string;
  project_id: string;
  notes?: string;
}): Promise<TeamProjectAssignment> {
  return apiClient<TeamProjectAssignment>("/team-assignments/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function unassignProjectFromTeam(assignmentId: string): Promise<void> {
  return apiClient<void>(`/team-assignments/projects/${assignmentId}`, {
    method: "DELETE",
  });
}

export async function assignStudentToCohort(data: {
  student_id: string;
  cohort_id: string;
}): Promise<StudentCohortAssignment> {
  return apiClient<StudentCohortAssignment>("/student-cohort-assignments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ==================== Portal Context ====================

export async function fetchStudentPortalContext(userId?: string): Promise<StudentPortalContext> {
  const query = userId && userId !== "undefined" ? `?user_id=${userId}` : "";
  return apiClient<StudentPortalContext>(`/portal/student-context${query}`);
}

export async function fetchMentorPortalContext(userId?: string): Promise<MentorPortalContext> {
  const query = userId && userId !== "undefined" ? `?user_id=${userId}` : "";
  return apiClient<MentorPortalContext>(`/portal/mentor-context${query}`);
}
