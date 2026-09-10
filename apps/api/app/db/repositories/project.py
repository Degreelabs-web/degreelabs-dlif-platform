from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models.project import Project
from app.db.models.team import Team
from app.db.models.team_project_assignment import TeamProjectAssignment


class ProjectRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(
        self,
        company_id: UUID | None = None,
        status: str | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Project]:
        statement = select(Project).order_by(Project.created_at.desc())

        if company_id is not None:
            statement = statement.where(Project.company_id == company_id)
        if status is not None:
            statement = statement.where(Project.status == status)
        if search:
            search_pattern = f"%{search}%"
            statement = statement.where(
                Project.title.ilike(search_pattern)
                | Project.description.ilike(search_pattern)
                | Project.objectives.ilike(search_pattern)
            )

        statement = statement.offset(skip).limit(limit)
        return list(self.db.scalars(statement).all())

    def get_by_id(self, project_id: UUID) -> Project | None:
        statement = select(Project).where(Project.id == project_id)
        return self.db.scalar(statement)

    def get_assigned_teams_count(self, project_id: UUID) -> int:
        statement = select(func.count(TeamProjectAssignment.id)).where(
            TeamProjectAssignment.project_id == project_id,
            TeamProjectAssignment.status == "active",
        )
        return self.db.scalar(statement) or 0

    def get_assigned_teams(self, project_id: UUID) -> list[Team]:
        statement = (
            select(Team)
            .join(TeamProjectAssignment, Team.id == TeamProjectAssignment.team_id)
            .where(
                TeamProjectAssignment.project_id == project_id,
                TeamProjectAssignment.status == "active",
            )
            .order_by(Team.name)
        )
        return list(self.db.scalars(statement).all())

    def create(self, project: Project) -> Project:
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project

    def update(self, project: Project) -> Project:
        self.db.commit()
        self.db.refresh(project)
        return project

    def delete(self, project: Project) -> None:
        self.db.delete(project)
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
