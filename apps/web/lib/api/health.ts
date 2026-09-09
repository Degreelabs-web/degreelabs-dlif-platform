import { apiClient } from "./client";

export type HealthResponse = {
  status: string;
  service: string;
  environment: string;
};

export async function getApiHealth(): Promise<HealthResponse> {
  return apiClient<HealthResponse>("/health");
}