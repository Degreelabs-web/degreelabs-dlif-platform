from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic import field_validator


class StudentProfileBase(BaseModel):
    institution_id: UUID
    student_id: str = Field(..., min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    course: str | None = Field(default=None, max_length=255)
    branch: str | None = Field(default=None, max_length=255)
    graduation_year: int | None = Field(default=None, ge=2000, le=2100)


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


class StudentResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    status: str
    created_at: datetime
    updated_at: datetime
    profile: StudentProfileResponse | None = None

    model_config = ConfigDict(from_attributes=True)

class StudentProvisionRequest(StudentProfileBase):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    password: str | None = Field(
        default=None,
        min_length=8,
        max_length=128,
    )
