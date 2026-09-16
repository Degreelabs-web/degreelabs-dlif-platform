from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class StudentProfileBase(BaseModel):
    institution_id: UUID
    student_id: str = Field(..., min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    course: str | None = Field(default=None, max_length=255)
    branch: str | None = Field(default=None, max_length=255)
    graduation_year: int | None = Field(default=None, ge=2000, le=2100)
    gender: str | None = Field(default=None, max_length=20)
    current_year_semester: str | None = Field(default=None, max_length=50)
    aadhaar_number: str | None = Field(default=None, max_length=20)
    pan_number: str | None = Field(default=None, max_length=20)
    photo_url: str | None = Field(default=None, max_length=1024)
    document_url: str | None = Field(default=None, max_length=1024)


class StudentProfileResponse(StudentProfileBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StudentCreate(StudentProfileBase):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)


class StudentUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    status: str | None = Field(default=None, max_length=50)
    student_id: str | None = Field(default=None, min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    course: str | None = Field(default=None, max_length=255)
    branch: str | None = Field(default=None, max_length=255)
    graduation_year: int | None = Field(default=None, ge=2000, le=2100)
    gender: str | None = Field(default=None, max_length=20)
    current_year_semester: str | None = Field(default=None, max_length=50)
    aadhaar_number: str | None = Field(default=None, max_length=20)
    pan_number: str | None = Field(default=None, max_length=20)
    photo_url: str | None = Field(default=None, max_length=1024)
    document_url: str | None = Field(default=None, max_length=1024)


class StudentBatchInfo(BaseModel):
    id: UUID
    cohort_id: UUID
    name: str
    status: str

    model_config = ConfigDict(from_attributes=True)


class StudentResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    status: str
    created_at: datetime
    updated_at: datetime
    profile: StudentProfileResponse | None = None
    batch: StudentBatchInfo | None = None

    model_config = ConfigDict(from_attributes=True)


class StudentProvisionRequest(StudentProfileBase):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    password: str | None = Field(
        default=None,
        min_length=6,
        max_length=128,
    )
