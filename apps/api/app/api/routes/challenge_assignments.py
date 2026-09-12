from uuid import UUID

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Query, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.challenge_assignment import (
    ChallengeAssignmentCreate,
    ChallengeAssignmentResponse,
    ChallengeAssignmentUpdate,
)
from app.services.challenge_assignment import ChallengeAssignmentService


router = APIRouter(
    prefix="/challenge-assignments",
)


@router.get(
    "",
    response_model=list[ChallengeAssignmentResponse],
)
def get_challenge_assignments(
    team_id: UUID | None = Query(
        default=None,
        description="Filter by team ID",
    ),
    challenge_id: UUID | None = Query(
        default=None,
        description="Filter by challenge ID",
    ),
    status_filter: str | None = Query(
        default=None,
        alias="status",
        description="Filter by assignment status",
    ),
    db: Session = Depends(get_db),
):
    service = ChallengeAssignmentService(db)
    return service.get_all(
        team_id=team_id,
        challenge_id=challenge_id,
        status=status_filter,
    )


@router.get(
    "/{assignment_id}",
    response_model=ChallengeAssignmentResponse,
)
def get_challenge_assignment(
    assignment_id: UUID,
    db: Session = Depends(get_db),
):
    service = ChallengeAssignmentService(db)
    assignment = service.get_by_id(assignment_id)
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge assignment not found",
        )
    return assignment


@router.post(
    "",
    response_model=ChallengeAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_challenge_assignment(
    data: ChallengeAssignmentCreate,
    db: Session = Depends(get_db),
):
    service = ChallengeAssignmentService(db)
    try:
        return service.create(data)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.patch(
    "/{assignment_id}",
    response_model=ChallengeAssignmentResponse,
)
def update_challenge_assignment(
    assignment_id: UUID,
    data: ChallengeAssignmentUpdate,
    db: Session = Depends(get_db),
):
    service = ChallengeAssignmentService(db)
    try:
        assignment = service.update(assignment_id, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge assignment not found",
        )
    return assignment


@router.delete(
    "/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_challenge_assignment(
    assignment_id: UUID,
    db: Session = Depends(get_db),
):
    service = ChallengeAssignmentService(db)
    try:
        deleted = service.delete(assignment_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge assignment not found",
        )
