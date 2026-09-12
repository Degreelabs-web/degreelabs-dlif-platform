from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.mentor import Mentor
from app.db.models.user import User
from app.db.repositories.mentor import MentorRepository
from app.schemas.mentor import (
    MentorCreate,
    MentorDetailResponse,
    MentorResponse,
    MentorUpdate,
)
from app.services.supabase_admin import SupabaseAdminService


class MentorService:
    def __init__(
        self,
        db: Session,
        *,
        supabase: SupabaseAdminService | None = None,
    ):
        self.db = db
        self.mentor_repo = MentorRepository(db)
        self.supabase = supabase

    def _build_detail_response(
        self,
        mentor: Mentor,
        user: User | None = None,
        assigned_teams_count: int | None = None,
    ) -> MentorDetailResponse:
        if user is None:
            user = self.db.scalar(select(User).where(User.id == mentor.user_id))
        if assigned_teams_count is None:
            assigned_teams_count = self.mentor_repo.get_assigned_teams_count(mentor.id)
        location = mentor.location or ", ".join(
            part for part in (mentor.city, mentor.country) if part
        ) or None

        return MentorDetailResponse(
            id=mentor.id,
            user_id=mentor.user_id,
            phone=mentor.phone,
            bio=mentor.bio,
            expertise=mentor.expertise or [],
            years_of_experience=mentor.years_of_experience,
            company_name=mentor.company_name,
            designation=mentor.designation,
            organisation=mentor.company_name,
            current_role=mentor.designation,
            location=location,
            city=mentor.city,
            country=mentor.country,
            professional_headline=mentor.professional_headline,
            linkedin_url=mentor.linkedin_url,
            github_url=mentor.github_url,
            headshot_url=mentor.headshot_url,
            professional_headshot_url=mentor.headshot_url,
            industries=mentor.industries or [],
            support_preferences=mentor.support_preferences or [],
            mentor_statement=mentor.mentor_statement,
            mentoring_statement=mentor.mentor_statement,
            status=mentor.status,
            mentor_category=mentor.mentor_category,
            password_setup_status=mentor.password_setup_status,
            password_setup_sent_at=mentor.password_setup_sent_at,
            password_setup_completed_at=mentor.password_setup_completed_at,
            enrollment_source_key=mentor.enrollment_source_key,
            created_at=mentor.created_at,
            updated_at=mentor.updated_at,
            full_name=user.full_name if user else None,
            email=user.email if user else None,
            assigned_teams_count=assigned_teams_count,
        )

    def get_all(
        self,
        status: str | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 50,
        organisation: str | None = None,
        industry: str | None = None,
        expertise: str | None = None,
        country: str | None = None,
        mentor_category: str | None = None,
    ) -> list[MentorDetailResponse]:
        rows = self.mentor_repo.get_all(
            status=status,
            search=search,
            skip=skip,
            limit=limit,
            organisation=organisation,
            industry=industry,
            expertise=expertise,
            country=country,
            mentor_category=mentor_category,
        )
        return [
            self._build_detail_response(mentor, user, assigned_teams_count)
            for mentor, user, assigned_teams_count in rows
        ]

    def get_by_id(self, mentor_id: UUID) -> MentorDetailResponse | None:
        mentor = self.mentor_repo.get_by_id(mentor_id)
        if not mentor:
            return None
        return self._build_detail_response(mentor)

    def get_by_user_id(self, user_id: UUID) -> MentorDetailResponse | None:
        mentor = self.mentor_repo.get_by_user_id(user_id)
        if not mentor:
            return None
        return self._build_detail_response(mentor)

    def create(self, data: MentorCreate) -> MentorDetailResponse:
        user_id = data.user_id

        if not user_id:
            if not data.email or not data.full_name:
                raise ValueError("Either user_id or (email and full_name) must be provided.")
            if not data.password:
                raise ValueError("Password is required to provision mentor credentials.")

            existing_user = self.db.scalar(
                select(User).where(func.lower(User.email) == str(data.email).lower())
            )
            if existing_user and existing_user.role != "mentor":
                raise ValueError("The email already belongs to a non-mentor account.")

            # 1. Provision / sync Supabase Auth identity so mentor can log in
            if self.supabase is None:
                self.supabase = SupabaseAdminService()
            supabase_user = self.supabase.create_user(
                email=data.email,
                password=data.password,
                full_name=data.full_name,
                email_confirm=True,
            )
            auth_user_id = supabase_user.get("id")
            if not auth_user_id:
                raise ValueError("Supabase did not return a user ID for mentor.")
            user_id = UUID(auth_user_id)

            # 2. Check if application user already exists
            if existing_user:
                existing_user.role = "mentor"
                existing_user.status = data.status
                existing_user.full_name = data.full_name
                self.db.commit()
                user_id = existing_user.id
            else:
                new_user = User(
                    id=user_id,
                    email=data.email,
                    full_name=data.full_name,
                    role="mentor",
                    status=data.status,
                )
                self.db.add(new_user)
                self.db.commit()
                self.db.refresh(new_user)
                user_id = new_user.id

        user = self.db.scalar(select(User).where(User.id == user_id))
        if not user:
            raise LookupError(f"User with id '{user_id}' not found.")

        existing_mentor = self.mentor_repo.get_by_user_id(user_id)
        if existing_mentor:
            # Update existing mentor profile
            if data.phone is not None:
                existing_mentor.phone = data.phone
            if data.bio is not None:
                existing_mentor.bio = data.bio
            if data.expertise is not None:
                existing_mentor.expertise = data.expertise
            if data.years_of_experience is not None:
                existing_mentor.years_of_experience = data.years_of_experience
            if data.company_name is not None:
                existing_mentor.company_name = data.company_name
            if data.designation is not None:
                existing_mentor.designation = data.designation
            if data.organisation is not None:
                existing_mentor.company_name = data.organisation
            if data.current_role is not None:
                existing_mentor.designation = data.current_role
            if data.location is not None:
                existing_mentor.location = data.location
            if data.city is not None:
                existing_mentor.city = data.city
            if data.country is not None:
                existing_mentor.country = data.country
            if data.professional_headline is not None:
                existing_mentor.professional_headline = data.professional_headline
            if data.linkedin_url is not None:
                existing_mentor.linkedin_url = data.linkedin_url
            if data.github_url is not None:
                existing_mentor.github_url = data.github_url
            if data.headshot_url is not None:
                existing_mentor.headshot_url = data.headshot_url
            if data.professional_headshot_url is not None:
                existing_mentor.headshot_url = data.professional_headshot_url
            if data.industries is not None:
                existing_mentor.industries = data.industries
            if data.support_preferences is not None:
                existing_mentor.support_preferences = data.support_preferences
            if data.mentor_statement is not None:
                existing_mentor.mentor_statement = data.mentor_statement
            if data.mentoring_statement is not None:
                existing_mentor.mentor_statement = data.mentoring_statement
            if data.status is not None:
                existing_mentor.status = data.status
                user.status = data.status
            self.mentor_repo.update(existing_mentor)
            return self._build_detail_response(existing_mentor)

        mentor = Mentor(
            user_id=user_id,
            phone=data.phone,
            bio=data.bio,
            expertise=data.expertise or [],
            years_of_experience=data.years_of_experience,
            company_name=data.organisation or data.company_name,
            designation=data.current_role or data.designation,
            location=data.location,
            city=data.city,
            country=data.country,
            professional_headline=data.professional_headline,
            linkedin_url=data.linkedin_url,
            github_url=data.github_url,
            headshot_url=data.professional_headshot_url or data.headshot_url,
            industries=data.industries or [],
            support_preferences=data.support_preferences or [],
            mentor_statement=data.mentoring_statement or data.mentor_statement,
            status=data.status,
            mentor_category=data.mentor_category,
            enrollment_source_key="manual",
        )

        try:
            created_mentor = self.mentor_repo.create(mentor)
            return self._build_detail_response(created_mentor)
        except IntegrityError as exc:
            self.mentor_repo.rollback()
            raise ValueError("Could not create mentor due to database constraint.") from exc

    def update(self, mentor_id: UUID, data: MentorUpdate) -> MentorDetailResponse | None:
        mentor = self.mentor_repo.get_by_id(mentor_id)
        if not mentor:
            return None

        if data.phone is not None:
            mentor.phone = data.phone
        if data.bio is not None:
            mentor.bio = data.bio
        if data.expertise is not None:
            mentor.expertise = data.expertise
        if data.years_of_experience is not None:
            mentor.years_of_experience = data.years_of_experience
        if data.company_name is not None:
            mentor.company_name = data.company_name
        if data.designation is not None:
            mentor.designation = data.designation
        if data.organisation is not None:
            mentor.company_name = data.organisation
        if data.current_role is not None:
            mentor.designation = data.current_role
        if data.location is not None:
            mentor.location = data.location
        if data.city is not None:
            mentor.city = data.city
        if data.country is not None:
            mentor.country = data.country
        if data.professional_headline is not None:
            mentor.professional_headline = data.professional_headline
        if data.linkedin_url is not None:
            mentor.linkedin_url = data.linkedin_url
        if data.github_url is not None:
            mentor.github_url = data.github_url
        if data.headshot_url is not None:
            mentor.headshot_url = data.headshot_url
        if data.professional_headshot_url is not None:
            mentor.headshot_url = data.professional_headshot_url
        if data.industries is not None:
            mentor.industries = data.industries
        if data.support_preferences is not None:
            mentor.support_preferences = data.support_preferences
        if data.mentor_statement is not None:
            mentor.mentor_statement = data.mentor_statement
        if data.mentoring_statement is not None:
            mentor.mentor_statement = data.mentoring_statement
        if data.status is not None:
            mentor.status = data.status
            user = self.db.scalar(select(User).where(User.id == mentor.user_id))
            if user is not None:
                user.status = data.status
        if data.mentor_category is not None:
            mentor.mentor_category = data.mentor_category

        try:
            updated = self.mentor_repo.update(mentor)
            return self._build_detail_response(updated)
        except IntegrityError as exc:
            self.mentor_repo.rollback()
            raise ValueError("Could not update mentor due to database constraint.") from exc

    def delete(self, mentor_id: UUID) -> bool:
        mentor = self.mentor_repo.get_by_id(mentor_id)
        if not mentor:
            return False

        try:
            self.mentor_repo.delete(mentor)
            return True
        except IntegrityError as exc:
            self.mentor_repo.rollback()
            raise ValueError("Cannot delete mentor with active dependencies.") from exc
