import re
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.company import Company
from app.db.repositories.company import CompanyRepository
from app.schemas.company import (
    CompanyCreate,
    CompanyDetailResponse,
    CompanyResponse,
    CompanyUpdate,
)


def _generate_slug(name: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", name.lower())
    slug = re.sub(r"[\s_-]+", "-", slug).strip("-")
    return slug or "company"


class CompanyService:
    def __init__(self, db: Session):
        self.db = db
        self.company_repo = CompanyRepository(db)

    def _build_detail_response(self, company: Company) -> CompanyDetailResponse:
        projects_count = self.company_repo.get_projects_count(company.id)
        return CompanyDetailResponse(
            id=company.id,
            name=company.name,
            slug=company.slug,
            profile=company.profile,
            industry=company.industry,
            website=company.website,
            contact_email=company.contact_email,
            contact_name=company.contact_name,
            contact_phone=company.contact_phone,
            logo_url=company.logo_url,
            status=company.status,
            created_at=company.created_at,
            updated_at=company.updated_at,
            projects_count=projects_count,
        )

    def get_all(
        self,
        industry: str | None = None,
        status: str | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[CompanyDetailResponse]:
        companies = self.company_repo.get_all(
            industry=industry,
            status=status,
            search=search,
            skip=skip,
            limit=limit,
        )
        return [self._build_detail_response(c) for c in companies]

    def get_by_id(self, company_id: UUID) -> CompanyDetailResponse | None:
        company = self.company_repo.get_by_id(company_id)
        if not company:
            return None
        return self._build_detail_response(company)

    def create(self, data: CompanyCreate) -> CompanyDetailResponse:
        slug = data.slug or _generate_slug(data.name)

        existing = self.company_repo.get_by_slug(slug)
        if existing:
            slug = f"{slug}-{UUID(int=1).hex[:6]}"

        company = Company(
            name=data.name,
            slug=slug,
            profile=data.profile,
            industry=data.industry,
            website=data.website,
            contact_email=data.contact_email,
            contact_name=data.contact_name,
            contact_phone=data.contact_phone,
            logo_url=data.logo_url,
            status=data.status,
        )

        try:
            created = self.company_repo.create(company)
            return self._build_detail_response(created)
        except IntegrityError as exc:
            self.company_repo.rollback()
            raise ValueError("Could not create company due to database constraint.") from exc

    def update(self, company_id: UUID, data: CompanyUpdate) -> CompanyDetailResponse | None:
        company = self.company_repo.get_by_id(company_id)
        if not company:
            return None

        if data.name is not None:
            company.name = data.name
        if data.slug is not None:
            existing = self.company_repo.get_by_slug(data.slug)
            if existing and existing.id != company_id:
                raise ValueError(f"Slug '{data.slug}' is already taken.")
            company.slug = data.slug
        if data.profile is not None:
            company.profile = data.profile
        if data.industry is not None:
            company.industry = data.industry
        if data.website is not None:
            company.website = data.website
        if data.contact_email is not None:
            company.contact_email = data.contact_email
        if data.contact_name is not None:
            company.contact_name = data.contact_name
        if data.contact_phone is not None:
            company.contact_phone = data.contact_phone
        if data.logo_url is not None:
            company.logo_url = data.logo_url
        if data.status is not None:
            company.status = data.status

        try:
            updated = self.company_repo.update(company)
            return self._build_detail_response(updated)
        except IntegrityError as exc:
            self.company_repo.rollback()
            raise ValueError("Could not update company due to database constraint.") from exc

    def delete(self, company_id: UUID) -> bool:
        company = self.company_repo.get_by_id(company_id)
        if not company:
            return False

        try:
            self.company_repo.delete(company)
            return True
        except IntegrityError as exc:
            self.company_repo.rollback()
            raise ValueError("Cannot delete company with active projects.") from exc
