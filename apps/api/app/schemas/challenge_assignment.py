from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ChallengeAssignmentBase(BaseModel):
    challenge_id: UUID
    team_id: UUID
    status: str = Field(default="active", max_length=50)


class ChallengeAssignmentCreate(ChallengeAssignmentBase):
    pass


class ChallengeAssignmentUpdate(BaseModel):
    status: str | None = Field(default=None, max_length=50)


class ChallengeAssignmentResponse(ChallengeAssignmentBase):
    id: UUID
    assigned_at: datetime

    model_config = ConfigDict(from_attributes=True)
