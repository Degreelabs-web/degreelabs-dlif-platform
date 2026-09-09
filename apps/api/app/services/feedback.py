from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.feedback import Feedback
from app.db.models.user import User
from app.db.repositories.feedback import FeedbackRepository
from app.db.repositories.student import StudentRepository
from app.db.repositories.submission import SubmissionRepository
from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackResponse,
    FeedbackUpdate,
)


class FeedbackService:
    def __init__(self, db: Session):
        self.db = db
        self.feedback_repo = FeedbackRepository(db)
        self.submission_repo = SubmissionRepository(db)
        self.user_repo = StudentRepository(db)

    def _build_response(self, feedback: Feedback) -> FeedbackResponse:
        reviewer: User | None = self.user_repo.get_user_by_id(
            feedback.reviewer_id
        )
        return FeedbackResponse(
            id=feedback.id,
            submission_id=feedback.submission_id,
            reviewer_id=feedback.reviewer_id,
            feedback_text=feedback.feedback_text,
            score=feedback.score,
            created_at=feedback.created_at,
            updated_at=feedback.updated_at,
            reviewer_name=reviewer.full_name if reviewer else None,
            reviewer_role=reviewer.role if reviewer else None,
        )

    def get_all(
        self,
        submission_id: UUID | None = None,
        reviewer_id: UUID | None = None,
    ) -> list[FeedbackResponse]:
        feedbacks = self.feedback_repo.get_all(
            submission_id=submission_id,
            reviewer_id=reviewer_id,
        )
        return [self._build_response(f) for f in feedbacks]

    def get_by_id(self, feedback_id: UUID) -> FeedbackResponse | None:
        feedback = self.feedback_repo.get_by_id(feedback_id)
        if not feedback:
            return None
        return self._build_response(feedback)

    def get_by_submission_id(
        self, submission_id: UUID
    ) -> list[FeedbackResponse]:
        submission = self.submission_repo.get_by_id(submission_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Submission {submission_id} not found",
            )
        feedbacks = self.feedback_repo.get_by_submission_id(submission_id)
        return [self._build_response(f) for f in feedbacks]

    def create(self, data: FeedbackCreate) -> FeedbackResponse:
        submission = self.submission_repo.get_by_id(data.submission_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Submission {data.submission_id} not found",
            )

        reviewer = self.user_repo.get_user_by_id(data.reviewer_id)
        if not reviewer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Reviewer {data.reviewer_id} not found",
            )

        feedback = Feedback(
            submission_id=data.submission_id,
            reviewer_id=data.reviewer_id,
            feedback_text=data.feedback_text,
            score=data.score,
        )

        try:
            created = self.feedback_repo.create(feedback)
            # Automatically update submission status to reviewed if it was submitted
            if submission.status in ["submitted", "draft"]:
                self.submission_repo.update_status(submission, "reviewed")
            return self._build_response(created)
        except IntegrityError as exc:
            self.feedback_repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Database integrity violation while creating feedback",
            ) from exc

    def update(
        self, feedback_id: UUID, data: FeedbackUpdate
    ) -> FeedbackResponse:
        feedback = self.feedback_repo.get_by_id(feedback_id)
        if not feedback:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Feedback not found",
            )

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(feedback, key, value)

        try:
            updated = self.feedback_repo.update(feedback)
            return self._build_response(updated)
        except IntegrityError as exc:
            self.feedback_repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Database integrity violation while updating feedback",
            ) from exc

    def delete(self, feedback_id: UUID) -> None:
        feedback = self.feedback_repo.get_by_id(feedback_id)
        if not feedback:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Feedback not found",
            )
        self.feedback_repo.delete(feedback)
