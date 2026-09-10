import { apiClient } from "@/lib/api/client";

export interface UserSession {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "student" | "mentor";
  status: string;
}

export interface LoginSuccessResponse {
  access_token: string;
  token_type: string;
  user: UserSession;
  requires_2fa: false;
}

export interface TwoFactorChallengeResponse {
  requires_2fa: true;
  two_factor_token: string;
  masked_email: string;
  methods: string[];
  totp_configured: boolean;
  dev_code?: string | null;
  message?: string;
  access_token?: null;
  user?: null;
}

export type LoginResponse = LoginSuccessResponse | TwoFactorChallengeResponse;

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const data = await apiClient<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (typeof window !== "undefined" && !data.requires_2fa && data.access_token) {
    localStorage.setItem("dlif_token", data.access_token);
    localStorage.setItem("dlif_user", JSON.stringify(data.user));
  }

  return data;
}

export async function verifyTwoFactor(
  twoFactorToken: string,
  code: string
): Promise<LoginSuccessResponse> {
  const data = await apiClient<LoginSuccessResponse>("/auth/2fa/verify", {
    method: "POST",
    body: JSON.stringify({ two_factor_token: twoFactorToken, code }),
  });

  if (typeof window !== "undefined" && data.access_token) {
    localStorage.setItem("dlif_token", data.access_token);
    localStorage.setItem("dlif_user", JSON.stringify(data.user));
  }

  return data;
}

export async function resendTwoFactorCode(
  twoFactorToken: string
): Promise<{ success: boolean; message: string; dev_code?: string }> {
  return apiClient<{ success: boolean; message: string; dev_code?: string }>("/auth/2fa/resend", {
    method: "POST",
    body: JSON.stringify({ two_factor_token: twoFactorToken }),
  });
}

export function getStoredUser(): UserSession | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("dlif_user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("dlif_token");
}

export function logoutUser(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("dlif_token");
    localStorage.removeItem("dlif_user");
    window.location.href = "/login";
  }
}
