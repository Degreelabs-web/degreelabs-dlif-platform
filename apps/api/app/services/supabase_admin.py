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
            # An invitation requires Supabase Auth's own outbound mail service.
            # If that service is unavailable, still provision the identity so a
            # valid mentor record can be synchronized into the DLIF directory.
            # The account can be activated through the existing admin workflow.
            if response.status_code >= 500:
                try:
                    created_user = self.create_user(
                        email=normalized_email,
                        full_name=full_name,
                        email_confirm=True,
                    )
                    return created_user, True
                except SupabaseAdminError:
                    pass
            raise SupabaseAdminError(
                f"Supabase invitation failed with status {response.status_code}."
            )

        return response.json(), True

    def create_pending_mentor_user(
        self,
        *,
        email: str,
        full_name: str,
    ) -> tuple[dict, bool]:
        """Create an email-confirmed identity with no usable password.

        Mentors receive a separately generated recovery link immediately after
        their local pending record commits. This avoids relying on Supabase's
        invite mailer and, importantly, never creates or emails a temporary
        password.
        """
        normalized_email = email.strip().lower()
        existing = self.get_user_by_email(normalized_email)
        if existing:
            return existing, False
        return (
            self.create_user(
                email=normalized_email,
                full_name=full_name,
                email_confirm=True,
            ),
            True,
        )

    def generate_password_setup_link(
        self,
        *,
        email: str,
        redirect_to: str,
    ) -> str:
        """Ask Supabase Auth to mint a short-lived, single-use recovery URL."""
        if not redirect_to:
            raise SupabaseAdminError(
                "MENTOR_PASSWORD_SETUP_REDIRECT_URL is not configured."
            )
        try:
            response = httpx.post(
                f"{self.base_url}/auth/v1/admin/generate_link",
                headers=self.headers,
                json={
                    "type": "recovery",
                    "email": email.strip().lower(),
                    "options": {"redirect_to": redirect_to},
                },
                timeout=15,
            )
        except httpx.HTTPError as exc:
            raise SupabaseAdminError(
                "Supabase password setup link could not be generated."
            ) from exc

        if response.status_code not in (200, 201):
            raise SupabaseAdminError(
                "Supabase password setup link generation failed."
            )
        action_link = response.json().get("action_link")
        if not isinstance(action_link, str) or not action_link:
            raise SupabaseAdminError(
                "Supabase did not return a password setup link."
            )
        return action_link

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
