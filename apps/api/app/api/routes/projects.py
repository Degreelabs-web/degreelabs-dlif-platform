from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.project import (
    ProjectCreate,
    ProjectDetailResponse,
    ProjectUpdate,
)
from app.schemas.team import TeamResponse
from app.services.project import ProjectService
from app.services.team import TeamService

router = APIRouter(
    prefix="/projects",
)


@router.get(
    "",
    response_model=list[ProjectDetailResponse],
)
def get_projects(
    company_id: UUID | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    service = ProjectService(db)
    return service.get_all(
        company_id=company_id,
        status=status_filter,
        search=search,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{project_id}",
    response_model=ProjectDetailResponse,
)
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
):
    service = ProjectService(db)
    project = service.get_by_id(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return project


@router.post(
    "",
    response_model=ProjectDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
):
    service = ProjectService(db)
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
    "/{project_id}",
    response_model=ProjectDetailResponse,
)
def update_project(
    project_id: UUID,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
):
    service = ProjectService(db)
    try:
        project = service.update(project_id, data)
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

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return project


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
):
    service = ProjectService(db)
    try:
        deleted = service.delete(project_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )


@router.get(
    "/{project_id}/teams",
    response_model=list[TeamResponse],
)
def get_project_teams(
    project_id: UUID,
    db: Session = Depends(get_db),
):
    project_service = ProjectService(db)
    team_service = TeamService(db)
    try:
        teams = project_service.get_assigned_teams(project_id)
        return [team_service._build_team_response(t) for t in teams]
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
