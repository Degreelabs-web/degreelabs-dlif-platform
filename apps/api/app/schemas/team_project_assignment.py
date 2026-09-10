from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TeamProjectAssignmentBase(BaseModel):
    team_id: UUID
    project_id: UUID
    company_id: UUID
    notes: str | None = None
    status: str = Field(default="active", max_length=50)


class TeamProjectAssignmentCreate(BaseModel):
    team_id: UUID
    project_id: UUID
    notes: str | None = None


class TeamProjectAssignmentUpdate(BaseModel):
    status: str | None = Field(default=None, max_length=50)
    notes: str | None = None
    completed_at: datetime | None = None


class TeamProjectAssignmentResponse(TeamProjectAssignmentBase):
    id: UUID
    assigned_at: datetime
    completed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class TeamProjectAssignmentDetailResponse(TeamProjectAssignmentResponse):
    team_name: str | None = None
    project_title: str | None = None
    company_name: str | None = None
    company_logo_url: str | None = None

    model_config = ConfigDict(from_attributes=True)
