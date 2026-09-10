from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.project import Project
from app.db.repositories.company import CompanyRepository
from app.db.repositories.project import ProjectRepository
from app.schemas.project import (
    ProjectCreate,
    ProjectDetailResponse,
    ProjectResponse,
    ProjectUpdate,
)


class ProjectService:
    def __init__(self, db: Session):
        self.db = db
        self.project_repo = ProjectRepository(db)
        self.company_repo = CompanyRepository(db)

    def _build_detail_response(self, project: Project) -> ProjectDetailResponse:
        company = self.company_repo.get_by_id(project.company_id)
        assigned_teams_count = self.project_repo.get_assigned_teams_count(project.id)

        return ProjectDetailResponse(
            id=project.id,
            company_id=project.company_id,
            title=project.title,
            description=project.description,
            objectives=project.objectives,
            expected_deliverables=project.expected_deliverables,
            start_date=project.start_date,
            end_date=project.end_date,
            status=project.status,
            difficulty=project.difficulty,
            max_teams=project.max_teams,
            created_at=project.created_at,
            updated_at=project.updated_at,
            company_name=company.name if company else None,
            company_logo_url=company.logo_url if company else None,
            company_industry=company.industry if company else None,
            assigned_teams_count=assigned_teams_count,
        )

    def get_all(
        self,
        company_id: UUID | None = None,
        status: str | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[ProjectDetailResponse]:
        projects = self.project_repo.get_all(
            company_id=company_id,
            status=status,
            search=search,
            skip=skip,
            limit=limit,
        )
        return [self._build_detail_response(p) for p in projects]

    def get_by_id(self, project_id: UUID) -> ProjectDetailResponse | None:
        project = self.project_repo.get_by_id(project_id)
        if not project:
            return None
        return self._build_detail_response(project)

    def create(self, data: ProjectCreate) -> ProjectDetailResponse:
        company = self.company_repo.get_by_id(data.company_id)
        if not company:
            raise LookupError(f"Company with id '{data.company_id}' not found.")

        project = Project(
            company_id=data.company_id,
            title=data.title,
            description=data.description,
            objectives=data.objectives,
            expected_deliverables=data.expected_deliverables,
            start_date=data.start_date,
            end_date=data.end_date,
            status=data.status,
            difficulty=data.difficulty,
            max_teams=data.max_teams,
        )

        try:
            created = self.project_repo.create(project)
            return self._build_detail_response(created)
        except IntegrityError as exc:
            self.project_repo.rollback()
            raise ValueError("Could not create project due to database constraint.") from exc

    def update(self, project_id: UUID, data: ProjectUpdate) -> ProjectDetailResponse | None:
        project = self.project_repo.get_by_id(project_id)
        if not project:
            return None

        if data.company_id is not None and data.company_id != project.company_id:
            company = self.company_repo.get_by_id(data.company_id)
            if not company:
                raise LookupError(f"Company with id '{data.company_id}' not found.")
            project.company_id = data.company_id

        if data.title is not None:
            project.title = data.title
        if data.description is not None:
            project.description = data.description
        if data.objectives is not None:
            project.objectives = data.objectives
        if data.expected_deliverables is not None:
            project.expected_deliverables = data.expected_deliverables
        if data.start_date is not None:
            project.start_date = data.start_date
        if data.end_date is not None:
            project.end_date = data.end_date
        if data.status is not None:
            project.status = data.status
        if data.difficulty is not None:
            project.difficulty = data.difficulty
        if data.max_teams is not None:
            project.max_teams = data.max_teams

        try:
            updated = self.project_repo.update(project)
            return self._build_detail_response(updated)
        except IntegrityError as exc:
            self.project_repo.rollback()
            raise ValueError("Could not update project due to database constraint.") from exc

    def delete(self, project_id: UUID) -> bool:
        project = self.project_repo.get_by_id(project_id)
        if not project:
            return False

        try:
            self.project_repo.delete(project)
            return True
        except IntegrityError as exc:
            self.project_repo.rollback()
            raise ValueError("Cannot delete project with active team assignments.") from exc

    def get_assigned_teams(self, project_id: UUID):
        project = self.project_repo.get_by_id(project_id)
        if not project:
            raise LookupError(f"Project with id '{project_id}' not found.")
        return self.project_repo.get_assigned_teams(project_id)
