from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.rbac import require_admin
from app.db.session import get_db
from app.schemas.mentor import (
    MentorCreate,
    MentorDetailResponse,
    MentorStatus,
    MentorUpdate,
)
from app.services.mentor import MentorService

router = APIRouter(
    prefix="/mentors",
    dependencies=[Depends(require_admin)],
)


@router.get(
    "",
    response_model=list[MentorDetailResponse],
)
def get_mentors(
    status_filter: MentorStatus | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None),
    organisation: str | None = Query(default=None),
    industry: str | None = Query(default=None),
    expertise: str | None = Query(default=None),
    country: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    service = MentorService(db)
    return service.get_all(
        status=status_filter,
        search=search,
        skip=skip,
        limit=limit,
        organisation=organisation,
        industry=industry,
        expertise=expertise,
        country=country,
    )


@router.get(
    "/{mentor_id}",
    response_model=MentorDetailResponse,
)
def get_mentor(
    mentor_id: UUID,
    db: Session = Depends(get_db),
):
    service = MentorService(db)
    mentor = service.get_by_id(mentor_id)
    if not mentor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor not found",
        )
    return mentor


@router.post(
    "",
    response_model=MentorDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_mentor(
    data: MentorCreate,
    db: Session = Depends(get_db),
):
    service = MentorService(db)
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
    "/{mentor_id}",
    response_model=MentorDetailResponse,
)
def update_mentor(
    mentor_id: UUID,
    data: MentorUpdate,
    db: Session = Depends(get_db),
):
    service = MentorService(db)
    try:
        mentor = service.update(mentor_id, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not mentor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor not found",
        )
    return mentor


@router.delete(
    "/{mentor_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_mentor(
    mentor_id: UUID,
    db: Session = Depends(get_db),
):
    service = MentorService(db)
    try:
        deleted = service.delete(mentor_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor not found",
        )
