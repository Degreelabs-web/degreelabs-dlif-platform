from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.enrollment import Enrollment


class EnrollmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(
        self,
        cohort_id: UUID | None = None,
        user_id: UUID | None = None,
        status: str | None = None,
    ) -> list[Enrollment]:
        statement = select(Enrollment).order_by(Enrollment.enrolled_at.desc())

        if cohort_id is not None:
            statement = statement.where(Enrollment.cohort_id == cohort_id)
        if user_id is not None:
            statement = statement.where(Enrollment.user_id == user_id)
        if status is not None:
            statement = statement.where(Enrollment.enrollment_status == status)

        return list(self.db.scalars(statement).all())

    def get_by_id(self, enrollment_id: UUID) -> Enrollment | None:
        statement = select(Enrollment).where(Enrollment.id == enrollment_id)
        return self.db.scalar(statement)

    def get_by_user_and_cohort(
        self,
        user_id: UUID,
        cohort_id: UUID,
    ) -> Enrollment | None:
        statement = select(Enrollment).where(
            Enrollment.user_id == user_id,
            Enrollment.cohort_id == cohort_id,
        )
        return self.db.scalar(statement)

    def create(self, enrollment: Enrollment) -> Enrollment:
        self.db.add(enrollment)
        self.db.commit()
        self.db.refresh(enrollment)
        return enrollment

    def update(self, enrollment: Enrollment) -> Enrollment:
        self.db.commit()
        self.db.refresh(enrollment)
        return enrollment

    def delete(self, enrollment: Enrollment) -> None:
        self.db.delete(enrollment)
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
