from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.cohort import (
    CohortCreate,
    CohortResponse,
    CohortUpdate,
)
from app.services.cohort import CohortService


router = APIRouter(
    prefix="/cohorts",
)


@router.get(
    "",
    response_model=list[CohortResponse],
)
def get_cohorts(
    institution_id: UUID | None = Query(default=None, description="Filter by institution ID"),
    status_filter: str | None = Query(default=None, alias="status", description="Filter by cohort status"),
    db: Session = Depends(get_db),
):
    service = CohortService(db)
    return service.get_all(institution_id=institution_id, status=status_filter)


@router.get(
    "/{cohort_id}",
    response_model=CohortResponse,
)
def get_cohort(
    cohort_id: UUID,
    db: Session = Depends(get_db),
):
    service = CohortService(db)
    cohort = service.get_by_id(cohort_id)

    if not cohort:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cohort not found",
        )

    return cohort


@router.post(
    "",
    response_model=CohortResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_cohort(
    data: CohortCreate,
    db: Session = Depends(get_db),
):
    service = CohortService(db)

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
    "/{cohort_id}",
    response_model=CohortResponse,
)
def update_cohort(
    cohort_id: UUID,
    data: CohortUpdate,
    db: Session = Depends(get_db),
):
    service = CohortService(db)

    try:
        cohort = service.update(cohort_id, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not cohort:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cohort not found",
        )

    return cohort


@router.delete(
    "/{cohort_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_cohort(
    cohort_id: UUID,
    db: Session = Depends(get_db),
):
    service = CohortService(db)

    try:
        deleted = service.delete(cohort_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cohort not found",
        )
