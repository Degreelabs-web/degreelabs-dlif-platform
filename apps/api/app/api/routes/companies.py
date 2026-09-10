from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.company import (
    CompanyCreate,
    CompanyDetailResponse,
    CompanyUpdate,
)
from app.services.company import CompanyService

router = APIRouter(
    prefix="/companies",
)


@router.get(
    "",
    response_model=list[CompanyDetailResponse],
)
def get_companies(
    industry: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    service = CompanyService(db)
    return service.get_all(
        industry=industry,
        status=status_filter,
        search=search,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{company_id}",
    response_model=CompanyDetailResponse,
)
def get_company(
    company_id: UUID,
    db: Session = Depends(get_db),
):
    service = CompanyService(db)
    company = service.get_by_id(company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )
    return company


@router.post(
    "",
    response_model=CompanyDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_company(
    data: CompanyCreate,
    db: Session = Depends(get_db),
):
    service = CompanyService(db)
    try:
        return service.create(data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.patch(
    "/{company_id}",
    response_model=CompanyDetailResponse,
)
def update_company(
    company_id: UUID,
    data: CompanyUpdate,
    db: Session = Depends(get_db),
):
    service = CompanyService(db)
    try:
        company = service.update(company_id, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )
    return company


@router.delete(
    "/{company_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_company(
    company_id: UUID,
    db: Session = Depends(get_db),
):
    service = CompanyService(db)
    try:
        deleted = service.delete(company_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )
