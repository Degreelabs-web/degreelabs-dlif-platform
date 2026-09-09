from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.recording import (
    RecordingCreate,
    RecordingResponse,
    RecordingUpdate,
    TranscriptCreate,
    TranscriptResponse,
)
from app.services.recording import RecordingService


router = APIRouter(
    prefix="/recordings",
)


@router.get(
    "",
    response_model=list[RecordingResponse],
)
def get_recordings(
    session_id: UUID = Query(..., description="Filter by session ID"),
    db: Session = Depends(get_db),
):
    service = RecordingService(db)
    return service.get_by_session_id(session_id)


@router.get(
    "/{recording_id}",
    response_model=RecordingResponse,
)
def get_recording(
    recording_id: UUID,
    db: Session = Depends(get_db),
):
    service = RecordingService(db)
    recording = service.get_by_id(recording_id)
    if not recording:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recording not found",
        )
    return recording


@router.post(
    "",
    response_model=RecordingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_recording(
    data: RecordingCreate,
    db: Session = Depends(get_db),
):
    service = RecordingService(db)
    return service.create(data)


@router.patch(
    "/{recording_id}",
    response_model=RecordingResponse,
)
def update_recording(
    recording_id: UUID,
    data: RecordingUpdate,
    db: Session = Depends(get_db),
):
    service = RecordingService(db)
    return service.update(recording_id, data)


@router.delete(
    "/{recording_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_recording(
    recording_id: UUID,
    db: Session = Depends(get_db),
):
    service = RecordingService(db)
    service.delete(recording_id)


# ---------------------------------------------------------------------------
# Transcripts
# ---------------------------------------------------------------------------

@router.post(
    "/{recording_id}/transcripts",
    response_model=TranscriptResponse,
    status_code=status.HTTP_201_CREATED,
)
def attach_transcript(
    recording_id: UUID,
    data: TranscriptCreate,
    db: Session = Depends(get_db),
):
    service = RecordingService(db)
    return service.add_transcript(recording_id, data)


@router.delete(
    "/{recording_id}/transcripts/{transcript_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_transcript(
    recording_id: UUID,
    transcript_id: UUID,
    db: Session = Depends(get_db),
):
    service = RecordingService(db)
    service.delete_transcript(recording_id, transcript_id)
