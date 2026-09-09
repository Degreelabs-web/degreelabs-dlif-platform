from __future__ import annotations

import httpx

from app.core.config import settings


class SupabaseAdminError(Exception):
    """Raised when a Supabase Admin API operation fails."""


class SupabaseAdminService:
    def __init__(self) -> None:
        if not settings.supabase_url:
            raise RuntimeError("SUPABASE_URL is not configured")

        if not settings.supabase_service_role_key:
            raise RuntimeError(
                "SUPABASE_SERVICE_ROLE_KEY is not configured"
            )

        self.base_url = settings.supabase_url.rstrip("/")
        self.headers = {
            "apikey": settings.supabase_service_role_key,
            "Authorization": (
                f"Bearer {settings.supabase_service_role_key}"
            ),
            "Content-Type": "application/json",
        }

    def create_user(
        self,
        *,
        email: str,
        password: str | None = None,
        full_name: str | None = None,
        email_confirm: bool = True,
    ) -> dict:
        payload: dict = {
            "email": email,
            "email_confirm": email_confirm,
        }

        if password:
            payload["password"] = password

        if full_name:
            payload["user_metadata"] = {
                "full_name": full_name,
            }

        response = httpx.post(
            f"{self.base_url}/auth/v1/admin/users",
            headers=self.headers,
            json=payload,
            timeout=15,
        )

        if response.status_code not in (200, 201):
            raise SupabaseAdminError(
                f"Supabase user creation failed: "
                f"{response.status_code}: {response.text}"
            )

        return response.json()

    def delete_user(self, user_id: str) -> None:
        response = httpx.delete(
            f"{self.base_url}/auth/v1/admin/users/{user_id}",
            headers=self.headers,
            timeout=15,
        )

        if response.status_code not in (200, 204):
            raise SupabaseAdminError(
                f"Supabase user deletion failed: "
                f"{response.status_code}: {response.text}"
            )