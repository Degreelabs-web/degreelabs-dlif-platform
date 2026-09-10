from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl


class CompanyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    slug: str | None = Field(default=None, max_length=100)
    profile: str = Field(..., min_length=5)
    industry: str = Field(..., min_length=2, max_length=100)
    website: str | None = Field(default=None, max_length=2048)
    contact_email: EmailStr
    contact_name: str | None = Field(default=None, max_length=255)
    contact_phone: str | None = Field(default=None, max_length=30)
    logo_url: str | None = Field(default=None, max_length=2048)
    status: str = Field(default="active", max_length=50)


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    slug: str | None = Field(default=None, max_length=100)
    profile: str | None = Field(default=None, min_length=5)
    industry: str | None = Field(default=None, min_length=2, max_length=100)
    website: str | None = Field(default=None, max_length=2048)
    contact_email: EmailStr | None = None
    contact_name: str | None = Field(default=None, max_length=255)
    contact_phone: str | None = Field(default=None, max_length=30)
    logo_url: str | None = Field(default=None, max_length=2048)
    status: str | None = Field(default=None, max_length=50)


class CompanyResponse(CompanyBase):
    id: UUID
    slug: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CompanyDetailResponse(CompanyResponse):
    projects_count: int = 0

    model_config = ConfigDict(from_attributes=True)
