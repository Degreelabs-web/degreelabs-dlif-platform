from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.team import Team
from app.db.models.team_mentor_assignment import TeamMentorAssignment
from app.db.models.team_project_assignment import TeamProjectAssignment


class TeamAssignmentRepository:
    def __init__(self, db: Session):
        self.db = db

    # ==================== Team Mentor Assignments ====================

    def get_mentor_assignment_by_id(self, assignment_id: UUID) -> TeamMentorAssignment | None:
        statement = select(TeamMentorAssignment).where(TeamMentorAssignment.id == assignment_id)
        return self.db.scalar(statement)

    def get_active_mentor_assignment(self, team_id: UUID) -> TeamMentorAssignment | None:
        statement = select(TeamMentorAssignment).where(
            TeamMentorAssignment.team_id == team_id,
            TeamMentorAssignment.status == "active",
        )
        return self.db.scalar(statement)

    def get_mentor_assignments(
        self,
        team_id: UUID | None = None,
        mentor_id: UUID | None = None,
        status: str | None = None,
    ) -> list[TeamMentorAssignment]:
        statement = select(TeamMentorAssignment).order_by(TeamMentorAssignment.assigned_at.desc())

        if team_id is not None:
            statement = statement.where(TeamMentorAssignment.team_id == team_id)
        if mentor_id is not None:
            statement = statement.where(TeamMentorAssignment.mentor_id == mentor_id)
        if status is not None:
            statement = statement.where(TeamMentorAssignment.status == status)

        return list(self.db.scalars(statement).all())

    def get_teams_for_mentor(self, mentor_id: UUID, active_only: bool = True) -> list[Team]:
        statement = (
            select(Team)
            .join(TeamMentorAssignment, Team.id == TeamMentorAssignment.team_id)
            .where(TeamMentorAssignment.mentor_id == mentor_id)
        )
        if active_only:
            statement = statement.where(TeamMentorAssignment.status == "active")

        statement = statement.order_by(Team.name)
        return list(self.db.scalars(statement).all())

    def create_mentor_assignment(self, assignment: TeamMentorAssignment) -> TeamMentorAssignment:
        self.db.add(assignment)
        self.db.commit()
        self.db.refresh(assignment)
        return assignment

    def update_mentor_assignment(self, assignment: TeamMentorAssignment) -> TeamMentorAssignment:
        self.db.commit()
        self.db.refresh(assignment)
        return assignment

    def deactivate_active_mentor_assignments(self, team_id: UUID) -> None:
        statement = select(TeamMentorAssignment).where(
            TeamMentorAssignment.team_id == team_id,
            TeamMentorAssignment.status == "active",
        )
        active_assignments = self.db.scalars(statement).all()
        now = datetime.now(timezone.utc)
        for a in active_assignments:
            a.status = "reassigned"
            a.unassigned_at = now
        self.db.commit()

    # ==================== Team Project Assignments ====================

    def get_project_assignment_by_id(self, assignment_id: UUID) -> TeamProjectAssignment | None:
        statement = select(TeamProjectAssignment).where(TeamProjectAssignment.id == assignment_id)
        return self.db.scalar(statement)

    def get_active_project_assignment(self, team_id: UUID) -> TeamProjectAssignment | None:
        statement = select(TeamProjectAssignment).where(
            TeamProjectAssignment.team_id == team_id,
            TeamProjectAssignment.status == "active",
        )
        return self.db.scalar(statement)

    def get_project_assignments(
        self,
        team_id: UUID | None = None,
        project_id: UUID | None = None,
        company_id: UUID | None = None,
        status: str | None = None,
    ) -> list[TeamProjectAssignment]:
        statement = select(TeamProjectAssignment).order_by(TeamProjectAssignment.assigned_at.desc())

        if team_id is not None:
            statement = statement.where(TeamProjectAssignment.team_id == team_id)
        if project_id is not None:
            statement = statement.where(TeamProjectAssignment.project_id == project_id)
        if company_id is not None:
            statement = statement.where(TeamProjectAssignment.company_id == company_id)
        if status is not None:
            statement = statement.where(TeamProjectAssignment.status == status)

        return list(self.db.scalars(statement).all())

    def get_teams_for_project(self, project_id: UUID, active_only: bool = True) -> list[Team]:
        statement = (
            select(Team)
            .join(TeamProjectAssignment, Team.id == TeamProjectAssignment.team_id)
            .where(TeamProjectAssignment.project_id == project_id)
        )
        if active_only:
            statement = statement.where(TeamProjectAssignment.status == "active")

        statement = statement.order_by(Team.name)
        return list(self.db.scalars(statement).all())

    def create_project_assignment(self, assignment: TeamProjectAssignment) -> TeamProjectAssignment:
        self.db.add(assignment)
        self.db.commit()
        self.db.refresh(assignment)
        return assignment

    def update_project_assignment(self, assignment: TeamProjectAssignment) -> TeamProjectAssignment:
        self.db.commit()
        self.db.refresh(assignment)
        return assignment

    def deactivate_active_project_assignments(self, team_id: UUID) -> None:
        statement = select(TeamProjectAssignment).where(
            TeamProjectAssignment.team_id == team_id,
            TeamProjectAssignment.status == "active",
        )
        active_assignments = self.db.scalars(statement).all()
        now = datetime.now(timezone.utc)
        for a in active_assignments:
            a.status = "dropped"
            a.completed_at = now
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
