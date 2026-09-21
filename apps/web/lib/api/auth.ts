import { apiClient } from "@/lib/api/client";

export interface UserSession {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "student" | "mentor";
  status: string;
  // Student-only enrichment fields (null/undefined for non-students)
  photo_url?: string | null;
  phone?: string | null;
  course?: string | null;
  branch?: string | null;
  current_year_semester?: string | null;
  graduation_year?: number | null;
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
): Promise<{ success: boolean; message: string; two_factor_token: string }> {
  return apiClient<{
    success: boolean;
    message: string;
    two_factor_token: string;
  }>("/auth/2fa/resend", {
    method: "POST",
    body: JSON.stringify({ two_factor_token: twoFactorToken }),
  });
}

export async function completeMentorOnboarding(
  password: string,
  recoveryToken: string
): Promise<UserSession> {
  return apiClient<UserSession>("/auth/mentor-onboarding/complete", {
    method: "POST",
    token: recoveryToken,
    body: JSON.stringify({ password }),
  });
}

export async function completeStudentOnboarding(
  password: string,
  recoveryToken: string
): Promise<UserSession> {
  return apiClient<UserSession>("/auth/student-onboarding/complete", {
    method: "POST",
    token: recoveryToken,
    body: JSON.stringify({ password }),
  });
}

/**
 * Update the authenticated user's profile (name + student fields).
 * All fields are optional — only supply what changed.
 */
export async function updateCurrentUserProfile(fields: {
  full_name?: string;
  phone?: string;
  course?: string;
  branch?: string;
  current_year_semester?: string;
}): Promise<UserSession> {
  const user = await apiClient<UserSession>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(fields),
  });

  if (typeof window !== "undefined") {
    localStorage.setItem("dlif_user", JSON.stringify(user));
    window.dispatchEvent(new Event("dlif_user_updated"));
  }

  return user;
}

/**
 * Upload a new profile photo for the current student.
 * Returns the updated UserSession (including signed photo_url).
 */
export async function uploadProfilePhoto(file: File): Promise<UserSession> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("dlif_token") : null;

  const formData = new FormData();
  formData.append("file", file);

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

  const res = await fetch(`${apiBase}/auth/me/photo`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string })?.detail ?? "Photo upload failed.");
  }

  const user: UserSession = await res.json();

  if (typeof window !== "undefined") {
    localStorage.setItem("dlif_user", JSON.stringify(user));
    window.dispatchEvent(new Event("dlif_user_updated"));
  }

  return user;
}

export async function fetchCurrentUserProfile(): Promise<UserSession> {
  const user = await apiClient<UserSession>("/auth/me");

  if (typeof window !== "undefined") {
    localStorage.setItem("dlif_user", JSON.stringify(user));
    window.dispatchEvent(new Event("dlif_user_updated"));
  }

  return user;
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
