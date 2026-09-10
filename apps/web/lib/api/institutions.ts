import { apiClient } from "@/lib/api/client";
import {
  Institution,
  InstitutionCreate,
  InstitutionUpdate,
} from "@/types/fellowship";

export async function fetchInstitutions(): Promise<Institution[]> {
  return apiClient<Institution[]>("/institutions");
}

export async function fetchInstitutionById(id: string): Promise<Institution> {
  return apiClient<Institution>(`/institutions/${id}`);
}

export async function createInstitution(
  data: InstitutionCreate
): Promise<Institution> {
  return apiClient<Institution>("/institutions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateInstitution(
  id: string,
  data: InstitutionUpdate
): Promise<Institution> {
  return apiClient<Institution>(`/institutions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteInstitution(id: string): Promise<void> {
  return apiClient<void>(`/institutions/${id}`, {
    method: "DELETE",
  });
}
