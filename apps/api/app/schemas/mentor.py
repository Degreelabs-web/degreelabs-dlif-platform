from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class MentorBase(BaseModel):
    phone: str | None = Field(default=None, max_length=30)
    bio: str | None = None
    expertise: list[str] = Field(default_factory=list)
    years_of_experience: int | None = Field(default=None, ge=0)
    company_name: str | None = Field(default=None, max_length=255)
    designation: str | None = Field(default=None, max_length=255)
    linkedin_url: str | None = Field(default=None, max_length=2048)
    github_url: str | None = Field(default=None, max_length=2048)
    status: str = Field(default="active", max_length=50)


class MentorCreate(MentorBase):
    user_id: UUID | None = None
    # For provisioning a new user account alongside the mentor profile:
    email: EmailStr | None = None
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    password: str | None = Field(default=None, min_length=6)


class MentorUpdate(BaseModel):
    phone: str | None = Field(default=None, max_length=30)
    bio: str | None = None
    expertise: list[str] | None = None
    years_of_experience: int | None = Field(default=None, ge=0)
    company_name: str | None = Field(default=None, max_length=255)
    designation: str | None = Field(default=None, max_length=255)
    linkedin_url: str | None = Field(default=None, max_length=2048)
    github_url: str | None = Field(default=None, max_length=2048)
    status: str | None = Field(default=None, max_length=50)


class MentorResponse(MentorBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MentorDetailResponse(MentorResponse):
    full_name: str | None = None
    email: str | None = None
    assigned_teams_count: int = 0

    model_config = ConfigDict(from_attributes=True)
