from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.enrollment import Enrollment
from app.db.repositories.cohort import CohortRepository
from app.db.repositories.enrollment import EnrollmentRepository
from app.db.repositories.student import StudentRepository
from app.schemas.enrollment import EnrollmentCreate, EnrollmentUpdate


class EnrollmentService:
    def __init__(self, db: Session):
        self.enrollment_repo = EnrollmentRepository(db)
        self.student_repo = StudentRepository(db)
        self.cohort_repo = CohortRepository(db)

    def get_all(
        self,
        cohort_id: UUID | None = None,
        user_id: UUID | None = None,
        status: str | None = None,
    ) -> list[Enrollment]:
        return self.enrollment_repo.get_all(
            cohort_id=cohort_id,
            user_id=user_id,
            status=status,
        )

    def get_by_id(self, enrollment_id: UUID) -> Enrollment | None:
        return self.enrollment_repo.get_by_id(enrollment_id)

    def create(self, data: EnrollmentCreate) -> Enrollment:
        user = self.student_repo.get_user_by_id(data.user_id)
        if not user:
            raise LookupError(f"User with id '{data.user_id}' not found.")
        if user.role != "student":
            raise ValueError(
                f"User with id '{data.user_id}' does not have the 'student' role."
            )

        cohort = self.cohort_repo.get_by_id(data.cohort_id)
        if not cohort:
            raise LookupError(f"Cohort with id '{data.cohort_id}' not found.")

        existing = self.enrollment_repo.get_by_user_and_cohort(
            user_id=data.user_id,
            cohort_id=data.cohort_id,
        )
        if existing:
            raise ValueError("Student is already enrolled in this cohort.")

        enrollment = Enrollment(
            user_id=data.user_id,
            cohort_id=data.cohort_id,
            enrollment_status=data.enrollment_status,
        )

        try:
            return self.enrollment_repo.create(enrollment)
        except IntegrityError as exc:
            self.enrollment_repo.rollback()
            raise ValueError(
                "Could not create enrollment due to database constraint."
            ) from exc

    def update(
        self,
        enrollment_id: UUID,
        data: EnrollmentUpdate,
    ) -> Enrollment | None:
        enrollment = self.enrollment_repo.get_by_id(enrollment_id)
        if not enrollment:
            return None

        if data.enrollment_status is not None:
            enrollment.enrollment_status = data.enrollment_status
            if (
                data.enrollment_status == "completed"
                and enrollment.completed_at is None
            ):
                enrollment.completed_at = datetime.now(timezone.utc)

        if data.completed_at is not None:
            enrollment.completed_at = data.completed_at

        try:
            return self.enrollment_repo.update(enrollment)
        except IntegrityError as exc:
            self.enrollment_repo.rollback()
            raise ValueError(
                "Could not update enrollment due to database constraint."
            ) from exc

    def delete(self, enrollment_id: UUID) -> bool:
        enrollment = self.enrollment_repo.get_by_id(enrollment_id)
        if not enrollment:
            return False

        try:
            self.enrollment_repo.delete(enrollment)
            return True
        except IntegrityError as exc:
            self.enrollment_repo.rollback()
            raise ValueError(
                "Cannot delete enrollment with active dependent records."
            ) from exc
