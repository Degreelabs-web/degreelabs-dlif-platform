from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.challenge_assignment import ChallengeAssignment
from app.db.repositories.challenge import ChallengeRepository
from app.db.repositories.challenge_assignment import ChallengeAssignmentRepository
from app.db.repositories.team import TeamRepository
from app.schemas.challenge_assignment import (
    ChallengeAssignmentCreate,
    ChallengeAssignmentUpdate,
)


class ChallengeAssignmentService:
    def __init__(self, db: Session):
        self.assignment_repo = ChallengeAssignmentRepository(db)
        self.challenge_repo = ChallengeRepository(db)
        self.team_repo = TeamRepository(db)

    def get_all(
        self,
        team_id: UUID | None = None,
        challenge_id: UUID | None = None,
        status: str | None = None,
    ) -> list[ChallengeAssignment]:
        return self.assignment_repo.get_all(
            team_id=team_id,
            challenge_id=challenge_id,
            status=status,
        )

    def get_by_id(self, assignment_id: UUID) -> ChallengeAssignment | None:
        return self.assignment_repo.get_by_id(assignment_id)

    def create(
        self,
        data: ChallengeAssignmentCreate,
    ) -> ChallengeAssignment:
        challenge = self.challenge_repo.get_by_id(data.challenge_id)
        if not challenge:
            raise LookupError(
                f"Challenge with id '{data.challenge_id}' not found."
            )

        team = self.team_repo.get_by_id(data.team_id)
        if not team:
            raise LookupError(f"Team with id '{data.team_id}' not found.")

        existing = self.assignment_repo.get_by_team_and_challenge(
            team_id=data.team_id,
            challenge_id=data.challenge_id,
        )
        if existing:
            raise ValueError(
                "This challenge is already assigned to this team."
            )

        assignment = ChallengeAssignment(
            challenge_id=data.challenge_id,
            team_id=data.team_id,
            status=data.status,
        )

        try:
            return self.assignment_repo.create(assignment)
        except IntegrityError as exc:
            self.assignment_repo.rollback()
            raise ValueError(
                "Could not assign challenge due to database constraint."
            ) from exc

    def update(
        self,
        assignment_id: UUID,
        data: ChallengeAssignmentUpdate,
    ) -> ChallengeAssignment | None:
        assignment = self.assignment_repo.get_by_id(assignment_id)
        if not assignment:
            return None

        if data.status is not None:
            assignment.status = data.status

        try:
            return self.assignment_repo.update(assignment)
        except IntegrityError as exc:
            self.assignment_repo.rollback()
            raise ValueError(
                "Could not update challenge assignment due to database constraint."
            ) from exc

    def delete(self, assignment_id: UUID) -> bool:
        assignment = self.assignment_repo.get_by_id(assignment_id)
        if not assignment:
            return False

        try:
            self.assignment_repo.delete(assignment)
            return True
        except IntegrityError as exc:
            self.assignment_repo.rollback()
            raise ValueError(
                "Cannot delete challenge assignment with active dependencies."
            ) from exc
