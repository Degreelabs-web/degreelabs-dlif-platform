from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AttendanceRecordItem(BaseModel):
    student_id: UUID
    status: str = Field(default="present", max_length=50)
    joined_at: datetime | None = None
    left_at: datetime | None = None
    duration_minutes: int | None = Field(default=None, ge=0)


class AttendanceBatchCreate(BaseModel):
    session_id: UUID
    source: str = Field(default="manual", max_length=50)
    records: list[AttendanceRecordItem] = []


class AttendanceBase(BaseModel):
    session_id: UUID
    student_id: UUID
    joined_at: datetime | None = None
    left_at: datetime | None = None
    duration_minutes: int | None = Field(default=None, ge=0)
    status: str = Field(default="present", max_length=50)
    source: str | None = Field(default="manual", max_length=50)


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    joined_at: datetime | None = None
    left_at: datetime | None = None
    duration_minutes: int | None = Field(default=None, ge=0)
    status: str | None = Field(default=None, max_length=50)
    source: str | None = Field(default=None, max_length=50)


class AttendanceResponse(AttendanceBase):
    id: UUID
    created_at: datetime
    student_name: str | None = None
    student_email: str | None = None
    student_institutional_id: str | None = None

    model_config = ConfigDict(from_attributes=True)


class AttendanceBatchResponse(BaseModel):
    session_id: UUID
    records_count: int
    records: list[AttendanceResponse]
