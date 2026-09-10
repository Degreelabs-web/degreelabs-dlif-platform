from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models.company import Company
from app.db.models.project import Project


class CompanyRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(
        self,
        industry: str | None = None,
        status: str | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Company]:
        statement = select(Company).order_by(Company.name)

        if industry is not None:
            statement = statement.where(Company.industry == industry)
        if status is not None:
            statement = statement.where(Company.status == status)
        if search:
            search_pattern = f"%{search}%"
            statement = statement.where(
                Company.name.ilike(search_pattern)
                | Company.industry.ilike(search_pattern)
                | Company.profile.ilike(search_pattern)
            )

        statement = statement.offset(skip).limit(limit)
        return list(self.db.scalars(statement).all())

    def get_by_id(self, company_id: UUID) -> Company | None:
        statement = select(Company).where(Company.id == company_id)
        return self.db.scalar(statement)

    def get_by_slug(self, slug: str) -> Company | None:
        statement = select(Company).where(Company.slug == slug)
        return self.db.scalar(statement)

    def get_projects_count(self, company_id: UUID) -> int:
        statement = select(func.count(Project.id)).where(Project.company_id == company_id)
        return self.db.scalar(statement) or 0

    def create(self, company: Company) -> Company:
        self.db.add(company)
        self.db.commit()
        self.db.refresh(company)
        return company

    def update(self, company: Company) -> Company:
        self.db.commit()
        self.db.refresh(company)
        return company

    def delete(self, company: Company) -> None:
        self.db.delete(company)
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
