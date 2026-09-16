from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.institution import (
    InstitutionCreate,
    InstitutionImportResponse,
    InstitutionResponse,
    InstitutionUpdate,
)
from app.services.institution import InstitutionService
from app.services.institution_import import InstitutionWorkbookError, parse_institution_workbook
from app.core.rbac import require_admin
from app.db.models.user import User


router = APIRouter(
    prefix="/institutions",
)


@router.get(
    "",
    response_model=list[InstitutionResponse],
)
def get_institutions(
    _current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    service = InstitutionService(db)
    return service.get_all()


@router.post(
    "",
    response_model=InstitutionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_institution(
    data: InstitutionCreate,
    _current_admin: User = Depends(require_admin),
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


@router.post(
    "/import",
    response_model=InstitutionImportResponse,
)
async def import_institutions(
    workbook: UploadFile = File(...),
    _current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if not workbook.filename or not workbook.filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Upload an .xlsx workbook.")

    contents = await workbook.read()
    if not contents or len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Workbook must be between 1 byte and 10 MB.")

    try:
        rows = parse_institution_workbook(contents)
    except InstitutionWorkbookError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    return InstitutionService(db).import_rows(rows)


@router.get(
    "/{institution_id}",
    response_model=InstitutionResponse,
)
def get_institution(
    institution_id: UUID,
    _current_admin: User = Depends(require_admin),
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


@router.patch(
    "/{institution_id}",
    response_model=InstitutionResponse,
)
def update_institution(
    institution_id: UUID,
    data: InstitutionUpdate,
    _current_admin: User = Depends(require_admin),
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
    _current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    service = InstitutionService(db)

    deleted = service.delete(institution_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found",
        )
