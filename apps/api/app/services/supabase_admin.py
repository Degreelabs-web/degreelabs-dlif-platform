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

    def get_user_by_email(self, email: str) -> dict | None:
        normalized_email = email.strip().lower()
        page = 1
        per_page = 1000
        while True:
            try:
                response = httpx.get(
                    f"{self.base_url}/auth/v1/admin/users",
                    headers=self.headers,
                    params={"page": page, "per_page": per_page},
                    timeout=15,
                )
            except httpx.HTTPError as exc:
                raise SupabaseAdminError(
                    "Supabase user lookup could not be completed."
                ) from exc

            if response.status_code != 200:
                raise SupabaseAdminError(
                    f"Supabase user lookup failed with status {response.status_code}."
                )
            users = response.json().get("users", [])
            for user in users:
                if user.get("email", "").lower() == normalized_email:
                    return user
            if len(users) < per_page:
                return None
            page += 1

    def invite_user(
        self,
        *,
        email: str,
        full_name: str,
        redirect_to: str | None = None,
    ) -> tuple[dict, bool]:
        normalized_email = email.strip().lower()
        existing = self.get_user_by_email(normalized_email)
        if existing:
            return existing, False

        payload: dict = {
            "email": normalized_email,
            "data": {"full_name": full_name},
        }
        if redirect_to:
            payload["redirect_to"] = redirect_to

        try:
            response = httpx.post(
                f"{self.base_url}/auth/v1/invite",
                headers=self.headers,
                json=payload,
                timeout=15,
            )
        except httpx.HTTPError as exc:
            raise SupabaseAdminError(
                "Supabase invitation could not be sent."
            ) from exc

        if response.status_code not in (200, 201):
            raise SupabaseAdminError(
                f"Supabase invitation failed with status {response.status_code}."
            )

        return response.json(), True

    def update_user(
        self,
        user_id: str,
        *,
        password: str | None = None,
        full_name: str | None = None,
    ) -> dict:
        payload: dict = {}
        if password:
            payload["password"] = password
        if full_name:
            payload["user_metadata"] = {"full_name": full_name}

        response = httpx.put(
            f"{self.base_url}/auth/v1/admin/users/{user_id}",
            headers=self.headers,
            json=payload,
            timeout=15,
        )

        if response.status_code not in (200, 201):
            raise SupabaseAdminError(
                f"Supabase user update failed: "
                f"status {response.status_code}."
            )

        return response.json()

    def create_user(
        self,
        *,
        email: str,
        password: str | None = None,
        full_name: str | None = None,
        email_confirm: bool = True,
    ) -> dict:
        payload: dict = {
            "email": email.strip().lower(),
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
            err_text = response.text
            # If user already registered in Supabase Auth, retrieve and update password
            if "already been registered" in err_text or "email_exists" in err_text:
                existing = self.get_user_by_email(email)
                if existing:
                    if password or full_name:
                        return self.update_user(
                            existing["id"],
                            password=password,
                            full_name=full_name,
                        )
                    return existing

            raise SupabaseAdminError(
                f"Supabase user creation failed: "
                f"status {response.status_code}."
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
                f"status {response.status_code}."
            )
