from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.challenge import (
    ChallengeCreate,
    ChallengeResponse,
    ChallengeUpdate,
)
from app.services.challenge import ChallengeService


router = APIRouter(
    prefix="/challenges",
)


@router.get(
    "",
    response_model=list[ChallengeResponse],
)
def get_challenges(
    status_filter: str | None = Query(
        default=None,
        alias="status",
        description="Filter by challenge status",
    ),
    difficulty: str | None = Query(
        default=None,
        description="Filter by difficulty",
    ),
    search: str | None = Query(
        default=None,
        description="Search title or company name",
    ),
    db: Session = Depends(get_db),
):
    service = ChallengeService(db)
    return service.get_all(
        status=status_filter,
        difficulty=difficulty,
        search=search,
    )


@router.get(
    "/{challenge_id}",
    response_model=ChallengeResponse,
)
def get_challenge(
    challenge_id: UUID,
    db: Session = Depends(get_db),
):
    service = ChallengeService(db)
    challenge = service.get_by_id(challenge_id)
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )
    return challenge


@router.post(
    "",
    response_model=ChallengeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_challenge(
    data: ChallengeCreate,
    db: Session = Depends(get_db),
):
    service = ChallengeService(db)
    try:
        return service.create(data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.patch(
    "/{challenge_id}",
    response_model=ChallengeResponse,
)
def update_challenge(
    challenge_id: UUID,
    data: ChallengeUpdate,
    db: Session = Depends(get_db),
):
    service = ChallengeService(db)
    try:
        challenge = service.update(challenge_id, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )
    return challenge


@router.delete(
    "/{challenge_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_challenge(
    challenge_id: UUID,
    db: Session = Depends(get_db),
):
    service = ChallengeService(db)
    try:
        deleted = service.delete(challenge_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )
