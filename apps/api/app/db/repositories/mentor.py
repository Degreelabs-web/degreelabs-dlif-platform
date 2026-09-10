from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models.mentor import Mentor
from app.db.models.team_mentor_assignment import TeamMentorAssignment
from app.db.models.user import User


class MentorRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(
        self,
        status: str | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Mentor]:
        statement = select(Mentor).order_by(Mentor.created_at.desc())

        if status is not None:
            statement = statement.where(Mentor.status == status)

        if search:
            search_pattern = f"%{search}%"
            statement = statement.join(User, Mentor.user_id == User.id).where(
                User.full_name.ilike(search_pattern)
                | User.email.ilike(search_pattern)
                | Mentor.company_name.ilike(search_pattern)
                | Mentor.designation.ilike(search_pattern)
            )

        statement = statement.offset(skip).limit(limit)
        return list(self.db.scalars(statement).all())

    def get_by_id(self, mentor_id: UUID) -> Mentor | None:
        statement = select(Mentor).where(Mentor.id == mentor_id)
        return self.db.scalar(statement)

    def get_by_user_id(self, user_id: UUID) -> Mentor | None:
        statement = select(Mentor).where(Mentor.user_id == user_id)
        return self.db.scalar(statement)

    def get_assigned_teams_count(self, mentor_id: UUID) -> int:
        statement = select(func.count(TeamMentorAssignment.id)).where(
            TeamMentorAssignment.mentor_id == mentor_id,
            TeamMentorAssignment.status == "active",
        )
        return self.db.scalar(statement) or 0

    def create(self, mentor: Mentor) -> Mentor:
        self.db.add(mentor)
        self.db.commit()
        self.db.refresh(mentor)
        return mentor

    def update(self, mentor: Mentor) -> Mentor:
        self.db.commit()
        self.db.refresh(mentor)
        return mentor

    def delete(self, mentor: Mentor) -> None:
        self.db.delete(mentor)
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
