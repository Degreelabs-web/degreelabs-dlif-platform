from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Submission File Schemas
# ---------------------------------------------------------------------------

class SubmissionFileBase(BaseModel):
    file_name: str = Field(..., min_length=1, max_length=255)
    storage_path: str = Field(..., min_length=1, max_length=1024)
    mime_type: str | None = Field(default=None, max_length=255)
    file_size: int | None = Field(default=None, ge=0)


class SubmissionFileCreate(SubmissionFileBase):
    pass


class SubmissionFileResponse(SubmissionFileBase):
    id: UUID
    submission_version_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Submission Version Schemas
# ---------------------------------------------------------------------------

class SubmissionVersionCreate(BaseModel):
    content: str | None = None
    files: list[SubmissionFileCreate] = []


class SubmissionVersionResponse(BaseModel):
    id: UUID
    submission_id: UUID
    version_number: int
    content: str | None = None
    created_by: UUID
    created_at: datetime
    files: list[SubmissionFileResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Submission Schemas
# ---------------------------------------------------------------------------

class SubmissionBase(BaseModel):
    task_id: UUID
    team_id: UUID


class SubmissionCreate(SubmissionBase):
    submitted_by: UUID
    content: str | None = None
    status: str = Field(default="submitted", max_length=50)
    files: list[SubmissionFileCreate] = []


class SubmissionVersionSubmit(BaseModel):
    submitted_by: UUID
    content: str | None = None
    status: str = Field(default="submitted", max_length=50)
    files: list[SubmissionFileCreate] = []


class SubmissionStatusUpdate(BaseModel):
    status: str = Field(..., min_length=2, max_length=50)


class SubmissionResponse(SubmissionBase):
    id: UUID
    submitted_by: UUID
    status: str
    submitted_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    latest_version: SubmissionVersionResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class SubmissionDetailResponse(SubmissionResponse):
    versions: list[SubmissionVersionResponse] = []

    model_config = ConfigDict(from_attributes=True)
