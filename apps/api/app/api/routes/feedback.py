from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackResponse,
    FeedbackUpdate,
)
from app.services.feedback import FeedbackService


router = APIRouter(
    prefix="/feedback",
)


@router.get(
    "",
    response_model=list[FeedbackResponse],
)
def get_all_feedback(
    submission_id: UUID | None = Query(
        default=None, description="Filter by submission ID"
    ),
    reviewer_id: UUID | None = Query(
        default=None, description="Filter by reviewer ID"
    ),
    db: Session = Depends(get_db),
):
    service = FeedbackService(db)
    return service.get_all(
        submission_id=submission_id,
        reviewer_id=reviewer_id,
    )


@router.get(
    "/{feedback_id}",
    response_model=FeedbackResponse,
)
def get_feedback(
    feedback_id: UUID,
    db: Session = Depends(get_db),
):
    service = FeedbackService(db)
    feedback = service.get_by_id(feedback_id)
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found",
        )
    return feedback


@router.post(
    "",
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_feedback(
    data: FeedbackCreate,
    db: Session = Depends(get_db),
):
    service = FeedbackService(db)
    return service.create(data)


@router.patch(
    "/{feedback_id}",
    response_model=FeedbackResponse,
)
def update_feedback(
    feedback_id: UUID,
    data: FeedbackUpdate,
    db: Session = Depends(get_db),
):
    service = FeedbackService(db)
    return service.update(feedback_id, data)


@router.delete(
    "/{feedback_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_feedback(
    feedback_id: UUID,
    db: Session = Depends(get_db),
):
    service = FeedbackService(db)
    service.delete(feedback_id)
