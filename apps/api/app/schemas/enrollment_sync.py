from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.schemas.mentor import MentorStatus


class StudentEnrollmentRow(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    student_id: str = Field(min_length=1, max_length=100)
    institution: str = Field(min_length=1, max_length=255)
    course: str | None = Field(default=None, max_length=255)
    branch: str | None = Field(default=None, max_length=255)
    graduation_year: int | None = Field(default=None, ge=2000, le=2100)
    status: str = Field(default="active", max_length=50)
    phone: str | None = Field(default=None, max_length=30)

    @field_validator("full_name", "student_id", "institution")
    @classmethod
    def normalize_required_text(cls, value: str) -> str:
        return " ".join(value.strip().split())

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class MentorEnrollmentRow(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=30)
    company_name: str | None = Field(default=None, max_length=255)
    designation: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=255)
    country: str | None = Field(default=None, max_length=255)
    location: str | None = Field(default=None, max_length=255)
    professional_headline: str | None = Field(default=None, max_length=500)
    linkedin_url: str | None = Field(default=None, max_length=2048)
    bio: str | None = None
    headshot_url: str | None = Field(default=None, max_length=2048)
    expertise: list[str] = Field(default_factory=list)
    industries: list[str] = Field(default_factory=list)
    status: MentorStatus | None = None
    years_of_experience: int | None = Field(default=None, ge=0)
    support_preferences: list[str] = Field(default_factory=list)
    mentor_statement: str | None = None

    @field_validator("full_name")
    @classmethod
    def normalize_full_name(cls, value: str) -> str:
        return " ".join(value.strip().split())

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class EnrollmentSyncRunResponse(BaseModel):
    id: UUID
    trigger: str
    source_type: str
    status: str
    started_at: datetime
    completed_at: datetime | None = None
    rows_processed: int
    students_created: int
    students_updated: int
    mentors_created: int
    mentors_updated: int
    rows_skipped: int
    validation_errors: list[dict]
    last_error: str | None = None

    model_config = ConfigDict(from_attributes=True)


class EnrollmentSyncStatusResponse(BaseModel):
    enabled: bool
    connected: bool
    upload_enabled: bool
    source_type: str
    enrolled_students: int
    enrolled_mentors: int
    latest_run: EnrollmentSyncRunResponse | None = None


class EnrollmentSyncTriggerResponse(BaseModel):
    accepted: bool
    message: str
