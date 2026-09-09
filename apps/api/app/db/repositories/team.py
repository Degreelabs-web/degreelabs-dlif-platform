from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.team import Team
from app.db.models.team_member import TeamMember


class TeamRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(
        self,
        cohort_id: UUID | None = None,
        status: str | None = None,
    ) -> list[Team]:
        statement = select(Team).order_by(Team.name)

        if cohort_id is not None:
            statement = statement.where(Team.cohort_id == cohort_id)
        if status is not None:
            statement = statement.where(Team.status == status)

        return list(self.db.scalars(statement).all())

    def get_by_id(self, team_id: UUID) -> Team | None:
        statement = select(Team).where(Team.id == team_id)
        return self.db.scalar(statement)

    def get_by_name_and_cohort(
        self,
        name: str,
        cohort_id: UUID,
    ) -> Team | None:
        statement = select(Team).where(
            Team.name == name,
            Team.cohort_id == cohort_id,
        )
        return self.db.scalar(statement)

    def get_student_team_in_cohort(
        self,
        student_id: UUID,
        cohort_id: UUID,
    ) -> TeamMember | None:
        statement = (
            select(TeamMember)
            .join(Team, TeamMember.team_id == Team.id)
            .where(
                TeamMember.student_id == student_id,
                Team.cohort_id == cohort_id,
                TeamMember.left_at.is_(None),
                Team.status == "active",
            )
        )
        return self.db.scalar(statement)

    def get_members(self, team_id: UUID) -> list[TeamMember]:
        statement = (
            select(TeamMember)
            .where(TeamMember.team_id == team_id)
            .order_by(TeamMember.joined_at)
        )
        return list(self.db.scalars(statement).all())

    def get_member(
        self,
        team_id: UUID,
        student_id: UUID,
    ) -> TeamMember | None:
        statement = select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.student_id == student_id,
        )
        return self.db.scalar(statement)

    def create_team(
        self,
        team: Team,
        members: list[TeamMember],
    ) -> Team:
        self.db.add(team)
        self.db.flush()
        for m in members:
            m.team_id = team.id
            self.db.add(m)
        self.db.commit()
        self.db.refresh(team)
        return team

    def update_team(self, team: Team) -> Team:
        self.db.commit()
        self.db.refresh(team)
        return team

    def delete_team(self, team: Team) -> None:
        self.db.delete(team)
        self.db.commit()

    def add_member(self, member: TeamMember) -> TeamMember:
        self.db.add(member)
        self.db.commit()
        self.db.refresh(member)
        return member

    def update_member(self, member: TeamMember) -> TeamMember:
        self.db.commit()
        self.db.refresh(member)
        return member

    def remove_member(self, member: TeamMember) -> None:
        self.db.delete(member)
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
