from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.institution import Institution


class InstitutionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> list[Institution]:
        statement = select(Institution).order_by(Institution.name)
        return list(self.db.scalars(statement).all())

    def get_by_id(self, institution_id: UUID) -> Institution | None:
        statement = select(Institution).where(Institution.id == institution_id)
        return self.db.scalar(statement)

    def get_by_code(self, code: str) -> Institution | None:
        statement = select(Institution).where(Institution.code == code)
        return self.db.scalar(statement)

    def create(self, institution: Institution) -> Institution:
        self.db.add(institution)
        self.db.commit()
        self.db.refresh(institution)
        return institution

    def update(self, institution: Institution) -> Institution:
        self.db.commit()
        self.db.refresh(institution)
        return institution

    def delete(self, institution: Institution) -> None:
        self.db.delete(institution)
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()