from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class CohortBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    academic_year: str = Field(..., min_length=2, max_length=20)
    start_date: date
    end_date: date
    status: str = Field(default="draft", max_length=50)


class CohortCreate(CohortBase):
    institution_id: UUID

    @model_validator(mode="after")
    def validate_dates(self) -> "CohortCreate":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date.")
        return self


class CohortUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    academic_year: str | None = Field(default=None, min_length=2, max_length=20)
    start_date: date | None = None
    end_date: date | None = None
    status: str | None = Field(default=None, max_length=50)

    @model_validator(mode="after")
    def validate_dates(self) -> "CohortUpdate":
        if self.start_date is not None and self.end_date is not None:
            if self.end_date < self.start_date:
                raise ValueError("end_date must be on or after start_date.")
        return self


class CohortResponse(CohortBase):
    id: UUID
    institution_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
