const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

type RequestOptions = RequestInit & {
  token?: string;
};

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token: requestedToken, headers, ...requestOptions } = options;
  let token = requestedToken;

  if (!token && typeof window !== "undefined") {
    token = localStorage.getItem("dlif_token") || undefined;
  }

  const isFormData =
    typeof FormData !== "undefined" && requestOptions.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...requestOptions,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText || `API request failed: ${response.status}`;
    try {
      const errorPayload = JSON.parse(errorText) as { detail?: string };
      if (typeof errorPayload.detail === "string") {
        errorMessage = errorPayload.detail;
      }
    } catch {
      // Preserve plain-text API errors.
    }

    const isAuthenticationRequest = endpoint.startsWith("/auth/");
    if (
      response.status === 401 &&
      !isAuthenticationRequest &&
      typeof window !== "undefined"
    ) {
      localStorage.removeItem("dlif_token");
      localStorage.removeItem("dlif_user");
      const redirect = `${window.location.pathname}${window.location.search}`;
      const loginUrl = new URL("/login", window.location.origin);
      loginUrl.searchParams.set("redirect", redirect);
      window.location.assign(loginUrl.toString());
      throw new Error("Your session has expired. Please sign in again.");
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204 || response.status === 205) {
    return undefined as T;
  }

  return response.json();
}
