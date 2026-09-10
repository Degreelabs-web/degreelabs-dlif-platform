from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.cohort import Cohort
from app.db.models.institution import Institution
from app.db.models.student_cohort_assignment import StudentCohortAssignment
from app.db.models.student_profile import StudentProfile
from app.db.models.user import User
from app.db.repositories.cohort import CohortRepository
from app.db.repositories.student_cohort_assignment import StudentCohortAssignmentRepository
from app.schemas.student_cohort_assignment import (
    StudentCohortAssignmentCreate,
    StudentCohortAssignmentDetailResponse,
    StudentCohortAssignmentResponse,
    StudentCohortAssignmentUpdate,
)


class StudentCohortAssignmentService:
    def __init__(self, db: Session):
        self.db = db
        self.assignment_repo = StudentCohortAssignmentRepository(db)
        self.cohort_repo = CohortRepository(db)

    def _build_detail_response(
        self, assignment: StudentCohortAssignment
    ) -> StudentCohortAssignmentDetailResponse:
        student = self.db.scalar(
            select(StudentProfile).where(StudentProfile.id == assignment.student_id)
        )
        user = self.db.scalar(select(User).where(User.id == student.user_id)) if student else None
        cohort = self.cohort_repo.get_by_id(assignment.cohort_id)
        institution = (
            self.db.scalar(select(Institution).where(Institution.id == cohort.institution_id))
            if cohort
            else None
        )

        return StudentCohortAssignmentDetailResponse(
            id=assignment.id,
            student_id=assignment.student_id,
            cohort_id=assignment.cohort_id,
            status=assignment.status,
            assigned_at=assignment.assigned_at,
            completed_at=assignment.completed_at,
            student_name=user.full_name if user else None,
            student_email=user.email if user else None,
            cohort_name=cohort.name if cohort else None,
            institution_name=institution.name if institution else None,
        )

    def get_by_id(self, assignment_id: UUID) -> StudentCohortAssignmentDetailResponse | None:
        assignment = self.assignment_repo.get_by_id(assignment_id)
        if not assignment:
            return None
        return self._build_detail_response(assignment)

    def get_cohorts_for_student(self, student_id: UUID):
        return self.assignment_repo.get_cohorts_for_student(student_id)

    def get_students_in_cohort(self, cohort_id: UUID):
        return self.assignment_repo.get_students_in_cohort(cohort_id)

    def assign_student(
        self, data: StudentCohortAssignmentCreate
    ) -> StudentCohortAssignmentDetailResponse:
        student = self.db.scalar(
            select(StudentProfile).where(StudentProfile.id == data.student_id)
        )
        if not student:
            raise LookupError(f"Student profile with id '{data.student_id}' not found.")

        cohort = self.cohort_repo.get_by_id(data.cohort_id)
        if not cohort:
            raise LookupError(f"Cohort with id '{data.cohort_id}' not found.")

        existing = self.assignment_repo.get_assignment(data.student_id, data.cohort_id)
        if existing:
            if existing.status == "active":
                raise ValueError("Student is already actively assigned to this cohort.")
            existing.status = "active"
            updated = self.assignment_repo.update(existing)
            return self._build_detail_response(updated)

        assignment = StudentCohortAssignment(
            student_id=data.student_id,
            cohort_id=data.cohort_id,
            status="active",
        )

        try:
            created = self.assignment_repo.create(assignment)
            return self._build_detail_response(created)
        except IntegrityError as exc:
            self.assignment_repo.rollback()
            raise ValueError(
                "Could not assign student to cohort due to database constraint."
            ) from exc

    def update_assignment(
        self, assignment_id: UUID, data: StudentCohortAssignmentUpdate
    ) -> StudentCohortAssignmentDetailResponse | None:
        assignment = self.assignment_repo.get_by_id(assignment_id)
        if not assignment:
            return None

        if data.status is not None:
            assignment.status = data.status
        if data.completed_at is not None:
            assignment.completed_at = data.completed_at

        try:
            updated = self.assignment_repo.update(assignment)
            return self._build_detail_response(updated)
        except IntegrityError as exc:
            self.assignment_repo.rollback()
            raise ValueError("Could not update assignment due to database constraint.") from exc

    def remove_assignment(self, assignment_id: UUID) -> bool:
        assignment = self.assignment_repo.get_by_id(assignment_id)
        if not assignment:
            return False

        try:
            self.assignment_repo.delete(assignment)
            return True
        except IntegrityError as exc:
            self.assignment_repo.rollback()
            raise ValueError("Cannot remove student from cohort with dependencies.") from exc
