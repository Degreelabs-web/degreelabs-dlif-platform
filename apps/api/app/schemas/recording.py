from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Transcript Schemas
# ---------------------------------------------------------------------------

class TranscriptBase(BaseModel):
    external_file_id: str | None = Field(default=None, max_length=255)
    transcript_url: str | None = Field(default=None, max_length=2048)


class TranscriptCreate(TranscriptBase):
    pass


class TranscriptResponse(TranscriptBase):
    id: UUID
    recording_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Recording Schemas
# ---------------------------------------------------------------------------

class RecordingBase(BaseModel):
    session_id: UUID
    provider: str = Field(default="zoom", max_length=50)
    external_meeting_id: str | None = Field(default=None, max_length=255)
    external_file_id: str | None = Field(default=None, max_length=255)
    recording_url: str | None = Field(default=None, max_length=2048)
    started_at: datetime | None = None
    ended_at: datetime | None = None


class RecordingCreate(RecordingBase):
    pass


class RecordingUpdate(BaseModel):
    provider: str | None = Field(default=None, max_length=50)
    external_meeting_id: str | None = Field(default=None, max_length=255)
    external_file_id: str | None = Field(default=None, max_length=255)
    recording_url: str | None = Field(default=None, max_length=2048)
    started_at: datetime | None = None
    ended_at: datetime | None = None


class RecordingResponse(RecordingBase):
    id: UUID
    created_at: datetime
    transcripts: list[TranscriptResponse] = []

    model_config = ConfigDict(from_attributes=True)
