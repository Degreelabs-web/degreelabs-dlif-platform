from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.team import (
    TeamCreate,
    TeamMemberCreate,
    TeamMemberResponse,
    TeamMemberUpdate,
    TeamResponse,
    TeamUpdate,
)
from app.services.team import TeamService


router = APIRouter(
    prefix="/teams",
)


@router.get(
    "",
    response_model=list[TeamResponse],
)
def get_teams(
    cohort_id: UUID | None = Query(
        default=None,
        description="Filter by cohort ID",
    ),
    status_filter: str | None = Query(
        default=None,
        alias="status",
        description="Filter by team status",
    ),
    db: Session = Depends(get_db),
):
    service = TeamService(db)
    return service.get_all(cohort_id=cohort_id, status=status_filter)


@router.get(
    "/{team_id}",
    response_model=TeamResponse,
)
def get_team(
    team_id: UUID,
    db: Session = Depends(get_db),
):
    service = TeamService(db)
    team = service.get_by_id(team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )
    return team


@router.post(
    "",
    response_model=TeamResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_team(
    data: TeamCreate,
    db: Session = Depends(get_db),
):
    service = TeamService(db)
    try:
        return service.create(data)
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


@router.patch(
    "/{team_id}",
    response_model=TeamResponse,
)
def update_team(
    team_id: UUID,
    data: TeamUpdate,
    db: Session = Depends(get_db),
):
    service = TeamService(db)
    try:
        team = service.update(team_id, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )
    return team


@router.delete(
    "/{team_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_team(
    team_id: UUID,
    db: Session = Depends(get_db),
):
    service = TeamService(db)
    try:
        deleted = service.delete(team_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )


@router.post(
    "/{team_id}/members",
    response_model=TeamMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_team_member(
    team_id: UUID,
    data: TeamMemberCreate,
    db: Session = Depends(get_db),
):
    service = TeamService(db)
    try:
        return service.add_member(team_id, data)
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


@router.patch(
    "/{team_id}/members/{student_id}",
    response_model=TeamMemberResponse,
)
def update_team_member(
    team_id: UUID,
    student_id: UUID,
    data: TeamMemberUpdate,
    db: Session = Depends(get_db),
):
    service = TeamService(db)
    try:
        member = service.update_member(team_id, student_id, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found",
        )
    return member


@router.delete(
    "/{team_id}/members/{student_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_team_member(
    team_id: UUID,
    student_id: UUID,
    db: Session = Depends(get_db),
):
    service = TeamService(db)
    try:
        removed = service.remove_member(team_id, student_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found",
        )
