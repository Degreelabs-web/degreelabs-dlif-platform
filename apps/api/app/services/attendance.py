from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.attendance import Attendance
from app.db.models.student_profile import StudentProfile
from app.db.models.user import User
from app.db.repositories.attendance import AttendanceRepository
from app.db.repositories.session import SessionRepository
from app.schemas.attendance import (
    AttendanceBatchCreate,
    AttendanceBatchResponse,
    AttendanceCreate,
    AttendanceResponse,
    AttendanceUpdate,
)


class AttendanceService:
    def __init__(self, db: Session):
        self.db = db
        self.attendance_repo = AttendanceRepository(db)
        self.session_repo = SessionRepository(db)

    def _build_response(self, attendance: Attendance) -> AttendanceResponse:
        statement = (
            select(User, StudentProfile)
            .join(StudentProfile, User.id == StudentProfile.user_id)
            .where(StudentProfile.id == attendance.student_id)
        )
        row = self.db.execute(statement).first()
        user = row[0] if row else None
        profile = row[1] if row else None

        return AttendanceResponse(
            id=attendance.id,
            session_id=attendance.session_id,
            student_id=attendance.student_id,
            joined_at=attendance.joined_at,
            left_at=attendance.left_at,
            duration_minutes=attendance.duration_minutes,
            status=attendance.status,
            source=attendance.source,
            created_at=attendance.created_at,
            student_name=user.full_name if user else None,
            student_email=user.email if user else None,
            student_institutional_id=profile.student_id if profile else None,
        )

    def get_all(
        self,
        session_id: UUID | None = None,
        student_id: UUID | None = None,
        status: str | None = None,
    ) -> list[AttendanceResponse]:
        records = self.attendance_repo.get_all(
            session_id=session_id,
            student_id=student_id,
            status=status,
        )
        return [self._build_response(r) for r in records]

    def get_by_id(self, attendance_id: UUID) -> AttendanceResponse | None:
        rec = self.attendance_repo.get_by_id(attendance_id)
        if not rec:
            return None
        return self._build_response(rec)

    def record_attendance(self, data: AttendanceCreate) -> AttendanceResponse:
        session = self.session_repo.get_by_id(data.session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {data.session_id} not found",
            )

        student_prof = self.db.scalar(
            select(StudentProfile).where(StudentProfile.id == data.student_id)
        )
        if not student_prof:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student profile {data.student_id} not found",
            )

        existing = self.attendance_repo.get_by_session_and_student(
            session_id=data.session_id,
            student_id=data.student_id,
        )

        if existing:
            existing.status = data.status
            existing.joined_at = data.joined_at
            existing.left_at = data.left_at
            existing.duration_minutes = data.duration_minutes
            existing.source = data.source
            try:
                updated = self.attendance_repo.update(existing)
                return self._build_response(updated)
            except IntegrityError as exc:
                self.attendance_repo.rollback()
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Database error while updating attendance",
                ) from exc

        attendance = Attendance(
            session_id=data.session_id,
            student_id=data.student_id,
            joined_at=data.joined_at,
            left_at=data.left_at,
            duration_minutes=data.duration_minutes,
            status=data.status,
            source=data.source,
        )

        try:
            created = self.attendance_repo.create(attendance)
            return self._build_response(created)
        except IntegrityError as exc:
            self.attendance_repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Database error while creating attendance",
            ) from exc

    def record_batch(
        self, data: AttendanceBatchCreate
    ) -> AttendanceBatchResponse:
        session = self.session_repo.get_by_id(data.session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {data.session_id} not found",
            )

        responses: list[AttendanceResponse] = []
        for item in data.records:
            student_prof = self.db.scalar(
                select(StudentProfile).where(
                    StudentProfile.id == item.student_id
                )
            )
            if not student_prof:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Student profile {item.student_id} not found",
                )

            existing = self.attendance_repo.get_by_session_and_student(
                session_id=data.session_id,
                student_id=item.student_id,
            )

            if existing:
                existing.status = item.status
                existing.joined_at = item.joined_at
                existing.left_at = item.left_at
                existing.duration_minutes = item.duration_minutes
                existing.source = data.source
                updated = self.attendance_repo.update(existing)
                responses.append(self._build_response(updated))
            else:
                att = Attendance(
                    session_id=data.session_id,
                    student_id=item.student_id,
                    joined_at=item.joined_at,
                    left_at=item.left_at,
                    duration_minutes=item.duration_minutes,
                    status=item.status,
                    source=data.source,
                )
                created = self.attendance_repo.create(att)
                responses.append(self._build_response(created))

        return AttendanceBatchResponse(
            session_id=data.session_id,
            records_count=len(responses),
            records=responses,
        )

    def update(
        self, attendance_id: UUID, data: AttendanceUpdate
    ) -> AttendanceResponse:
        rec = self.attendance_repo.get_by_id(attendance_id)
        if not rec:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance record not found",
            )

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(rec, key, value)

        try:
            updated = self.attendance_repo.update(rec)
            return self._build_response(updated)
        except IntegrityError as exc:
            self.attendance_repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Database error while updating attendance",
            ) from exc

    def delete(self, attendance_id: UUID) -> None:
        rec = self.attendance_repo.get_by_id(attendance_id)
        if not rec:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance record not found",
            )
        self.attendance_repo.delete(rec)
