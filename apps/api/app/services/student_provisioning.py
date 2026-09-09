from __future__ import annotations

from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.institution import Institution
from app.db.models.student_profile import StudentProfile
from app.db.models.user import User
from app.services.supabase_admin import (
    SupabaseAdminError,
    SupabaseAdminService,
)


class StudentProvisioningError(Exception):
    """Raised when student provisioning fails."""


class StudentProvisioningService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.supabase = SupabaseAdminService()

    def provision_student(
        self,
        *,
        email: str,
        full_name: str,
        institution_id: UUID,
        student_id: str,
        phone: str | None = None,
        course: str | None = None,
        branch: str | None = None,
        graduation_year: int | None = None,
        password: str | None = None,
    ) -> tuple[User, StudentProfile]:

        # 1. Validate institution.
        institution = self.db.get(Institution, institution_id)

        if institution is None:
            raise StudentProvisioningError(
                f"Institution with id '{institution_id}' not found."
            )

        # 2. Prevent duplicate application users.
        existing_user = (
            self.db.query(User)
            .filter(User.email == email)
            .first()
        )

        if existing_user is not None:
            raise StudentProvisioningError(
                f"Application user with email '{email}' already exists."
            )

        supabase_user: dict | None = None

        try:
            # 3. Create Supabase Auth identity.
            supabase_user = self.supabase.create_user(
                email=email,
                password=password,
                full_name=full_name,
                email_confirm=True,
            )

            auth_user_id = supabase_user.get("id")

            if not auth_user_id:
                raise StudentProvisioningError(
                    "Supabase did not return a user ID."
                )

            user_id = UUID(auth_user_id)

            # 4. Create application user using Auth UUID.
            user = User(
                id=user_id,
                email=email,
                full_name=full_name,
                role="student",
                status="active",
            )

            self.db.add(user)

            # Make sure User constraints are checked before profile creation.
            self.db.flush()

            # 5. Create student profile using the SAME UUID.
            profile = StudentProfile(
                user_id=user_id,
                institution_id=institution_id,
                student_id=student_id,
                phone=phone,
                course=course,
                branch=branch,
                graduation_year=graduation_year,
            )

            self.db.add(profile)

            # 6. Atomically commit application records.
            self.db.commit()

            self.db.refresh(user)
            self.db.refresh(profile)

            return user, profile

        except SupabaseAdminError as exc:
            self.db.rollback()
            raise StudentProvisioningError(str(exc)) from exc

        except (ValueError, IntegrityError) as exc:
            self.db.rollback()

            # Compensating action:
            # Auth succeeded but application DB provisioning failed.
            if supabase_user and supabase_user.get("id"):
                try:
                    self.supabase.delete_user(
                        supabase_user["id"]
                    )
                except SupabaseAdminError:
                    # Preserve the original provisioning failure.
                    pass

            raise StudentProvisioningError(
                "Could not provision student."
            ) from exc