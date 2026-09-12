from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.rbac import require_admin
from app.db.session import get_db
from app.db.models.mentor import Mentor
from app.db.models.user import User
from app.schemas.mentor import (
    MentorCreate,
    MentorCategory,
    MentorDetailResponse,
    MentorStatus,
    MentorUpdate,
)
from app.services.mentor import MentorService
from app.services.supabase_admin import SupabaseAdminError, SupabaseAdminService
from app.services.email_delivery import EmailDeliveryError, EmailDeliveryService
from app.core.config import settings
from datetime import datetime, timezone

router = APIRouter(
    prefix="/mentors",
    dependencies=[Depends(require_admin)],
)


@router.get(
    "",
    response_model=list[MentorDetailResponse],
)
def get_mentors(
    status_filter: MentorStatus | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None),
    organisation: str | None = Query(default=None),
    industry: str | None = Query(default=None),
    expertise: str | None = Query(default=None),
    country: str | None = Query(default=None),
    mentor_category: MentorCategory | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    service = MentorService(db)
    return service.get_all(
        status=status_filter,
        search=search,
        skip=skip,
        limit=limit,
        organisation=organisation,
        industry=industry,
        expertise=expertise,
        country=country,
        mentor_category=mentor_category,
    )


@router.get(
    "/{mentor_id}",
    response_model=MentorDetailResponse,
)
def get_mentor(
    mentor_id: UUID,
    db: Session = Depends(get_db),
):
    service = MentorService(db)
    mentor = service.get_by_id(mentor_id)
    if not mentor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor not found",
        )
    return mentor


@router.post(
    "",
    response_model=MentorDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_mentor(
    data: MentorCreate,
    db: Session = Depends(get_db),
):
    service = MentorService(db)
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
    "/{mentor_id}",
    response_model=MentorDetailResponse,
)
def update_mentor(
    mentor_id: UUID,
    data: MentorUpdate,
    db: Session = Depends(get_db),
):
    service = MentorService(db)
    try:
        mentor = service.update(mentor_id, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not mentor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor not found",
        )
    return mentor


@router.post("/{mentor_id}/resend-password-setup", response_model=MentorDetailResponse)
def resend_password_setup(
    mentor_id: UUID,
    db: Session = Depends(get_db),
):
    """Admin-only retry for a pending mentor whose setup mail was not delivered."""
    mentor = db.get(Mentor, mentor_id)
    if mentor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mentor not found")
    if mentor.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Password setup can only be sent to a pending mentor.",
        )
    user = db.get(User, mentor.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Mentor user not found")
    try:
        setup_link = SupabaseAdminService().generate_password_setup_link(
            email=user.email,
            redirect_to=settings.mentor_password_setup_redirect_url,
        )
        EmailDeliveryService(settings).send_password_setup_link(
            user.email,
            user.full_name,
            setup_link,
        )
    except (RuntimeError, SupabaseAdminError, EmailDeliveryError) as exc:
        mentor.password_setup_status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Password setup email could not be sent. Please retry after resolving email delivery.",
        ) from exc
    mentor.password_setup_status = "sent"
    mentor.password_setup_sent_at = datetime.now(timezone.utc)
    db.commit()
    return MentorService(db).get_by_id(mentor_id)


@router.delete(
    "/{mentor_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_mentor(
    mentor_id: UUID,
    db: Session = Depends(get_db),
):
    service = MentorService(db)
    try:
        deleted = service.delete(mentor_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor not found",
        )
