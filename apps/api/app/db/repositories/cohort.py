from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.cohort import Cohort


class CohortRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(
        self,
        institution_id: UUID | None = None,
        status: str | None = None,
    ) -> list[Cohort]:
        statement = select(Cohort).order_by(Cohort.created_at.desc())
        if institution_id is not None:
            statement = statement.where(Cohort.institution_id == institution_id)
        if status is not None:
            statement = statement.where(Cohort.status == status)
        return list(self.db.scalars(statement).all())

    def get_by_id(self, cohort_id: UUID) -> Cohort | None:
        statement = select(Cohort).where(Cohort.id == cohort_id)
        return self.db.scalar(statement)

    def get_by_name_and_institution(
        self,
        name: str,
        institution_id: UUID,
        academic_year: str,
    ) -> Cohort | None:
        statement = select(Cohort).where(
            Cohort.name == name,
            Cohort.institution_id == institution_id,
            Cohort.academic_year == academic_year,
        )
        return self.db.scalar(statement)

    def create(self, cohort: Cohort) -> Cohort:
        self.db.add(cohort)
        self.db.commit()
        self.db.refresh(cohort)
        return cohort

    def update(self, cohort: Cohort) -> Cohort:
        self.db.commit()
        self.db.refresh(cohort)
        return cohort

    def delete(self, cohort: Cohort) -> None:
        self.db.delete(cohort)
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
