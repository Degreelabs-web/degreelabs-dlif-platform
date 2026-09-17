from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


# ---------------------------------------------------------------------------
# Session Task Schemas
# ---------------------------------------------------------------------------

class SessionTaskBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: str | None = None
    task_type: str = Field(default="activity", max_length=50)
    required: bool = True
    due_at: datetime | None = None


class SessionTaskCreate(SessionTaskBase):
    pass


class SessionTaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = None
    task_type: str | None = Field(default=None, max_length=50)
    required: bool | None = None
    due_at: datetime | None = None


class SessionTaskResponse(SessionTaskBase):
    id: UUID
    session_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Session Resource Schemas
# ---------------------------------------------------------------------------

class SessionResourceBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    resource_type: str = Field(default="guide", max_length=50)
    storage_path: str | None = Field(default=None, max_length=1024)
    external_url: str | None = Field(default=None, max_length=2048)


class SessionResourceCreate(SessionResourceBase):
    pass


class SessionResourceUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=255)
    resource_type: str | None = Field(default=None, max_length=50)
    storage_path: str | None = Field(default=None, max_length=1024)
    external_url: str | None = Field(default=None, max_length=2048)


class SessionResourceResponse(SessionResourceBase):
    id: UUID
    session_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Session Schemas
# ---------------------------------------------------------------------------

class SessionBase(BaseModel):
    cohort_id: UUID
    week_number: int = Field(..., ge=1, le=52)
    session_number: int = Field(..., ge=1, le=100)
    title: str = Field(..., min_length=2, max_length=255)
    description: str | None = None
    agenda: str | None = None
    session_type: str = Field(default="workshop", max_length=50)
    facilitator_name: str | None = Field(default=None, max_length=255)
    scheduled_at: datetime | None = None
    duration_minutes: int | None = Field(default=None, ge=1, le=1440)
    status: str = Field(default="draft", max_length=50)
    meeting_url: str | None = Field(default=None, max_length=2048)
    join_available_from: datetime | None = None
    join_available_until: datetime | None = None
    recording_url: str | None = Field(default=None, max_length=2048)
    # Google Meet
    meet_status: str = Field(default="not_scheduled", max_length=50)
    meet_link: str | None = Field(default=None, max_length=2048)
    google_event_id: str | None = Field(default=None, max_length=255)

    @model_validator(mode="after")
    def validate_join_window(self):
        if self.join_available_from and self.join_available_until and self.join_available_from >= self.join_available_until:
            raise ValueError("join_available_until must be later than join_available_from")
        return self


class SessionCreate(SessionBase):
    pass


class SessionUpdate(BaseModel):
    week_number: int | None = Field(default=None, ge=1, le=52)
    session_number: int | None = Field(default=None, ge=1, le=100)
    title: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = None
    agenda: str | None = None
    session_type: str | None = Field(default=None, max_length=50)
    facilitator_name: str | None = Field(default=None, max_length=255)
    scheduled_at: datetime | None = None
    duration_minutes: int | None = Field(default=None, ge=1, le=1440)
    status: str | None = Field(default=None, max_length=50)
    meeting_url: str | None = Field(default=None, max_length=2048)
    join_available_from: datetime | None = None
    join_available_until: datetime | None = None
    recording_url: str | None = Field(default=None, max_length=2048)
    meet_status: str | None = Field(default=None, max_length=50)
    meet_link: str | None = Field(default=None, max_length=2048)
    google_event_id: str | None = Field(default=None, max_length=255)

    @model_validator(mode="after")
    def validate_join_window(self):
        if self.join_available_from and self.join_available_until and self.join_available_from >= self.join_available_until:
            raise ValueError("join_available_until must be later than join_available_from")
        return self


class SessionResponse(SessionBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    published_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class SessionDetailResponse(SessionResponse):
    tasks: list[SessionTaskResponse] = []
    resources: list[SessionResourceResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Discover Curriculum Generator Schemas
# ---------------------------------------------------------------------------

class DiscoverCurriculumGenerateRequest(BaseModel):
    start_date: datetime | None = None
    session_duration_minutes: int = Field(default=90, ge=15, le=480)
    default_meeting_url: str | None = Field(default=None, max_length=2048)


class DiscoverCurriculumGenerateResponse(BaseModel):
    cohort_id: UUID
    sessions_count: int
    sessions: list[SessionDetailResponse]
