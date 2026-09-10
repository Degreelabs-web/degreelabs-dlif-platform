from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.cohort import Cohort
from app.db.models.student_cohort_assignment import StudentCohortAssignment
from app.db.models.student_profile import StudentProfile


class StudentCohortAssignmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, assignment_id: UUID) -> StudentCohortAssignment | None:
        statement = select(StudentCohortAssignment).where(StudentCohortAssignment.id == assignment_id)
        return self.db.scalar(statement)

    def get_assignment(self, student_id: UUID, cohort_id: UUID) -> StudentCohortAssignment | None:
        statement = select(StudentCohortAssignment).where(
            StudentCohortAssignment.student_id == student_id,
            StudentCohortAssignment.cohort_id == cohort_id,
        )
        return self.db.scalar(statement)

    def get_cohorts_for_student(
        self,
        student_id: UUID,
        status: str | None = None,
    ) -> list[Cohort]:
        statement = (
            select(Cohort)
            .join(StudentCohortAssignment, Cohort.id == StudentCohortAssignment.cohort_id)
            .where(StudentCohortAssignment.student_id == student_id)
        )
        if status is not None:
            statement = statement.where(StudentCohortAssignment.status == status)

        statement = statement.order_by(Cohort.name)
        return list(self.db.scalars(statement).all())

    def get_students_in_cohort(
        self,
        cohort_id: UUID,
        status: str | None = None,
    ) -> list[StudentProfile]:
        statement = (
            select(StudentProfile)
            .join(StudentCohortAssignment, StudentProfile.id == StudentCohortAssignment.student_id)
            .where(StudentCohortAssignment.cohort_id == cohort_id)
        )
        if status is not None:
            statement = statement.where(StudentCohortAssignment.status == status)

        return list(self.db.scalars(statement).all())

    def create(self, assignment: StudentCohortAssignment) -> StudentCohortAssignment:
        self.db.add(assignment)
        self.db.commit()
        self.db.refresh(assignment)
        return assignment

    def update(self, assignment: StudentCohortAssignment) -> StudentCohortAssignment:
        self.db.commit()
        self.db.refresh(assignment)
        return assignment

    def delete(self, assignment: StudentCohortAssignment) -> None:
        self.db.delete(assignment)
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
