from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.challenge_assignment import ChallengeAssignment


class ChallengeAssignmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(
        self,
        team_id: UUID | None = None,
        challenge_id: UUID | None = None,
        status: str | None = None,
    ) -> list[ChallengeAssignment]:
        statement = select(ChallengeAssignment).order_by(
            ChallengeAssignment.assigned_at.desc()
        )

        if team_id is not None:
            statement = statement.where(ChallengeAssignment.team_id == team_id)
        if challenge_id is not None:
            statement = statement.where(
                ChallengeAssignment.challenge_id == challenge_id
            )
        if status is not None:
            statement = statement.where(ChallengeAssignment.status == status)

        return list(self.db.scalars(statement).all())

    def get_by_id(self, assignment_id: UUID) -> ChallengeAssignment | None:
        statement = select(ChallengeAssignment).where(
            ChallengeAssignment.id == assignment_id
        )
        return self.db.scalar(statement)

    def get_by_team_and_challenge(
        self,
        team_id: UUID,
        challenge_id: UUID,
    ) -> ChallengeAssignment | None:
        statement = select(ChallengeAssignment).where(
            ChallengeAssignment.team_id == team_id,
            ChallengeAssignment.challenge_id == challenge_id,
        )
        return self.db.scalar(statement)

    def create(
        self,
        assignment: ChallengeAssignment,
    ) -> ChallengeAssignment:
        self.db.add(assignment)
        self.db.commit()
        self.db.refresh(assignment)
        return assignment

    def update(
        self,
        assignment: ChallengeAssignment,
    ) -> ChallengeAssignment:
        self.db.commit()
        self.db.refresh(assignment)
        return assignment

    def delete(self, assignment: ChallengeAssignment) -> None:
        self.db.delete(assignment)
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
