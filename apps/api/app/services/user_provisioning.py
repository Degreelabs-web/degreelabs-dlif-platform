from __future__ import annotations

from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.user import User
from app.services.supabase_admin import (
    SupabaseAdminError,
    SupabaseAdminService,
)


class UserProvisioningError(Exception):
    """Raised when application-user provisioning fails."""


class UserProvisioningService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.supabase = SupabaseAdminService()

    def provision_user(
        self,
        *,
        email: str,
        full_name: str,
        role: str,
        password: str | None = None,
    ) -> User:
        """
        Create a Supabase Auth user and matching public.users row.

        The Supabase Auth UUID becomes public.users.id.
        """

        existing = (
            self.db.query(User)
            .filter(User.email == email)
            .first()
        )

        if existing:
            if password:
                try:
                    self.supabase.update_user(
                        str(existing.id),
                        password=password,
                        full_name=full_name,
                    )
                except Exception:
                    pass
            existing.role = role
            existing.full_name = full_name
            existing.status = "active"
            self.db.commit()
            self.db.refresh(existing)
            return existing

        supabase_user: dict | None = None

        try:
            # 1. Create identity in Supabase Auth.
            supabase_user = self.supabase.create_user(
                email=email,
                password=password,
                full_name=full_name,
                email_confirm=True,
            )

            supabase_user_id = supabase_user.get("id")

            if not supabase_user_id:
                raise UserProvisioningError(
                    "Supabase did not return a user ID."
                )

            application_user_id = UUID(supabase_user_id)

            # 2. Create application identity using the SAME UUID.
            user = User(
                id=application_user_id,
                email=email,
                full_name=full_name,
                role=role,
                status="active",
            )

            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)

            return user

        except SupabaseAdminError as exc:
            self.db.rollback()
            raise UserProvisioningError(str(exc)) from exc

        except (ValueError, IntegrityError) as exc:
            self.db.rollback()

            # Compensating action:
            # remove the Supabase Auth user if application DB creation failed.
            if supabase_user and supabase_user.get("id"):
                try:
                    self.supabase.delete_user(
                        supabase_user["id"]
                    )
                except SupabaseAdminError:
                    # Do not hide the original provisioning failure.
                    pass

            raise UserProvisioningError(
                "Could not provision application user."
            ) from exc