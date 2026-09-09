from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FeedbackBase(BaseModel):
    feedback_text: str = Field(..., min_length=2)
    score: int | None = Field(default=None, ge=0, le=100)


class FeedbackCreate(FeedbackBase):
    submission_id: UUID
    reviewer_id: UUID


class FeedbackUpdate(BaseModel):
    feedback_text: str | None = Field(default=None, min_length=2)
    score: int | None = Field(default=None, ge=0, le=100)


class FeedbackResponse(FeedbackBase):
    id: UUID
    submission_id: UUID
    reviewer_id: UUID
    reviewer_name: str | None = None
    reviewer_role: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
