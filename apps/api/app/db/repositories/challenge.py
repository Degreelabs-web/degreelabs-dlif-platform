from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.challenge import Challenge


class ChallengeRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(
        self,
        status: str | None = None,
        difficulty: str | None = None,
        search: str | None = None,
    ) -> list[Challenge]:
        statement = select(Challenge).order_by(Challenge.title)

        if status is not None:
            statement = statement.where(Challenge.status == status)
        if difficulty is not None:
            statement = statement.where(Challenge.difficulty == difficulty)
        if search is not None:
            pattern = f"%{search}%"
            statement = statement.where(
                Challenge.title.ilike(pattern)
                | Challenge.company_name.ilike(pattern)
            )

        return list(self.db.scalars(statement).all())

    def get_by_id(self, challenge_id: UUID) -> Challenge | None:
        statement = select(Challenge).where(Challenge.id == challenge_id)
        return self.db.scalar(statement)

    def create(self, challenge: Challenge) -> Challenge:
        self.db.add(challenge)
        self.db.commit()
        self.db.refresh(challenge)
        return challenge

    def update(self, challenge: Challenge) -> Challenge:
        self.db.commit()
        self.db.refresh(challenge)
        return challenge

    def delete(self, challenge: Challenge) -> None:
        self.db.delete(challenge)
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
