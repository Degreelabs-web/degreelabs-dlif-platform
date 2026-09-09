from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ChallengeBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    company_name: str = Field(..., min_length=2, max_length=255)
    description: str = Field(..., min_length=5)
    problem_statement: str = Field(..., min_length=5)
    expected_outcome: str | None = None
    difficulty: str = Field(default="standard", max_length=50)
    status: str = Field(default="draft", max_length=50)


class ChallengeCreate(ChallengeBase):
    pass


class ChallengeUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=255)
    company_name: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = Field(default=None, min_length=5)
    problem_statement: str | None = Field(default=None, min_length=5)
    expected_outcome: str | None = None
    difficulty: str | None = Field(default=None, max_length=50)
    status: str | None = Field(default=None, max_length=50)


class ChallengeResponse(ChallengeBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
