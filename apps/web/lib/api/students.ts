import { apiClient } from "@/lib/api/client";
import {
  Student,
  StudentCreate,
  StudentProvisionRequest,
  StudentUpdate,
} from "@/types/fellowship";

export async function fetchStudents(params?: {
  institution_id?: string;
  status?: string;
}): Promise<Student[]> {
  const query = new URLSearchParams();
  if (params?.institution_id) query.append("institution_id", params.institution_id);
  if (params?.status) query.append("status", params.status);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiClient<Student[]>(`/students${qs}`);
}

export async function fetchStudentById(id: string): Promise<Student> {
  return apiClient<Student>(`/students/${id}`);
}

export async function provisionStudent(
  data: StudentProvisionRequest
): Promise<Student> {
  return apiClient<Student>("/students/provision", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createStudent(data: StudentCreate): Promise<Student> {
  return apiClient<Student>("/students", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateStudent(
  id: string,
  data: StudentUpdate
): Promise<Student> {
  return apiClient<Student>(`/students/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteStudent(id: string): Promise<void> {
  return apiClient<void>(`/students/${id}`, {
    method: "DELETE",
  });
}
