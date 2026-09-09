from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class EnrollmentBase(BaseModel):
    cohort_id: UUID
    enrollment_status: str = Field(default="active", max_length=50)


class EnrollmentCreate(EnrollmentBase):
    user_id: UUID


class EnrollmentUpdate(BaseModel):
    enrollment_status: str | None = Field(default=None, max_length=50)
    completed_at: datetime | None = None


class EnrollmentResponse(EnrollmentBase):
    id: UUID
    user_id: UUID
    enrolled_at: datetime
    completed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
