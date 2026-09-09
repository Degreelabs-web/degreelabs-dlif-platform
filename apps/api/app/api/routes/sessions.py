from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.session import (
    DiscoverCurriculumGenerateRequest,
    DiscoverCurriculumGenerateResponse,
    SessionCreate,
    SessionDetailResponse,
    SessionResourceCreate,
    SessionResourceResponse,
    SessionResourceUpdate,
    SessionResponse,
    SessionTaskCreate,
    SessionTaskResponse,
    SessionTaskUpdate,
    SessionUpdate,
)
from app.services.session import SessionService


router = APIRouter(
    prefix="/sessions",
)


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=list[SessionResponse],
)
def get_sessions(
    cohort_id: UUID | None = Query(
        default=None, description="Filter by cohort ID"
    ),
    week_number: int | None = Query(
        default=None, description="Filter by week number (1-52)"
    ),
    status_filter: str | None = Query(
        default=None, alias="status", description="Filter by status"
    ),
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    return service.get_all(
        cohort_id=cohort_id,
        week_number=week_number,
        status=status_filter,
    )


@router.get(
    "/{session_id}",
    response_model=SessionDetailResponse,
)
def get_session(
    session_id: UUID,
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    session_obj = service.get_by_id(session_id)
    if not session_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )
    return session_obj


@router.post(
    "",
    response_model=SessionDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_session(
    data: SessionCreate,
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    return service.create(data)


@router.patch(
    "/{session_id}",
    response_model=SessionDetailResponse,
)
def update_session(
    session_id: UUID,
    data: SessionUpdate,
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    return service.update(session_id, data)


@router.delete(
    "/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_session(
    session_id: UUID,
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    service.delete(session_id)


# ---------------------------------------------------------------------------
# Discover Curriculum Generator
# ---------------------------------------------------------------------------

@router.post(
    "/cohorts/{cohort_id}/generate-discover",
    response_model=DiscoverCurriculumGenerateResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_discover_curriculum(
    cohort_id: UUID,
    request: DiscoverCurriculumGenerateRequest = DiscoverCurriculumGenerateRequest(),
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    return service.generate_discover_curriculum(cohort_id, request)


# ---------------------------------------------------------------------------
# Session Tasks
# ---------------------------------------------------------------------------

@router.get(
    "/{session_id}/tasks",
    response_model=list[SessionTaskResponse],
)
def get_session_tasks(
    session_id: UUID,
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    return service.get_tasks(session_id)


@router.post(
    "/{session_id}/tasks",
    response_model=SessionTaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_session_task(
    session_id: UUID,
    data: SessionTaskCreate,
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    return service.add_task(session_id, data)


@router.patch(
    "/{session_id}/tasks/{task_id}",
    response_model=SessionTaskResponse,
)
def update_session_task(
    session_id: UUID,
    task_id: UUID,
    data: SessionTaskUpdate,
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    return service.update_task(session_id, task_id, data)


@router.delete(
    "/{session_id}/tasks/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_session_task(
    session_id: UUID,
    task_id: UUID,
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    service.delete_task(session_id, task_id)


# ---------------------------------------------------------------------------
# Session Resources
# ---------------------------------------------------------------------------

@router.get(
    "/{session_id}/resources",
    response_model=list[SessionResourceResponse],
)
def get_session_resources(
    session_id: UUID,
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    return service.get_resources(session_id)


@router.post(
    "/{session_id}/resources",
    response_model=SessionResourceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_session_resource(
    session_id: UUID,
    data: SessionResourceCreate,
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    return service.add_resource(session_id, data)


@router.patch(
    "/{session_id}/resources/{resource_id}",
    response_model=SessionResourceResponse,
)
def update_session_resource(
    session_id: UUID,
    resource_id: UUID,
    data: SessionResourceUpdate,
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    return service.update_resource(session_id, resource_id, data)


@router.delete(
    "/{session_id}/resources/{resource_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_session_resource(
    session_id: UUID,
    resource_id: UUID,
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    service.delete_resource(session_id, resource_id)
