from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.cohort import Cohort
from app.db.repositories.cohort import CohortRepository
from app.db.repositories.institution import InstitutionRepository
from app.schemas.cohort import CohortCreate, CohortUpdate


class CohortService:
    def __init__(self, db: Session):
        self.cohort_repo = CohortRepository(db)
        self.institution_repo = InstitutionRepository(db)

    def get_all(
        self,
        institution_id: UUID | None = None,
        status: str | None = None,
    ) -> list[Cohort]:
        return self.cohort_repo.get_all(
            institution_id=institution_id,
            status=status,
        )

    def get_by_id(self, cohort_id: UUID) -> Cohort | None:
        return self.cohort_repo.get_by_id(cohort_id)

    def create(self, data: CohortCreate) -> Cohort:
        institution = self.institution_repo.get_by_id(data.institution_id)
        if not institution:
            raise LookupError(
                f"Institution with id '{data.institution_id}' not found."
            )

        if data.end_date < data.start_date:
            raise ValueError("end_date must be on or after start_date.")

        existing = self.cohort_repo.get_by_name_and_institution(
            name=data.name,
            institution_id=data.institution_id,
            academic_year=data.academic_year,
        )
        if existing:
            raise ValueError(
                f"Cohort '{data.name}' already exists for this institution and academic year."
            )

        cohort = Cohort(
            institution_id=data.institution_id,
            name=data.name,
            academic_year=data.academic_year,
            start_date=data.start_date,
            end_date=data.end_date,
            status=data.status,
        )

        try:
            return self.cohort_repo.create(cohort)
        except IntegrityError as exc:
            self.cohort_repo.rollback()
            raise ValueError(
                f"Cohort could not be created due to database constraint."
            ) from exc

    def update(
        self,
        cohort_id: UUID,
        data: CohortUpdate,
    ) -> Cohort | None:
        cohort = self.cohort_repo.get_by_id(cohort_id)
        if not cohort:
            return None

        new_start = data.start_date if data.start_date is not None else cohort.start_date
        new_end = data.end_date if data.end_date is not None else cohort.end_date

        if new_end < new_start:
            raise ValueError("end_date must be on or after start_date.")

        check_name = data.name if data.name is not None else cohort.name
        check_ay = data.academic_year if data.academic_year is not None else cohort.academic_year

        if check_name != cohort.name or check_ay != cohort.academic_year:
            existing = self.cohort_repo.get_by_name_and_institution(
                name=check_name,
                institution_id=cohort.institution_id,
                academic_year=check_ay,
            )
            if existing and existing.id != cohort.id:
                raise ValueError(
                    f"Cohort '{check_name}' already exists for this institution and academic year."
                )

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(cohort, field, value)

        try:
            return self.cohort_repo.update(cohort)
        except IntegrityError as exc:
            self.cohort_repo.rollback()
            raise ValueError(
                "Cohort could not be updated due to database constraint."
            ) from exc

    def delete(self, cohort_id: UUID) -> bool:
        cohort = self.cohort_repo.get_by_id(cohort_id)
        if not cohort:
            return False

        try:
            self.cohort_repo.delete(cohort)
            return True
        except IntegrityError as exc:
            self.cohort_repo.rollback()
            raise ValueError(
                "Cannot delete cohort with active dependent records."
            ) from exc
