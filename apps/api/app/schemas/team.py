from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TeamMemberBase(BaseModel):
    student_id: UUID
    role: str = Field(default="member", max_length=50)


class TeamMemberCreate(TeamMemberBase):
    pass


class TeamMemberUpdate(BaseModel):
    role: str | None = Field(default=None, max_length=50)


class TeamMemberResponse(TeamMemberBase):
    id: UUID
    team_id: UUID
    joined_at: datetime
    left_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class TeamBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    cohort_id: UUID
    status: str = Field(default="active", max_length=50)


class TeamCreate(TeamBase):
    member_student_ids: list[UUID] = []
    leader_student_id: UUID | None = None


class TeamUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    status: str | None = Field(default=None, max_length=50)


class TeamResponse(TeamBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    members: list[TeamMemberResponse] = []

    model_config = ConfigDict(from_attributes=True)
