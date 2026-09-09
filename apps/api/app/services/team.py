from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.student_profile import StudentProfile
from app.db.models.team import Team
from app.db.models.team_member import TeamMember
from app.db.repositories.cohort import CohortRepository
from app.db.repositories.team import TeamRepository
from app.schemas.team import (
    TeamCreate,
    TeamMemberCreate,
    TeamMemberResponse,
    TeamMemberUpdate,
    TeamResponse,
    TeamUpdate,
)


class TeamService:
    def __init__(self, db: Session):
        self.db = db
        self.team_repo = TeamRepository(db)
        self.cohort_repo = CohortRepository(db)

    def _build_team_response(self, team: Team) -> TeamResponse:
        members = self.team_repo.get_members(team.id)
        member_responses = [
            TeamMemberResponse.model_validate(m) for m in members
        ]
        return TeamResponse(
            id=team.id,
            cohort_id=team.cohort_id,
            name=team.name,
            status=team.status,
            created_at=team.created_at,
            updated_at=team.updated_at,
            members=member_responses,
        )

    def get_all(
        self,
        cohort_id: UUID | None = None,
        status: str | None = None,
    ) -> list[TeamResponse]:
        teams = self.team_repo.get_all(
            cohort_id=cohort_id,
            status=status,
        )
        return [self._build_team_response(t) for t in teams]

    def get_by_id(self, team_id: UUID) -> TeamResponse | None:
        team = self.team_repo.get_by_id(team_id)
        if not team:
            return None
        return self._build_team_response(team)

    def create(self, data: TeamCreate) -> TeamResponse:
        cohort = self.cohort_repo.get_by_id(data.cohort_id)
        if not cohort:
            raise LookupError(f"Cohort with id '{data.cohort_id}' not found.")

        existing = self.team_repo.get_by_name_and_cohort(
            name=data.name,
            cohort_id=data.cohort_id,
        )
        if existing:
            raise ValueError(
                f"Team '{data.name}' already exists in this cohort."
            )

        all_students = set(data.member_student_ids)
        if data.leader_student_id:
            all_students.add(data.leader_student_id)

        for s_id in all_students:
            statement = select(StudentProfile).where(
                StudentProfile.id == s_id
            )
            prof = self.db.scalar(statement)
            if not prof:
                raise LookupError(
                    f"Student profile with id '{s_id}' not found."
                )

            cohort_membership = self.team_repo.get_student_team_in_cohort(
                student_id=s_id,
                cohort_id=data.cohort_id,
            )
            if cohort_membership:
                raise ValueError(
                    f"Student '{s_id}' is already in an active team in this cohort."
                )

        members = [
            TeamMember(
                student_id=s_id,
                role="leader" if s_id == data.leader_student_id else "member",
            )
            for s_id in all_students
        ]

        team = Team(
            name=data.name,
            cohort_id=data.cohort_id,
            status=data.status,
        )

        try:
            team = self.team_repo.create_team(team, members)
            return self._build_team_response(team)
        except IntegrityError as exc:
            self.team_repo.rollback()
            raise ValueError(
                "Could not create team due to database constraint."
            ) from exc

    def update(
        self,
        team_id: UUID,
        data: TeamUpdate,
    ) -> TeamResponse | None:
        team = self.team_repo.get_by_id(team_id)
        if not team:
            return None

        if data.name is not None and data.name != team.name:
            existing = self.team_repo.get_by_name_and_cohort(
                name=data.name,
                cohort_id=team.cohort_id,
            )
            if existing and existing.id != team.id:
                raise ValueError(
                    f"Team '{data.name}' already exists in this cohort."
                )
            team.name = data.name

        if data.status is not None:
            team.status = data.status

        try:
            team = self.team_repo.update_team(team)
            return self._build_team_response(team)
        except IntegrityError as exc:
            self.team_repo.rollback()
            raise ValueError(
                "Could not update team due to database constraint."
            ) from exc

    def delete(self, team_id: UUID) -> bool:
        team = self.team_repo.get_by_id(team_id)
        if not team:
            return False

        try:
            self.team_repo.delete_team(team)
            return True
        except IntegrityError as exc:
            self.team_repo.rollback()
            raise ValueError(
                "Cannot delete team with active dependencies."
            ) from exc

    def add_member(
        self,
        team_id: UUID,
        data: TeamMemberCreate,
    ) -> TeamMemberResponse:
        team = self.team_repo.get_by_id(team_id)
        if not team:
            raise LookupError(f"Team with id '{team_id}' not found.")

        statement = select(StudentProfile).where(
            StudentProfile.id == data.student_id
        )
        prof = self.db.scalar(statement)
        if not prof:
            raise LookupError(
                f"Student profile with id '{data.student_id}' not found."
            )

        existing = self.team_repo.get_member(team_id, data.student_id)
        if existing:
            raise ValueError("Student is already a member of this team.")

        cohort_membership = self.team_repo.get_student_team_in_cohort(
            student_id=data.student_id,
            cohort_id=team.cohort_id,
        )
        if cohort_membership:
            raise ValueError(
                "Student is already in an active team in this cohort."
            )

        member = TeamMember(
            team_id=team_id,
            student_id=data.student_id,
            role=data.role,
        )

        try:
            member = self.team_repo.add_member(member)
            return TeamMemberResponse.model_validate(member)
        except IntegrityError as exc:
            self.team_repo.rollback()
            raise ValueError(
                "Could not add member due to database constraint."
            ) from exc

    def update_member(
        self,
        team_id: UUID,
        student_id: UUID,
        data: TeamMemberUpdate,
    ) -> TeamMemberResponse | None:
        member = self.team_repo.get_member(team_id, student_id)
        if not member:
            return None

        if data.role is not None:
            member.role = data.role

        try:
            member = self.team_repo.update_member(member)
            return TeamMemberResponse.model_validate(member)
        except IntegrityError as exc:
            self.team_repo.rollback()
            raise ValueError(
                "Could not update member due to database constraint."
            ) from exc

    def remove_member(
        self,
        team_id: UUID,
        student_id: UUID,
    ) -> bool:
        member = self.team_repo.get_member(team_id, student_id)
        if not member:
            return False

        try:
            self.team_repo.remove_member(member)
            return True
        except IntegrityError as exc:
            self.team_repo.rollback()
            raise ValueError(
                "Could not remove member due to database constraint."
            ) from exc
