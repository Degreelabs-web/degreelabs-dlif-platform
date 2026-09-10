from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.models.user import User
from app.db.session import get_db
from app.services.auth import get_current_user
from app.services.portal_experience import PortalExperienceService

router = APIRouter(
    prefix="/portal",
)


@router.get(
    "/student-context",
)
def get_student_context(
    user_id: UUID | None = Query(default=None, description="User ID of the student"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PortalExperienceService(db)
    target_id = user_id if (user_id and current_user.role == "admin") else current_user.id

    try:
        return service.get_student_portal_context(target_id)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get(
    "/mentor-context",
)
def get_mentor_context(
    user_id: UUID | None = Query(default=None, description="User ID of the mentor"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PortalExperienceService(db)
    target_id = user_id if (user_id and current_user.role == "admin") else current_user.id

    try:
        return service.get_mentor_portal_context(target_id)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
