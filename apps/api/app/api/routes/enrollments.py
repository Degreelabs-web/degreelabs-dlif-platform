from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.enrollment import (
    EnrollmentCreate,
    EnrollmentResponse,
    EnrollmentUpdate,
)
from app.services.enrollment import EnrollmentService


router = APIRouter(
    prefix="/enrollments",
)


@router.get(
    "",
    response_model=list[EnrollmentResponse],
)
def get_enrollments(
    cohort_id: UUID | None = Query(
        default=None,
        description="Filter by cohort ID",
    ),
    user_id: UUID | None = Query(
        default=None,
        description="Filter by student user ID",
    ),
    status_filter: str | None = Query(
        default=None,
        alias="status",
        description="Filter by enrollment status",
    ),
    db: Session = Depends(get_db),
):
    service = EnrollmentService(db)
    return service.get_all(
        cohort_id=cohort_id,
        user_id=user_id,
        status=status_filter,
    )


@router.get(
    "/{enrollment_id}",
    response_model=EnrollmentResponse,
)
def get_enrollment(
    enrollment_id: UUID,
    db: Session = Depends(get_db),
):
    service = EnrollmentService(db)
    enrollment = service.get_by_id(enrollment_id)
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found",
        )
    return enrollment


@router.post(
    "",
    response_model=EnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_enrollment(
    data: EnrollmentCreate,
    db: Session = Depends(get_db),
):
    service = EnrollmentService(db)
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
    "/{enrollment_id}",
    response_model=EnrollmentResponse,
)
def update_enrollment(
    enrollment_id: UUID,
    data: EnrollmentUpdate,
    db: Session = Depends(get_db),
):
    service = EnrollmentService(db)
    try:
        enrollment = service.update(enrollment_id, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found",
        )
    return enrollment


@router.delete(
    "/{enrollment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_enrollment(
    enrollment_id: UUID,
    db: Session = Depends(get_db),
):
    service = EnrollmentService(db)
    try:
        deleted = service.delete(enrollment_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found",
        )
