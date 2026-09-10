from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class StudentCohortAssignmentBase(BaseModel):
    student_id: UUID
    cohort_id: UUID
    status: str = Field(default="active", max_length=50)


class StudentCohortAssignmentCreate(BaseModel):
    student_id: UUID
    cohort_id: UUID


class StudentCohortAssignmentUpdate(BaseModel):
    status: str | None = Field(default=None, max_length=50)
    completed_at: datetime | None = None


class StudentCohortAssignmentResponse(StudentCohortAssignmentBase):
    id: UUID
    assigned_at: datetime
    completed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class StudentCohortAssignmentDetailResponse(StudentCohortAssignmentResponse):
    student_name: str | None = None
    student_email: str | None = None
    cohort_name: str | None = None
    institution_name: str | None = None

    model_config = ConfigDict(from_attributes=True)
