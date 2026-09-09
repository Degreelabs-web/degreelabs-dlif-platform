from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models.recording import Recording
from app.db.models.transcript import Transcript
from app.db.repositories.recording import RecordingRepository
from app.db.repositories.session import SessionRepository
from app.schemas.recording import (
    RecordingCreate,
    RecordingResponse,
    RecordingUpdate,
    TranscriptCreate,
    TranscriptResponse,
)


class RecordingService:
    def __init__(self, db: Session):
        self.db = db
        self.recording_repo = RecordingRepository(db)
        self.session_repo = SessionRepository(db)

    def _build_response(self, recording: Recording) -> RecordingResponse:
        transcripts = self.recording_repo.get_transcripts_by_recording_id(
            recording.id
        )
        return RecordingResponse(
            id=recording.id,
            session_id=recording.session_id,
            provider=recording.provider,
            external_meeting_id=recording.external_meeting_id,
            external_file_id=recording.external_file_id,
            recording_url=recording.recording_url,
            started_at=recording.started_at,
            ended_at=recording.ended_at,
            created_at=recording.created_at,
            transcripts=[
                TranscriptResponse.model_validate(t) for t in transcripts
            ],
        )

    def get_by_session_id(self, session_id: UUID) -> list[RecordingResponse]:
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {session_id} not found",
            )
        recordings = self.recording_repo.get_by_session_id(session_id)
        return [self._build_response(r) for r in recordings]

    def get_by_id(self, recording_id: UUID) -> RecordingResponse | None:
        recording = self.recording_repo.get_by_id(recording_id)
        if not recording:
            return None
        return self._build_response(recording)

    def create(self, data: RecordingCreate) -> RecordingResponse:
        session = self.session_repo.get_by_id(data.session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {data.session_id} not found",
            )

        recording = Recording(
            session_id=data.session_id,
            provider=data.provider,
            external_meeting_id=data.external_meeting_id,
            external_file_id=data.external_file_id,
            recording_url=data.recording_url,
            started_at=data.started_at,
            ended_at=data.ended_at,
        )

        try:
            created = self.recording_repo.create(recording)
            return self._build_response(created)
        except IntegrityError as exc:
            self.recording_repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Database error while registering recording",
            ) from exc

    def update(
        self, recording_id: UUID, data: RecordingUpdate
    ) -> RecordingResponse:
        recording = self.recording_repo.get_by_id(recording_id)
        if not recording:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recording not found",
            )

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(recording, key, value)

        try:
            updated = self.recording_repo.update(recording)
            return self._build_response(updated)
        except IntegrityError as exc:
            self.recording_repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Database error while updating recording",
            ) from exc

    def delete(self, recording_id: UUID) -> None:
        recording = self.recording_repo.get_by_id(recording_id)
        if not recording:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recording not found",
            )
        self.recording_repo.delete(recording)

    # -----------------------------------------------------------------------
    # Transcript operations
    # -----------------------------------------------------------------------

    def add_transcript(
        self, recording_id: UUID, data: TranscriptCreate
    ) -> TranscriptResponse:
        recording = self.recording_repo.get_by_id(recording_id)
        if not recording:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recording not found",
            )

        transcript = Transcript(
            recording_id=recording_id,
            external_file_id=data.external_file_id,
            transcript_url=data.transcript_url,
        )

        try:
            created = self.recording_repo.create_transcript(transcript)
            return TranscriptResponse.model_validate(created)
        except IntegrityError as exc:
            self.recording_repo.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Database error while attaching transcript",
            ) from exc

    def delete_transcript(
        self, recording_id: UUID, transcript_id: UUID
    ) -> None:
        transcript = self.recording_repo.get_transcript_by_id(transcript_id)
        if not transcript or transcript.recording_id != recording_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transcript not found for this recording",
            )
        self.recording_repo.delete_transcript(transcript)
