from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


MentorStatus = Literal["pending", "active", "rejected", "inactive"]


class MentorBase(BaseModel):
    phone: str | None = Field(default=None, max_length=30)
    bio: str | None = None
    expertise: list[str] = Field(default_factory=list)
    years_of_experience: int | None = Field(default=None, ge=0)
    company_name: str | None = Field(default=None, max_length=255)
    designation: str | None = Field(default=None, max_length=255)
    organisation: str | None = Field(default=None, max_length=255)
    current_role: str | None = Field(default=None, max_length=255)
    location: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=255)
    country: str | None = Field(default=None, max_length=255)
    professional_headline: str | None = Field(default=None, max_length=500)
    linkedin_url: str | None = Field(default=None, max_length=2048)
    github_url: str | None = Field(default=None, max_length=2048)
    headshot_url: str | None = Field(default=None, max_length=2048)
    professional_headshot_url: str | None = Field(default=None, max_length=2048)
    industries: list[str] = Field(default_factory=list)
    support_preferences: list[str] = Field(default_factory=list)
    mentor_statement: str | None = None
    mentoring_statement: str | None = None
    status: MentorStatus = "active"


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
    organisation: str | None = Field(default=None, max_length=255)
    current_role: str | None = Field(default=None, max_length=255)
    location: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=255)
    country: str | None = Field(default=None, max_length=255)
    professional_headline: str | None = Field(default=None, max_length=500)
    linkedin_url: str | None = Field(default=None, max_length=2048)
    github_url: str | None = Field(default=None, max_length=2048)
    headshot_url: str | None = Field(default=None, max_length=2048)
    professional_headshot_url: str | None = Field(default=None, max_length=2048)
    industries: list[str] | None = None
    support_preferences: list[str] | None = None
    mentor_statement: str | None = None
    mentoring_statement: str | None = None
    status: MentorStatus | None = None


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
