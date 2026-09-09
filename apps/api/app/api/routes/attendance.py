from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.attendance import (
    AttendanceBatchCreate,
    AttendanceBatchResponse,
    AttendanceCreate,
    AttendanceResponse,
    AttendanceUpdate,
)
from app.services.attendance import AttendanceService


router = APIRouter(
    prefix="/attendance",
)


@router.get(
    "",
    response_model=list[AttendanceResponse],
)
def get_attendance(
    session_id: UUID | None = Query(
        default=None, description="Filter by session ID"
    ),
    student_id: UUID | None = Query(
        default=None, description="Filter by student profile ID"
    ),
    status_filter: str | None = Query(
        default=None, alias="status", description="Filter by status"
    ),
    db: Session = Depends(get_db),
):
    service = AttendanceService(db)
    return service.get_all(
        session_id=session_id,
        student_id=student_id,
        status=status_filter,
    )


@router.get(
    "/{attendance_id}",
    response_model=AttendanceResponse,
)
def get_attendance_record(
    attendance_id: UUID,
    db: Session = Depends(get_db),
):
    service = AttendanceService(db)
    rec = service.get_by_id(attendance_id)
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found",
        )
    return rec


@router.post(
    "",
    response_model=AttendanceResponse,
    status_code=status.HTTP_201_CREATED,
)
def record_attendance(
    data: AttendanceCreate,
    db: Session = Depends(get_db),
):
    service = AttendanceService(db)
    return service.record_attendance(data)


@router.post(
    "/batch",
    response_model=AttendanceBatchResponse,
    status_code=status.HTTP_201_CREATED,
)
def record_batch_attendance(
    data: AttendanceBatchCreate,
    db: Session = Depends(get_db),
):
    service = AttendanceService(db)
    return service.record_batch(data)


@router.patch(
    "/{attendance_id}",
    response_model=AttendanceResponse,
)
def update_attendance(
    attendance_id: UUID,
    data: AttendanceUpdate,
    db: Session = Depends(get_db),
):
    service = AttendanceService(db)
    return service.update(attendance_id, data)


@router.delete(
    "/{attendance_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_attendance(
    attendance_id: UUID,
    db: Session = Depends(get_db),
):
    service = AttendanceService(db)
    service.delete(attendance_id)
