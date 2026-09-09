from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.challenge import Challenge
from app.db.repositories.challenge import ChallengeRepository
from app.schemas.challenge import ChallengeCreate, ChallengeUpdate


class ChallengeService:
    def __init__(self, db: Session):
        self.challenge_repo = ChallengeRepository(db)

    def get_all(
        self,
        status: str | None = None,
        difficulty: str | None = None,
        search: str | None = None,
    ) -> list[Challenge]:
        return self.challenge_repo.get_all(
            status=status,
            difficulty=difficulty,
            search=search,
        )

    def get_by_id(self, challenge_id: UUID) -> Challenge | None:
        return self.challenge_repo.get_by_id(challenge_id)

    def create(self, data: ChallengeCreate) -> Challenge:
        challenge = Challenge(
            title=data.title,
            company_name=data.company_name,
            description=data.description,
            problem_statement=data.problem_statement,
            expected_outcome=data.expected_outcome,
            difficulty=data.difficulty,
            status=data.status,
        )

        try:
            return self.challenge_repo.create(challenge)
        except IntegrityError as exc:
            self.challenge_repo.rollback()
            raise ValueError(
                "Could not create challenge due to database constraint."
            ) from exc

    def update(
        self,
        challenge_id: UUID,
        data: ChallengeUpdate,
    ) -> Challenge | None:
        challenge = self.challenge_repo.get_by_id(challenge_id)
        if not challenge:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(challenge, field, value)

        try:
            return self.challenge_repo.update(challenge)
        except IntegrityError as exc:
            self.challenge_repo.rollback()
            raise ValueError(
                "Could not update challenge due to database constraint."
            ) from exc

    def delete(self, challenge_id: UUID) -> bool:
        challenge = self.challenge_repo.get_by_id(challenge_id)
        if not challenge:
            return False

        try:
            self.challenge_repo.delete(challenge)
            return True
        except IntegrityError as exc:
            self.challenge_repo.rollback()
            raise ValueError(
                "Cannot delete challenge with active team assignments."
            ) from exc
