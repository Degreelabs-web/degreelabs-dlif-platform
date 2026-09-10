from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ProjectBase(BaseModel):
    company_id: UUID
    title: str = Field(..., min_length=2, max_length=255)
    description: str = Field(..., min_length=10)
    objectives: str = Field(..., min_length=10)
    expected_deliverables: str = Field(..., min_length=10)
    start_date: date | None = None
    end_date: date | None = None
    status: str = Field(default="draft", max_length=50)
    difficulty: str = Field(default="intermediate", max_length=50)
    max_teams: int = Field(default=5, ge=1)

    @model_validator(mode="after")
    def validate_dates(self) -> "ProjectBase":
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date must be greater than or equal to start_date")
        return self


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    company_id: UUID | None = None
    title: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = Field(default=None, min_length=10)
    objectives: str | None = Field(default=None, min_length=10)
    expected_deliverables: str | None = Field(default=None, min_length=10)
    start_date: date | None = None
    end_date: date | None = None
    status: str | None = Field(default=None, max_length=50)
    difficulty: str | None = Field(default=None, max_length=50)
    max_teams: int | None = Field(default=None, ge=1)

    @model_validator(mode="after")
    def validate_dates(self) -> "ProjectUpdate":
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date must be greater than or equal to start_date")
        return self


class ProjectResponse(ProjectBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectDetailResponse(ProjectResponse):
    company_name: str | None = None
    company_logo_url: str | None = None
    company_industry: str | None = None
    assigned_teams_count: int = 0

    model_config = ConfigDict(from_attributes=True)
