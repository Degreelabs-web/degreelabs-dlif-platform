from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.student import (
    StudentCreate,
    StudentProvisionRequest,
    StudentResponse,
    StudentUpdate,
)
from app.services.student import StudentService
from app.core.rbac import require_admin
from app.db.models.user import User
from app.services.student_provisioning import (
    StudentProvisioningError,
    StudentProvisioningService,
)


router = APIRouter(
    prefix="/students",
)


@router.get(
    "",
    response_model=list[StudentResponse],
)
def get_students(
    institution_id: UUID | None = Query(
        default=None,
        description="Filter by institution ID",
    ),
    status_filter: str | None = Query(
        default=None,
        alias="status",
        description="Filter by student user status",
    ),
    db: Session = Depends(get_db),
):
    service = StudentService(db)
    return service.get_all(
        institution_id=institution_id,
        status=status_filter,
    )

@router.post(
    "/provision",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
)
def provision_student(
    data: StudentProvisionRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    provisioning_service = StudentProvisioningService(db)

    try:
        user, profile = provisioning_service.provision_student(
            email=str(data.email),
            full_name=data.full_name,
            institution_id=data.institution_id,
            student_id=data.student_id,
            phone=data.phone,
            course=data.course,
            branch=data.branch,
            graduation_year=data.graduation_year,
            password=data.password,
        )

        # Reuse the existing StudentService response mapping.
        student_service = StudentService(db)

        return student_service._to_response(user, profile)

    except StudentProvisioningError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

@router.get(
    "/{user_id}",
    response_model=StudentResponse,
)
def get_student(
    user_id: UUID,
    db: Session = Depends(get_db),
):
    service = StudentService(db)
    student = service.get_by_id(user_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )
    return student


@router.post(
    "",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_student(
    data: StudentCreate,
    db: Session = Depends(get_db),
):
    service = StudentService(db)
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
    "/{user_id}",
    response_model=StudentResponse,
)
def update_student(
    user_id: UUID,
    data: StudentUpdate,
    db: Session = Depends(get_db),
):
    service = StudentService(db)
    try:
        student = service.update(user_id, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )
    return student


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_student(
    user_id: UUID,
    db: Session = Depends(get_db),
):
    service = StudentService(db)
    try:
        deleted = service.delete(user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )
