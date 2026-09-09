from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.institution import (
    InstitutionCreate,
    InstitutionResponse,
    InstitutionUpdate,
)
from app.services.institution import InstitutionService


router = APIRouter(
    prefix="/institutions",
)


@router.get(
    "",
    response_model=list[InstitutionResponse],
)
def get_institutions(
    db: Session = Depends(get_db),
):
    service = InstitutionService(db)
    return service.get_all()


@router.get(
    "/{institution_id}",
    response_model=InstitutionResponse,
)
def get_institution(
    institution_id: UUID,
    db: Session = Depends(get_db),
):
    service = InstitutionService(db)

    institution = service.get_by_id(institution_id)

    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found",
        )

    return institution


@router.post(
    "",
    response_model=InstitutionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_institution(
    data: InstitutionCreate,
    db: Session = Depends(get_db),
):
    service = InstitutionService(db)

    try:
        return service.create(data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.patch(
    "/{institution_id}",
    response_model=InstitutionResponse,
)
def update_institution(
    institution_id: UUID,
    data: InstitutionUpdate,
    db: Session = Depends(get_db),
):
    service = InstitutionService(db)

    try:
        institution = service.update(
            institution_id,
            data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found",
        )

    return institution


@router.delete(
    "/{institution_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_institution(
    institution_id: UUID,
    db: Session = Depends(get_db),
):
    service = InstitutionService(db)

    deleted = service.delete(institution_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found",
        )