from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.team_mentor_assignment import (
    TeamMentorAssignmentCreate,
    TeamMentorAssignmentDetailResponse,
)
from app.schemas.team_project_assignment import (
    TeamProjectAssignmentCreate,
    TeamProjectAssignmentDetailResponse,
)
from app.services.team_assignment import TeamAssignmentService

router = APIRouter(
    prefix="/team-assignments",
)


# ==================== Team Mentor Assignments ====================


@router.get(
    "/mentors",
    response_model=list[TeamMentorAssignmentDetailResponse],
)
def get_mentor_assignments(
    team_id: UUID | None = Query(default=None),
    mentor_id: UUID | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
):
    service = TeamAssignmentService(db)
    return service.get_mentor_assignments(
        team_id=team_id,
        mentor_id=mentor_id,
        status=status_filter,
    )


@router.post(
    "/mentors",
    response_model=TeamMentorAssignmentDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_mentor_to_team(
    data: TeamMentorAssignmentCreate,
    db: Session = Depends(get_db),
):
    service = TeamAssignmentService(db)
    try:
        return service.assign_mentor(data)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.delete(
    "/mentors/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def unassign_mentor_from_team(
    assignment_id: UUID,
    db: Session = Depends(get_db),
):
    service = TeamAssignmentService(db)
    success = service.unassign_mentor(assignment_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )


# ==================== Team Project Assignments ====================


@router.get(
    "/projects",
    response_model=list[TeamProjectAssignmentDetailResponse],
)
def get_project_assignments(
    team_id: UUID | None = Query(default=None),
    project_id: UUID | None = Query(default=None),
    company_id: UUID | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
):
    service = TeamAssignmentService(db)
    return service.get_project_assignments(
        team_id=team_id,
        project_id=project_id,
        company_id=company_id,
        status=status_filter,
    )


@router.post(
    "/projects",
    response_model=TeamProjectAssignmentDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_project_to_team(
    data: TeamProjectAssignmentCreate,
    db: Session = Depends(get_db),
):
    service = TeamAssignmentService(db)
    try:
        return service.assign_project(data)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.delete(
    "/projects/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def unassign_project_from_team(
    assignment_id: UUID,
    db: Session = Depends(get_db),
):
    service = TeamAssignmentService(db)
    success = service.unassign_project(assignment_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )
