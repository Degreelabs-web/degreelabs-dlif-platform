from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.student_profile import StudentProfile
from app.db.models.user import User
from app.db.repositories.institution import InstitutionRepository
from app.db.repositories.student import StudentRepository
from app.schemas.student import (
    StudentCreate,
    StudentProfileResponse,
    StudentResponse,
    StudentUpdate,
)


class StudentService:
    def __init__(self, db: Session):
        self.student_repo = StudentRepository(db)
        self.institution_repo = InstitutionRepository(db)

    def _to_response(
        self,
        user: User,
        profile: StudentProfile | None,
    ) -> StudentResponse:
        profile_res = (
            StudentProfileResponse.model_validate(profile) if profile else None
        )
        return StudentResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            status=user.status,
            created_at=user.created_at,
            updated_at=user.updated_at,
            profile=profile_res,
        )

    def get_all(
        self,
        institution_id: UUID | None = None,
        status: str | None = None,
    ) -> list[StudentResponse]:
        records = self.student_repo.get_all(
            institution_id=institution_id,
            status=status,
        )
        return [self._to_response(user, profile) for user, profile in records]

    def get_by_id(self, user_id: UUID) -> StudentResponse | None:
        record = self.student_repo.get_by_id(user_id)
        if not record:
            return None
        user, profile = record
        return self._to_response(user, profile)

    def create(self, data: StudentCreate) -> StudentResponse:
        institution = self.institution_repo.get_by_id(data.institution_id)
        if not institution:
            raise LookupError(
                f"Institution with id '{data.institution_id}' not found."
            )

        existing_user = self.student_repo.get_user_by_email(data.email)
        if existing_user:
            raise ValueError(
                f"User with email '{data.email}' already exists."
            )

        user = User(
            email=data.email,
            full_name=data.full_name,
            role="student",
            status="active",
        )

        profile = StudentProfile(
            institution_id=data.institution_id,
            student_id=data.student_id,
            phone=data.phone,
            course=data.course,
            branch=data.branch,
            graduation_year=data.graduation_year,
        )

        try:
            user, profile = self.student_repo.create_student(user, profile)
            return self._to_response(user, profile)
        except IntegrityError as exc:
            self.student_repo.rollback()
            raise ValueError(
                "Could not create student due to database constraint."
            ) from exc

    def update(
        self,
        user_id: UUID,
        data: StudentUpdate,
    ) -> StudentResponse | None:
        record = self.student_repo.get_by_id(user_id)
        if not record:
            return None

        user, profile = record

        if data.full_name is not None:
            user.full_name = data.full_name
        if data.status is not None:
            user.status = data.status

        if data.student_id is not None:
            profile.student_id = data.student_id
        if data.phone is not None:
            profile.phone = data.phone
        if data.course is not None:
            profile.course = data.course
        if data.branch is not None:
            profile.branch = data.branch
        if data.graduation_year is not None:
            profile.graduation_year = data.graduation_year

        try:
            user, profile = self.student_repo.update_student(user, profile)
            return self._to_response(user, profile)
        except IntegrityError as exc:
            self.student_repo.rollback()
            raise ValueError(
                "Could not update student due to database constraint."
            ) from exc

    def delete(self, user_id: UUID) -> bool:
        user = self.student_repo.get_user_by_id(user_id)
        if not user or user.role != "student":
            return False

        try:
            self.student_repo.delete_student(user)
            return True
        except IntegrityError as exc:
            self.student_repo.rollback()
            raise ValueError(
                "Cannot delete student with active dependent records."
            ) from exc
