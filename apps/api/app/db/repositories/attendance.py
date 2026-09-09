from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.attendance import Attendance


class AttendanceRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, attendance_id: UUID) -> Attendance | None:
        statement = select(Attendance).where(Attendance.id == attendance_id)
        return self.db.scalar(statement)

    def get_by_session_and_student(
        self, session_id: UUID, student_id: UUID
    ) -> Attendance | None:
        statement = select(Attendance).where(
            Attendance.session_id == session_id,
            Attendance.student_id == student_id,
        )
        return self.db.scalar(statement)

    def get_all(
        self,
        session_id: UUID | None = None,
        student_id: UUID | None = None,
        status: str | None = None,
    ) -> list[Attendance]:
        statement = select(Attendance).order_by(Attendance.created_at.desc())

        if session_id is not None:
            statement = statement.where(Attendance.session_id == session_id)
        if student_id is not None:
            statement = statement.where(Attendance.student_id == student_id)
        if status is not None:
            statement = statement.where(Attendance.status == status)

        return list(self.db.scalars(statement).all())

    def create(self, attendance: Attendance) -> Attendance:
        self.db.add(attendance)
        self.db.commit()
        self.db.refresh(attendance)
        return attendance

    def update(self, attendance: Attendance) -> Attendance:
        self.db.commit()
        self.db.refresh(attendance)
        return attendance

    def delete(self, attendance: Attendance) -> None:
        self.db.delete(attendance)
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
