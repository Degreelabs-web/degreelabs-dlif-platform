from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TeamMentorAssignmentBase(BaseModel):
    team_id: UUID
    mentor_id: UUID
    notes: str | None = None
    status: str = Field(default="active", max_length=50)


class TeamMentorAssignmentCreate(BaseModel):
    team_id: UUID
    mentor_id: UUID
    notes: str | None = None


class TeamMentorAssignmentUpdate(BaseModel):
    status: str | None = Field(default=None, max_length=50)
    notes: str | None = None
    unassigned_at: datetime | None = None


class TeamMentorAssignmentResponse(TeamMentorAssignmentBase):
    id: UUID
    assigned_at: datetime
    unassigned_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class TeamMentorAssignmentDetailResponse(TeamMentorAssignmentResponse):
    team_name: str | None = None
    mentor_name: str | None = None
    mentor_email: str | None = None
    mentor_company: str | None = None

    model_config = ConfigDict(from_attributes=True)
