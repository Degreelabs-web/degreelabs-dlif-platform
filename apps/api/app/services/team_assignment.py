from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.company import Company
from app.db.models.mentor import Mentor
from app.db.models.project import Project
from app.db.models.team import Team
from app.db.models.team_mentor_assignment import TeamMentorAssignment
from app.db.models.team_project_assignment import TeamProjectAssignment
from app.db.models.user import User
from app.db.repositories.company import CompanyRepository
from app.db.repositories.mentor import MentorRepository
from app.db.repositories.project import ProjectRepository
from app.db.repositories.team import TeamRepository
from app.db.repositories.team_assignment import TeamAssignmentRepository
from app.schemas.team_mentor_assignment import (
    TeamMentorAssignmentCreate,
    TeamMentorAssignmentDetailResponse,
    TeamMentorAssignmentResponse,
    TeamMentorAssignmentUpdate,
)
from app.schemas.team_project_assignment import (
    TeamProjectAssignmentCreate,
    TeamProjectAssignmentDetailResponse,
    TeamProjectAssignmentResponse,
    TeamProjectAssignmentUpdate,
)


class TeamAssignmentService:
    def __init__(self, db: Session):
        self.db = db
        self.assignment_repo = TeamAssignmentRepository(db)
        self.team_repo = TeamRepository(db)
        self.mentor_repo = MentorRepository(db)
        self.project_repo = ProjectRepository(db)
        self.company_repo = CompanyRepository(db)

    # ==================== Mentor Assignment ====================

    def _build_mentor_assignment_detail(self, assignment: TeamMentorAssignment) -> TeamMentorAssignmentDetailResponse:
        team = self.team_repo.get_by_id(assignment.team_id)
        mentor = self.mentor_repo.get_by_id(assignment.mentor_id)
        user = self.db.scalar(select(User).where(User.id == mentor.user_id)) if mentor else None

        return TeamMentorAssignmentDetailResponse(
            id=assignment.id,
            team_id=assignment.team_id,
            mentor_id=assignment.mentor_id,
            notes=assignment.notes,
            status=assignment.status,
            assigned_at=assignment.assigned_at,
            unassigned_at=assignment.unassigned_at,
            team_name=team.name if team else None,
            mentor_name=user.full_name if user else None,
            mentor_email=user.email if user else None,
            mentor_company=mentor.company_name if mentor else None,
        )

    def get_mentor_assignments(
        self,
        team_id: UUID | None = None,
        mentor_id: UUID | None = None,
        status: str | None = None,
    ) -> list[TeamMentorAssignmentDetailResponse]:
        assignments = self.assignment_repo.get_mentor_assignments(team_id=team_id, mentor_id=mentor_id, status=status)
        return [self._build_mentor_assignment_detail(a) for a in assignments]

    def assign_mentor(self, data: TeamMentorAssignmentCreate) -> TeamMentorAssignmentDetailResponse:
        team = self.team_repo.get_by_id(data.team_id)
        if not team:
            raise LookupError(f"Team with id '{data.team_id}' not found.")

        mentor = self.mentor_repo.get_by_id(data.mentor_id)
        if not mentor:
            raise LookupError(f"Mentor with id '{data.mentor_id}' not found.")

        if mentor.status != "active":
            raise ValueError(f"Mentor is '{mentor.status}' and cannot be assigned to new teams.")

        # Invariant: Team has 1 active mentor. Auto-retire any active assignment to maintain invariant
        self.assignment_repo.deactivate_active_mentor_assignments(data.team_id)

        assignment = TeamMentorAssignment(
            team_id=data.team_id,
            mentor_id=data.mentor_id,
            notes=data.notes,
            status="active",
        )

        try:
            created = self.assignment_repo.create_mentor_assignment(assignment)
            return self._build_mentor_assignment_detail(created)
        except IntegrityError as exc:
            self.assignment_repo.rollback()
            raise ValueError("Could not assign mentor due to database constraint.") from exc

    def unassign_mentor(self, assignment_id: UUID) -> bool:
        assignment = self.assignment_repo.get_mentor_assignment_by_id(assignment_id)
        if not assignment:
            return False

        assignment.status = "completed"
        assignment.unassigned_at = datetime.now(timezone.utc)
        self.assignment_repo.update_mentor_assignment(assignment)
        return True

    # ==================== Project Assignment ====================

    def _build_project_assignment_detail(self, assignment: TeamProjectAssignment) -> TeamProjectAssignmentDetailResponse:
        team = self.team_repo.get_by_id(assignment.team_id)
        project = self.project_repo.get_by_id(assignment.project_id)
        company = self.company_repo.get_by_id(assignment.company_id)

        return TeamProjectAssignmentDetailResponse(
            id=assignment.id,
            team_id=assignment.team_id,
            project_id=assignment.project_id,
            company_id=assignment.company_id,
            notes=assignment.notes,
            status=assignment.status,
            assigned_at=assignment.assigned_at,
            completed_at=assignment.completed_at,
            team_name=team.name if team else None,
            project_title=project.title if project else None,
            company_name=company.name if company else None,
            company_logo_url=company.logo_url if company else None,
        )

    def get_project_assignments(
        self,
        team_id: UUID | None = None,
        project_id: UUID | None = None,
        company_id: UUID | None = None,
        status: str | None = None,
    ) -> list[TeamProjectAssignmentDetailResponse]:
        assignments = self.assignment_repo.get_project_assignments(
            team_id=team_id, project_id=project_id, company_id=company_id, status=status
        )
        return [self._build_project_assignment_detail(a) for a in assignments]

    def assign_project(self, data: TeamProjectAssignmentCreate) -> TeamProjectAssignmentDetailResponse:
        team = self.team_repo.get_by_id(data.team_id)
        if not team:
            raise LookupError(f"Team with id '{data.team_id}' not found.")

        project = self.project_repo.get_by_id(data.project_id)
        if not project:
            raise LookupError(f"Project with id '{data.project_id}' not found.")

        if project.status not in ["active", "draft"]:
            raise ValueError(f"Project is '{project.status}' and cannot be assigned to teams.")

        # Check project max teams
        active_teams_count = self.project_repo.get_assigned_teams_count(data.project_id)
        if active_teams_count >= project.max_teams:
            raise ValueError(
                f"Project '{project.title}' has reached its maximum capacity of {project.max_teams} teams."
            )

        # Invariant: Team can have 1 active company/project assignment. Auto-retire previous active assignment
        self.assignment_repo.deactivate_active_project_assignments(data.team_id)

        assignment = TeamProjectAssignment(
            team_id=data.team_id,
            project_id=data.project_id,
            company_id=project.company_id,
            notes=data.notes,
            status="active",
        )

        try:
            created = self.assignment_repo.create_project_assignment(assignment)
            return self._build_project_assignment_detail(created)
        except IntegrityError as exc:
            self.assignment_repo.rollback()
            raise ValueError("Could not assign project due to database constraint.") from exc

    def unassign_project(self, assignment_id: UUID) -> bool:
        assignment = self.assignment_repo.get_project_assignment_by_id(assignment_id)
        if not assignment:
            return False

        assignment.status = "completed"
        assignment.completed_at = datetime.now(timezone.utc)
        self.assignment_repo.update_project_assignment(assignment)
        return True
