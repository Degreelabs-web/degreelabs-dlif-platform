from uuid import UUID

from sqlalchemy import func, or_, select
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
        organisation: str | None = None,
        industry: str | None = None,
        expertise: str | None = None,
        country: str | None = None,
    ) -> list[tuple[Mentor, User | None, int]]:
        use_database_array_filters = self.db.bind is None or self.db.bind.dialect.name != "sqlite"
        statement = (
            select(Mentor, User, func.count(TeamMentorAssignment.id))
            .join(User, Mentor.user_id == User.id)
            .outerjoin(
                TeamMentorAssignment,
                (TeamMentorAssignment.mentor_id == Mentor.id)
                & (TeamMentorAssignment.status == "active"),
            )
            .group_by(Mentor.id, User.id)
            .order_by(Mentor.created_at.desc())
        )

        if status is not None:
            statement = statement.where(Mentor.status == status)
        if organisation:
            statement = statement.where(Mentor.company_name.ilike(f"%{organisation}%"))
        if country:
            statement = statement.where(Mentor.country.ilike(f"%{country}%"))
        if industry and use_database_array_filters:
            statement = statement.where(
                func.array_to_string(Mentor.industries, ", ").ilike(
                    f"%{industry}%"
                )
            )
        if expertise and use_database_array_filters:
            statement = statement.where(
                func.array_to_string(Mentor.expertise, ", ").ilike(
                    f"%{expertise}%"
                )
            )

        if search:
            search_pattern = f"%{search}%"
            statement = statement.where(
                or_(
                    User.full_name.ilike(search_pattern),
                    User.email.ilike(search_pattern),
                    Mentor.company_name.ilike(search_pattern),
                    Mentor.designation.ilike(search_pattern),
                    func.array_to_string(Mentor.expertise, ", ").ilike(
                        search_pattern
                    )
                    if use_database_array_filters
                    else Mentor.id.is_not(None),
                )
            )

        statement = statement.offset(skip).limit(limit)
        rows = list(self.db.execute(statement).all())
        if not use_database_array_filters:
            if industry:
                industry_filter = industry.strip().lower()
                rows = [
                    row
                    for row in rows
                    if any(
                        industry_filter in item.lower()
                        for item in (row[0].industries or [])
                    )
                ]
            if expertise:
                expertise_filter = expertise.strip().lower()
                rows = [
                    row
                    for row in rows
                    if any(
                        expertise_filter in item.lower()
                        for item in (row[0].expertise or [])
                    )
                ]
            if search:
                search_filter = search.strip().lower()
                rows = [
                    row
                    for row in rows
                    if any(search_filter in item.lower() for item in (row[0].expertise or []))
                    or search_filter in (row[1].full_name or "").lower()
                    or search_filter in (row[1].email or "").lower()
                    or search_filter in (row[0].company_name or "").lower()
                    or search_filter in (row[0].designation or "").lower()
                ]
        return rows

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
