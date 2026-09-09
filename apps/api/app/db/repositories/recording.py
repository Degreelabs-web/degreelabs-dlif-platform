from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.recording import Recording
from app.db.models.transcript import Transcript


class RecordingRepository:
    def __init__(self, db: Session):
        self.db = db

    # -----------------------------------------------------------------------
    # Recording operations
    # -----------------------------------------------------------------------

    def get_by_id(self, recording_id: UUID) -> Recording | None:
        statement = select(Recording).where(Recording.id == recording_id)
        return self.db.scalar(statement)

    def get_by_session_id(self, session_id: UUID) -> list[Recording]:
        statement = (
            select(Recording)
            .where(Recording.session_id == session_id)
            .order_by(Recording.started_at.desc(), Recording.created_at.desc())
        )
        return list(self.db.scalars(statement).all())

    def create(self, recording: Recording) -> Recording:
        self.db.add(recording)
        self.db.commit()
        self.db.refresh(recording)
        return recording

    def update(self, recording: Recording) -> Recording:
        self.db.commit()
        self.db.refresh(recording)
        return recording

    def delete(self, recording: Recording) -> None:
        self.db.delete(recording)
        self.db.commit()

    # -----------------------------------------------------------------------
    # Transcript operations
    # -----------------------------------------------------------------------

    def get_transcripts_by_recording_id(
        self, recording_id: UUID
    ) -> list[Transcript]:
        statement = (
            select(Transcript)
            .where(Transcript.recording_id == recording_id)
            .order_by(Transcript.created_at.asc())
        )
        return list(self.db.scalars(statement).all())

    def get_transcript_by_id(self, transcript_id: UUID) -> Transcript | None:
        statement = select(Transcript).where(Transcript.id == transcript_id)
        return self.db.scalar(statement)

    def create_transcript(self, transcript: Transcript) -> Transcript:
        self.db.add(transcript)
        self.db.commit()
        self.db.refresh(transcript)
        return transcript

    def delete_transcript(self, transcript: Transcript) -> None:
        self.db.delete(transcript)
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
