from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.submission import (
    SubmissionCreate,
    SubmissionDetailResponse,
    SubmissionResponse,
    SubmissionStatusUpdate,
    SubmissionVersionResponse,
    SubmissionVersionSubmit,
)
from app.services.submission import SubmissionService


router = APIRouter(
    prefix="/submissions",
)


@router.get(
    "",
    response_model=list[SubmissionResponse],
)
def get_submissions(
    team_id: UUID | None = Query(
        default=None, description="Filter by team ID"
    ),
    task_id: UUID | None = Query(
        default=None, description="Filter by session task ID"
    ),
    status_filter: str | None = Query(
        default=None, alias="status", description="Filter by submission status"
    ),
    db: Session = Depends(get_db),
):
    service = SubmissionService(db)
    return service.get_all(
        team_id=team_id,
        task_id=task_id,
        status=status_filter,
    )


@router.get(
    "/{submission_id}",
    response_model=SubmissionDetailResponse,
)
def get_submission(
    submission_id: UUID,
    db: Session = Depends(get_db),
):
    service = SubmissionService(db)
    submission = service.get_by_id(submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found",
        )
    return submission


@router.post(
    "",
    response_model=SubmissionDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_task(
    data: SubmissionCreate,
    db: Session = Depends(get_db),
):
    service = SubmissionService(db)
    return service.create_or_append_submission(data)


@router.post(
    "/{submission_id}/versions",
    response_model=SubmissionDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_new_version(
    submission_id: UUID,
    data: SubmissionVersionSubmit,
    db: Session = Depends(get_db),
):
    service = SubmissionService(db)
    return service.add_version(submission_id, data)


@router.get(
    "/{submission_id}/versions",
    response_model=list[SubmissionVersionResponse],
)
def get_submission_versions(
    submission_id: UUID,
    db: Session = Depends(get_db),
):
    service = SubmissionService(db)
    return service.get_versions(submission_id)


@router.get(
    "/{submission_id}/versions/{version_number}",
    response_model=SubmissionVersionResponse,
)
def get_submission_version(
    submission_id: UUID,
    version_number: int,
    db: Session = Depends(get_db),
):
    service = SubmissionService(db)
    return service.get_version_by_number(submission_id, version_number)


@router.patch(
    "/{submission_id}/status",
    response_model=SubmissionResponse,
)
def update_submission_status(
    submission_id: UUID,
    data: SubmissionStatusUpdate,
    db: Session = Depends(get_db),
):
    service = SubmissionService(db)
    return service.update_status(submission_id, data)


@router.delete(
    "/{submission_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_submission(
    submission_id: UUID,
    db: Session = Depends(get_db),
):
    service = SubmissionService(db)
    service.delete(submission_id)
