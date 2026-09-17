from uuid import UUID

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.student_profile import StudentProfile
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
from app.services.student_photo_storage import StudentPhotoStorageService


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
    _current_admin: User = Depends(require_admin),
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
            gender=data.gender,
            current_year_semester=data.current_year_semester,
            aadhaar_number=data.aadhaar_number,
            pan_number=data.pan_number,
            photo_url=data.photo_url,
            document_url=data.document_url,
            password=data.password,
        )

        
        student_service = StudentService(db)

        return student_service._to_response(user, profile)

    except StudentProvisioningError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.post(
    "/{user_id}/photo",
    response_model=StudentResponse,
)
async def upload_student_photo(
    user_id: UUID,
    file: UploadFile = File(...),
    _current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(StudentProfile)
        .filter(StudentProfile.user_id == user_id)
        .first()
    )
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    storage = StudentPhotoStorageService()
    previous_path = profile.photo_url
    profile.photo_url = await storage.upload(user_id, file)
    db.commit()

    if previous_path:
        storage.delete_quietly(previous_path)

    student = StudentService(db).get_by_id(user_id)
    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )
    return student

@router.get(
    "/{user_id}",
    response_model=StudentResponse,
)
def get_student(
    user_id: UUID,
    _current_admin: User = Depends(require_admin),
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
    _current_admin: User = Depends(require_admin),
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
    _current_admin: User = Depends(require_admin),
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
    _current_admin: User = Depends(require_admin),
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
