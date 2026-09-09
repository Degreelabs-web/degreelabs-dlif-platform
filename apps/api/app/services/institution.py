from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.institution import Institution
from app.db.repositories.institution import InstitutionRepository
from app.schemas.institution import InstitutionCreate, InstitutionUpdate


class InstitutionService:
    def __init__(self, db: Session):
        self.repository = InstitutionRepository(db)

    def get_all(self) -> list[Institution]:
        return self.repository.get_all()

    def get_by_id(self, institution_id: UUID) -> Institution | None:
        return self.repository.get_by_id(institution_id)

    def create(self, data: InstitutionCreate) -> Institution:
        existing = self.repository.get_by_code(data.code)

        if existing:
            raise ValueError(
                f"Institution with code '{data.code}' already exists."
            )

        institution = Institution(
            name=data.name,
            code=data.code,
            status=data.status,
        )

        try:
            return self.repository.create(institution)
        except IntegrityError as exc:
            self.repository.rollback()
            raise ValueError(
                f"Institution with code '{data.code}' already exists."
            ) from exc

    def update(
        self,
        institution_id: UUID,
        data: InstitutionUpdate,
    ) -> Institution | None:
        institution = self.repository.get_by_id(institution_id)

        if not institution:
            return None

        if data.code is not None and data.code != institution.code:
            existing = self.repository.get_by_code(data.code)

            if existing:
                raise ValueError(
                    f"Institution with code '{data.code}' already exists."
                )

        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(institution, field, value)

        try:
            return self.repository.update(institution)
        except IntegrityError as exc:
            self.repository.rollback()
            raise ValueError(
                f"Institution with code '{data.code}' already exists."
            ) from exc

    def delete(self, institution_id: UUID) -> bool:
        institution = self.repository.get_by_id(institution_id)

        if not institution:
            return False

        self.repository.delete(institution)
        return True