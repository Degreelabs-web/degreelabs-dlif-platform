from __future__ import annotations

import re
from datetime import datetime, timezone
from uuid import UUID

from pydantic import ValidationError
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.core.config import Settings, settings
from app.db.models.enrollment_sync_run import EnrollmentSyncRun
from app.db.models.institution import Institution
from app.db.models.mentor import Mentor
from app.db.models.student_profile import StudentProfile
from app.db.models.user import User
from app.schemas.enrollment_sync import MentorEnrollmentRow, StudentEnrollmentRow
from app.services.enrollment_sources import EnrollmentSource, build_enrollment_source
from app.services.mentor_onboarding_mapping import MENTOR_ONBOARDING_FIELDS
from app.services.supabase_admin import SupabaseAdminError, SupabaseAdminService


ENROLLMENT_SYNC_LOCK_ID = 445_549_463
MAX_RECORDED_ERRORS = 100


class EnrollmentSyncAlreadyRunning(RuntimeError):
    """Raised when another worker already owns the enrollment sync lock."""


class EnrollmentSyncService:
    def __init__(
        self,
        db: Session,
        *,
        source: EnrollmentSource | None = None,
        supabase: SupabaseAdminService | None = None,
        config: Settings = settings,
    ) -> None:
        self.db = db
        self.config = config
        self.source = source or build_enrollment_source(config)
        self.supabase = supabase
        self._pending_auth_user_id: str | None = None

    def run(self, *, trigger: str = "manual", use_lock: bool = True) -> EnrollmentSyncRun:
        lock_acquired = False
        if use_lock:
            lock_acquired = bool(
                self.db.scalar(
                    text("SELECT pg_try_advisory_lock(:lock_id)"),
                    {"lock_id": ENROLLMENT_SYNC_LOCK_ID},
                )
            )
            if not lock_acquired:
                raise EnrollmentSyncAlreadyRunning(
                    "An enrollment synchronization is already running."
                )

        sync_run = EnrollmentSyncRun(
            trigger=trigger,
            source_type=self.source.source_type,
            status="running",
            validation_errors=[],
        )
        self.db.add(sync_run)
        self.db.commit()
        self.db.refresh(sync_run)

        try:
            if self.supabase is None:
                self.supabase = SupabaseAdminService()
            rows = self.source.read()
            for row in rows.students:
                self._process_row(sync_run, "student", row)
            for row in rows.mentors:
                self._process_row(sync_run, "mentor", row)

            sync_run.status = (
                "partial" if sync_run.rows_skipped else "success"
            )
        except Exception as exc:
            self.db.rollback()
            sync_run = self.db.get(EnrollmentSyncRun, sync_run.id)
            if sync_run is None:
                raise
            sync_run.status = "failed"
            sync_run.last_error = self._safe_error(exc)
        finally:
            sync_run.completed_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(sync_run)
            if lock_acquired:
                self.db.execute(
                    text("SELECT pg_advisory_unlock(:lock_id)"),
                    {"lock_id": ENROLLMENT_SYNC_LOCK_ID},
                )

        return sync_run

    def _process_row(
        self,
        sync_run: EnrollmentSyncRun,
        role: str,
        raw_row: dict[str, object],
    ) -> None:
        sync_run.rows_processed += 1
        row_number = int(raw_row.get("_row_number", 0) or 0)
        self._pending_auth_user_id = None

        try:
            with self.db.begin_nested():
                if role == "student":
                    row = self._parse_student(raw_row)
                    action, _ = self._sync_student(row)
                    if action == "created":
                        sync_run.students_created += 1
                    elif action == "updated":
                        sync_run.students_updated += 1
                else:
                    row = self._parse_mentor(raw_row)
                    action, _ = self._sync_mentor(row)
                    if action == "created":
                        sync_run.mentors_created += 1
                    elif action == "updated":
                        sync_run.mentors_updated += 1
            self.db.commit()
            self._pending_auth_user_id = None
        except Exception as exc:
            self.db.rollback()
            if self._pending_auth_user_id:
                try:
                    if self.supabase is not None:
                        self.supabase.delete_user(self._pending_auth_user_id)
                except SupabaseAdminError:
                    pass
            sync_run = self.db.get(EnrollmentSyncRun, sync_run.id)
            if sync_run is None:
                raise
            sync_run.rows_skipped += 1
            errors = list(sync_run.validation_errors or [])
            if len(errors) < MAX_RECORDED_ERRORS:
                errors.append(
                    {
                        "sheet": role,
                        "row": row_number,
                        "message": self._safe_error(exc),
                    }
                )
                sync_run.validation_errors = errors
            self.db.commit()
            self._pending_auth_user_id = None

    def _sync_student(self, row: StudentEnrollmentRow) -> tuple[str, str | None]:
        if self.supabase is None:
            raise SupabaseAdminError("Supabase administration is not configured.")
        institution = self._find_institution(row.institution)
        if institution is None:
            raise ValueError("The referenced institution does not exist.")

        email = str(row.email)
        user = self.db.scalar(
            select(User).where(func.lower(User.email) == email)
        )
        roll_owner = self.db.scalar(
            select(StudentProfile)
            .where(
                StudentProfile.institution_id == institution.id,
                func.lower(StudentProfile.student_id) == row.student_id.lower(),
            )
        )
        if roll_owner and (user is None or roll_owner.user_id != user.id):
            raise ValueError(
                "The student roll number is already assigned to another account."
            )

        auth_user = self.supabase.get_user_by_email(email)
        created_auth = False
        if auth_user is None:
            auth_user, created_auth = self.supabase.invite_user(
                email=email,
                full_name=row.full_name,
                redirect_to=self.config.enrollment_invite_redirect_url or None,
            )

        auth_user_id = auth_user.get("id")
        if not auth_user_id:
            raise SupabaseAdminError("Supabase did not return a user ID.")
        if created_auth:
            self._pending_auth_user_id = auth_user_id

        if user is None:
            user = User(
                id=UUID(auth_user_id),
                email=email,
                full_name=row.full_name,
                role="student",
                status=row.status,
            )
            self.db.add(user)
            self.db.flush()
            profile = StudentProfile(
                user_id=user.id,
                institution_id=institution.id,
                student_id=row.student_id,
                phone=row.phone,
                course=row.course,
                branch=row.branch,
                graduation_year=row.graduation_year,
            )
            self.db.add(profile)
            self.db.flush()
            return "created", auth_user_id if created_auth else None

        if str(user.id) != auth_user_id:
            raise ValueError(
                "The application user and Supabase identity IDs do not match."
            )
        if user.role != "student":
            raise ValueError("The email already belongs to a non-student account.")

        profile = self.db.scalar(
            select(StudentProfile).where(StudentProfile.user_id == user.id)
        )
        if profile is None:
            profile = StudentProfile(
                user_id=user.id,
                institution_id=institution.id,
                student_id=row.student_id,
            )
            self.db.add(profile)

        changed = self._apply_changes(
            user,
            {"full_name": row.full_name, "status": row.status},
        )
        changed |= self._apply_changes(
            profile,
            {
                "institution_id": institution.id,
                "student_id": row.student_id,
                "phone": row.phone,
                "course": row.course,
                "branch": row.branch,
                "graduation_year": row.graduation_year,
            },
        )
        if changed:
            self.supabase.update_user(auth_user_id, full_name=row.full_name)
            self.db.flush()
            return "updated", None
        return "unchanged", None

    def _sync_mentor(self, row: MentorEnrollmentRow) -> tuple[str, str | None]:
        if self.supabase is None:
            raise SupabaseAdminError("Supabase administration is not configured.")
        email = str(row.email)
        user = self.db.scalar(
            select(User).where(func.lower(User.email) == email)
        )
        desired_status = row.status
        if user is None and self.config.mentor_onboarding_requires_approval:
            desired_status = "pending"
        elif desired_status is None:
            desired_status = user.status if user is not None else "active"

        auth_user = self.supabase.get_user_by_email(email)
        created_auth = False
        if auth_user is None:
            auth_user, created_auth = self.supabase.invite_user(
                email=email,
                full_name=row.full_name,
                redirect_to=self.config.enrollment_invite_redirect_url or None,
            )

        auth_user_id = auth_user.get("id")
        if not auth_user_id:
            raise SupabaseAdminError("Supabase did not return a user ID.")
        if created_auth:
            self._pending_auth_user_id = auth_user_id

        if user is None:
            user = User(
                id=UUID(auth_user_id),
                email=email,
                full_name=row.full_name,
                role="mentor",
                status=desired_status,
            )
            self.db.add(user)
            self.db.flush()
            mentor = Mentor(
                user_id=user.id,
                phone=row.phone,
                company_name=row.company_name,
                designation=row.designation,
                location=row.location or self._format_location(row.city, row.country),
                city=row.city,
                country=row.country,
                professional_headline=row.professional_headline,
                linkedin_url=row.linkedin_url,
                bio=row.bio,
                headshot_url=row.headshot_url,
                expertise=row.expertise,
                industries=row.industries,
                years_of_experience=row.years_of_experience,
                support_preferences=row.support_preferences,
                mentor_statement=row.mentor_statement,
                status=desired_status,
            )
            self.db.add(mentor)
            self.db.flush()
            return "created", auth_user_id if created_auth else None

        if str(user.id) != auth_user_id:
            raise ValueError(
                "The application user and Supabase identity IDs do not match."
            )
        if user.role != "mentor":
            raise ValueError("The email already belongs to a non-mentor account.")

        mentor = self.db.scalar(select(Mentor).where(Mentor.user_id == user.id))
        if mentor is None:
            mentor = Mentor(user_id=user.id)
            self.db.add(mentor)

        changed = self._apply_changes(
            user,
            {"full_name": row.full_name, "status": desired_status},
        )
        changed |= self._apply_changes(
            mentor,
            {
                "phone": row.phone,
                "company_name": row.company_name,
                "designation": row.designation,
                "location": row.location or self._format_location(row.city, row.country),
                "city": row.city,
                "country": row.country,
                "professional_headline": row.professional_headline,
                "linkedin_url": row.linkedin_url,
                "bio": row.bio,
                "headshot_url": row.headshot_url,
                "expertise": row.expertise,
                "industries": row.industries,
                "years_of_experience": row.years_of_experience,
                "support_preferences": row.support_preferences,
                "mentor_statement": row.mentor_statement,
                "status": desired_status,
            },
        )
        if changed:
            self.supabase.update_user(auth_user_id, full_name=row.full_name)
            self.db.flush()
            return "updated", None
        return "unchanged", None

    def _find_institution(self, value: str) -> Institution | None:
        normalized = value.strip().lower()
        return self.db.scalar(
            select(Institution).where(
                (func.lower(Institution.code) == normalized)
                | (func.lower(Institution.name) == normalized)
            )
        )

    def _parse_student(self, row: dict[str, object]) -> StudentEnrollmentRow:
        self._validate_role(row, "student")
        return StudentEnrollmentRow.model_validate(
            {
                "full_name": self._pick(row, "full_name", "name"),
                "email": self._pick(row, "email", "email_address"),
                "student_id": self._pick(row, "student_id", "roll_number", "roll_no"),
                "institution": self._pick(
                    row, "institution_code", "institution", "college"
                ),
                "course": self._optional_text(self._pick(row, "course")),
                "branch": self._optional_text(self._pick(row, "branch")),
                "graduation_year": self._optional_int(
                    self._pick(row, "graduation_year", "graduation")
                ),
                "status": self._normalize_status(self._pick(row, "status")),
                "phone": self._optional_text(
                    self._pick(row, "phone", "phone_number", "mobile_number")
                ),
            }
        )

    def _parse_mentor(self, row: dict[str, object]) -> MentorEnrollmentRow:
        self._validate_role(row, "mentor")
        return MentorEnrollmentRow.model_validate(
            {
                "full_name": self._pick_mapped(row, "full_name"),
                "email": self._pick_mapped(row, "email"),
                "phone": self._optional_text(self._pick_mapped(row, "phone")),
                "company_name": self._optional_text(
                    self._pick_mapped(row, "organisation")
                ),
                "designation": self._optional_text(self._pick_mapped(row, "current_role")),
                "city": self._optional_text(self._pick_mapped(row, "city")),
                "country": self._optional_text(self._pick_mapped(row, "country")),
                "location": self._optional_text(
                    self._pick(row, "location", "city_country")
                ),
                "professional_headline": self._optional_text(
                    self._pick_mapped(row, "professional_headline")
                ),
                "linkedin_url": self._optional_text(
                    self._pick_mapped(row, "linkedin_url")
                ),
                "bio": self._optional_text(
                    self._pick_mapped(row, "bio")
                ),
                "headshot_url": self._optional_text(
                    self._pick_mapped(row, "professional_headshot_url")
                ),
                "expertise": self._normalize_list(
                    self._pick_mapped(row, "expertise")
                ),
                "industries": self._normalize_list(
                    self._pick_mapped(row, "industries")
                ),
                "years_of_experience": self._optional_int(
                    self._pick_mapped(row, "years_of_experience")
                ),
                "support_preferences": self._normalize_list(
                    self._pick(
                        row,
                        "support_preferences",
                        "how_would_you_like_to_support_dlif_fellows",
                    )
                ),
                "mentor_statement": self._optional_text(
                    self._pick_mapped(row, "mentoring_statement")
                ),
                "status": self._normalize_mentor_status(
                    self._pick_mapped(row, "status")
                ),
            }
        )

    @staticmethod
    def _format_location(city: str | None, country: str | None) -> str | None:
        return ", ".join(part for part in (city, country) if part) or None

    @staticmethod
    def _pick_mapped(row: dict[str, object], field: str) -> object | None:
        return EnrollmentSyncService._pick(row, *MENTOR_ONBOARDING_FIELDS[field])

    @staticmethod
    def _pick(row: dict[str, object], *keys: str) -> object | None:
        for key in keys:
            if key in row and row[key] not in (None, ""):
                return row[key]
        return None

    @staticmethod
    def _optional_text(value: object | None) -> str | None:
        if value is None:
            return None
        normalized = " ".join(str(value).strip().split())
        return normalized or None

    @staticmethod
    def _optional_int(value: object | None) -> int | None:
        if value in (None, ""):
            return None
        text_value = str(value).strip()
        try:
            return int(float(text_value))
        except ValueError:
            match = re.search(r"-?\d+", text_value)
            if match is None:
                raise ValueError("Years of professional experience must contain a number.")
            return int(match.group())

    @staticmethod
    def _normalize_expertise(value: object | None) -> list[str]:
        return EnrollmentSyncService._normalize_list(value)

    @staticmethod
    def _normalize_list(value: object | None) -> list[str]:
        if value in (None, ""):
            return []
        if isinstance(value, (list, tuple, set)):
            parts = [str(item) for item in value]
        else:
            parts = re.split(r"[,;\n]", str(value))
        normalized: list[str] = []
        seen: set[str] = set()
        for part in parts:
            item = " ".join(part.strip().split())
            key = item.lower()
            if item and key not in seen:
                normalized.append(item)
                seen.add(key)
        return normalized

    @staticmethod
    def _normalize_status(value: object | None) -> str:
        normalized = str(value or "active").strip().lower()
        aliases = {
            "enabled": "active",
            "enrolled": "active",
            "disabled": "inactive",
        }
        normalized = aliases.get(normalized, normalized)
        allowed = {"pending", "active", "rejected", "inactive", "graduated"}
        if normalized not in allowed:
            raise ValueError("Status must be pending, active, rejected, inactive, or graduated.")
        return normalized

    @staticmethod
    def _normalize_mentor_status(value: object | None) -> str | None:
        if value in (None, ""):
            return None
        normalized = str(value).strip().lower()
        aliases = {
            "enabled": "active",
            "approved": "active",
            "disabled": "inactive",
            "declined": "rejected",
        }
        normalized = aliases.get(normalized, normalized)
        allowed = {"pending", "active", "rejected", "inactive"}
        if normalized not in allowed:
            raise ValueError(
                "Mentor status must be pending, active, rejected, or inactive."
            )
        return normalized

    @classmethod
    def _validate_role(cls, row: dict[str, object], expected_role: str) -> None:
        value = cls._pick(row, "role", "user_role")
        if value is not None and str(value).strip().lower() != expected_role:
            raise ValueError(f"Role must be '{expected_role}' for this sheet.")

    @staticmethod
    def _apply_changes(instance, values: dict[str, object]) -> bool:
        changed = False
        for field, value in values.items():
            if getattr(instance, field) != value:
                setattr(instance, field, value)
                changed = True
        return changed

    @staticmethod
    def _safe_error(exc: Exception) -> str:
        if isinstance(exc, ValidationError):
            errors = exc.errors(include_url=False, include_input=False)
            return "; ".join(
                f"{'.'.join(str(part) for part in error['loc'])}: {error['msg']}"
                for error in errors[:3]
            )
        if isinstance(exc, (ValueError, FileNotFoundError, SupabaseAdminError)):
            return str(exc)[:500]
        return "Unexpected synchronization error."
