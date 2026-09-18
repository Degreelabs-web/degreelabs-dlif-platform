from datetime import date, datetime, time
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class MentorSlotRequestCreate(BaseModel):
    preferred_date: date
    preferred_time_start: time
    preferred_time_end: time
    topic: str = Field(..., min_length=5, max_length=2000, description="Discussion agenda or focus questions")


class MentorSlotRequestUpdate(BaseModel):
    preferred_date: date | None = None
    preferred_time_start: time | None = None
    preferred_time_end: time | None = None
    topic: str | None = Field(default=None, min_length=5, max_length=2000)



class MentorSlotApprove(BaseModel):
    assigned_mentor_id: UUID
    confirmed_start_time: datetime
    confirmed_end_time: datetime
    admin_note: str | None = None


class MentorSlotDecline(BaseModel):
    admin_note: str = Field(..., min_length=3, description="Reason for declining the request")


class MentorSlotRequestResponse(BaseModel):
    id: UUID
    team_id: UUID
    team_name: str | None = None
    cohort_name: str | None = None
    requested_by_user_id: UUID
    requester_name: str | None = None
    requester_email: str | None = None
    preferred_date: date
    preferred_time_start: time
    preferred_time_end: time
    topic: str
    status: str
    assigned_mentor_id: UUID | None = None
    assigned_mentor_name: str | None = None
    confirmed_start_time: datetime | None = None
    confirmed_end_time: datetime | None = None
    meet_link: str | None = None
    google_event_id: str | None = None
    admin_note: str | None = None
    created_at: datetime
    responded_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
