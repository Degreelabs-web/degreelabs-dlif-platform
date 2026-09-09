from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class InstitutionBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    code: str = Field(..., min_length=2, max_length=100)
    status: str = Field(default="active", max_length=50)


class InstitutionCreate(InstitutionBase):
    pass


class InstitutionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    code: str | None = Field(default=None, min_length=2, max_length=100)
    status: str | None = Field(default=None, max_length=50)


class InstitutionResponse(InstitutionBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)