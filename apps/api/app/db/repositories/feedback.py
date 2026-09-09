from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.feedback import Feedback


class FeedbackRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, feedback_id: UUID) -> Feedback | None:
        statement = select(Feedback).where(Feedback.id == feedback_id)
        return self.db.scalar(statement)

    def get_by_submission_id(self, submission_id: UUID) -> list[Feedback]:
        statement = (
            select(Feedback)
            .where(Feedback.submission_id == submission_id)
            .order_by(Feedback.created_at.desc())
        )
        return list(self.db.scalars(statement).all())

    def get_all(
        self,
        submission_id: UUID | None = None,
        reviewer_id: UUID | None = None,
    ) -> list[Feedback]:
        statement = select(Feedback).order_by(Feedback.created_at.desc())

        if submission_id is not None:
            statement = statement.where(Feedback.submission_id == submission_id)
        if reviewer_id is not None:
            statement = statement.where(Feedback.reviewer_id == reviewer_id)

        return list(self.db.scalars(statement).all())

    def create(self, feedback: Feedback) -> Feedback:
        self.db.add(feedback)
        self.db.commit()
        self.db.refresh(feedback)
        return feedback

    def update(self, feedback: Feedback) -> Feedback:
        self.db.commit()
        self.db.refresh(feedback)
        return feedback

    def delete(self, feedback: Feedback) -> None:
        self.db.delete(feedback)
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
