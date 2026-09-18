from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rbac import require_admin
from app.db.models.cohort import Cohort
from app.db.models.mentor import Mentor
from app.db.models.mentor_slot_request import MentorSlotRequest
from app.db.models.student_profile import StudentProfile
from app.db.models.team import Team
from app.db.models.team_member import TeamMember
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.mentor_slot_request import (
    MentorSlotApprove,
    MentorSlotDecline,
    MentorSlotRequestCreate,
    MentorSlotRequestUpdate,
    MentorSlotRequestResponse,
)
from app.services.auth import get_current_user
from app.services.email_delivery import EmailDeliveryService
from app.services import google_meet

router = APIRouter(tags=["mentor-slot-requests"])


def _enrich_slot_response(req: MentorSlotRequest, db: Session) -> MentorSlotRequestResponse:
    team = db.scalar(select(Team).where(Team.id == req.team_id))
    cohort = db.scalar(select(Cohort).where(Cohort.id == team.cohort_id)) if team else None
    requester = db.scalar(select(User).where(User.id == req.requested_by_user_id))

    assigned_mentor_name = None
    if req.assigned_mentor_id:
        mentor = db.scalar(select(Mentor).where(Mentor.id == req.assigned_mentor_id))
        if mentor:
            mentor_user = db.scalar(select(User).where(User.id == mentor.user_id))
            assigned_mentor_name = mentor_user.full_name if mentor_user else "Mentor"

    return MentorSlotRequestResponse(
        id=req.id,
        team_id=req.team_id,
        team_name=team.name if team else "Team",
        cohort_name=cohort.name if cohort else None,
        requested_by_user_id=req.requested_by_user_id,
        requester_name=requester.full_name if requester else "Fellow Lead",
        requester_email=requester.email if requester else None,
        preferred_date=req.preferred_date,
        preferred_time_start=req.preferred_time_start,
        preferred_time_end=req.preferred_time_end,
        topic=req.topic,
        status=req.status,
        assigned_mentor_id=req.assigned_mentor_id,
        assigned_mentor_name=assigned_mentor_name,
        confirmed_start_time=req.confirmed_start_time,
        confirmed_end_time=req.confirmed_end_time,
        meet_link=req.meet_link,
        google_event_id=req.google_event_id,
        admin_note=req.admin_note,
        created_at=req.created_at,
        responded_at=req.responded_at,
    )


@router.post(
    "/teams/{team_id}/mentor-slot-requests",
    response_model=MentorSlotRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_mentor_slot_request(
    team_id: UUID,
    payload: MentorSlotRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    team = db.scalar(select(Team).where(Team.id == team_id))
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found.")

    # 1. Authorization: Only the team lead (or admin) can request a slot
    is_lead = False
    if current_user.role == "admin":
        is_lead = True
    else:
        student_profile = db.scalar(
            select(StudentProfile).where(StudentProfile.user_id == current_user.id)
        )
        if not student_profile:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have an active student profile.",
            )

        membership = db.scalar(
            select(TeamMember).where(
                TeamMember.team_id == team_id,
                TeamMember.student_id == student_profile.id,
                TeamMember.left_at.is_(None),
            )
        )
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not an active member of this team.",
            )

        is_lead = (
            membership.is_team_lead
            or (membership.role and membership.role.lower() in ["fellow lead", "lead", "team_lead", "leader"])
        )

    if not is_lead:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the designated Team Lead (Fellow Lead) can request a mentor slot.",
        )

    # 2. Prevent duplicate pending requests
    existing_pending = db.scalar(
        select(MentorSlotRequest).where(
            MentorSlotRequest.team_id == team_id,
            MentorSlotRequest.status == "pending",
        )
    )
    if existing_pending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A mentor slot request is already pending review for this team.",
        )

    # 3. Create request record
    slot_req = MentorSlotRequest(
        team_id=team_id,
        requested_by_user_id=current_user.id,
        preferred_date=payload.preferred_date,
        preferred_time_start=payload.preferred_time_start,
        preferred_time_end=payload.preferred_time_end,
        topic=payload.topic,
        status="pending",
    )
    db.add(slot_req)
    db.commit()
    db.refresh(slot_req)

    # 4. Notify admin via email
    try:
        time_window = f"{payload.preferred_time_start.strftime('%I:%M %p')} - {payload.preferred_time_end.strftime('%I:%M %p')}"
        EmailDeliveryService().send_mentor_slot_requested_admin(
            team_name=team.name,
            lead_name=current_user.full_name or "Fellow Lead",
            preferred_date=str(payload.preferred_date),
            time_window=time_window,
            topic=payload.topic,
            request_id=str(slot_req.id),
        )
    except Exception:
        pass

    return _enrich_slot_response(slot_req, db)


@router.get(
    "/teams/{team_id}/mentor-slot-requests",
    response_model=list[MentorSlotRequestResponse],
)
def get_team_mentor_slot_requests(
    team_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    team = db.scalar(select(Team).where(Team.id == team_id))
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found.")

    # Allow team members and admin
    if current_user.role != "admin":
        student_profile = db.scalar(
            select(StudentProfile).where(StudentProfile.user_id == current_user.id)
        )
        if student_profile:
            membership = db.scalar(
                select(TeamMember).where(
                    TeamMember.team_id == team_id,
                    TeamMember.student_id == student_profile.id,
                    TeamMember.left_at.is_(None),
                )
            )
            if not membership and current_user.role != "mentor":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to view this team's slot requests.",
                )

    requests = db.scalars(
        select(MentorSlotRequest)
        .where(MentorSlotRequest.team_id == team_id)
        .order_by(MentorSlotRequest.created_at.desc())
    ).all()

    return [_enrich_slot_response(r, db) for r in requests]


@router.get(
    "/admin/mentor-slot-requests",
    response_model=list[MentorSlotRequestResponse],
    dependencies=[Depends(require_admin)],
)
def get_admin_mentor_slot_requests(
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
):
    query = select(MentorSlotRequest).order_by(MentorSlotRequest.created_at.desc())
    if status_filter and status_filter.lower() != "all":
        query = query.where(MentorSlotRequest.status == status_filter.lower())

    requests = db.scalars(query).all()
    return [_enrich_slot_response(r, db) for r in requests]


@router.patch(
    "/admin/mentor-slot-requests/{request_id}/approve",
    response_model=MentorSlotRequestResponse,
    dependencies=[Depends(require_admin)],
)
def approve_mentor_slot_request(
    request_id: UUID,
    payload: MentorSlotApprove,
    db: Session = Depends(get_db),
):
    slot_req = db.scalar(select(MentorSlotRequest).where(MentorSlotRequest.id == request_id))
    if not slot_req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot request not found.")

    mentor = db.scalar(select(Mentor).where(Mentor.id == payload.assigned_mentor_id))
    if not mentor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned mentor not found.")
    mentor_user = db.scalar(select(User).where(User.id == mentor.user_id))

    team = db.scalar(select(Team).where(Team.id == slot_req.team_id))
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found.")

    # Gather attendee emails: mentor + all active team members
    attendee_emails = []
    if mentor_user and mentor_user.email:
        attendee_emails.append(mentor_user.email)

    team_members = db.scalars(
        select(TeamMember).where(TeamMember.team_id == team.id, TeamMember.left_at.is_(None))
    ).all()
    for tm in team_members:
        sp = db.scalar(select(StudentProfile).where(StudentProfile.id == tm.student_id))
        if sp:
            u = db.scalar(select(User).where(User.id == sp.user_id))
            if u and u.email and u.email not in attendee_emails:
                attendee_emails.append(u.email)

    # Generate Google Meet link
    meet_link = None
    event_id = None
    title = f"DLIF Mentor Slot: Team {team.name} & {mentor_user.full_name if mentor_user else 'Mentor'}"

    try:
        if google_meet.is_enabled():
            event_id, meet_link = google_meet.create_meet(
                title=title,
                scheduled_at=payload.confirmed_start_time,
                end_time=payload.confirmed_end_time,
                attendee_emails=attendee_emails,
                description=f"Agenda: {slot_req.topic}\n\nDegreeLabs Discover Fellowship Mentor Consultation",
            )
        else:
            # Graceful development fallback
            event_id = f"mock-event-{slot_req.id.hex[:12]}"
            meet_link = f"https://meet.google.com/dlif-{slot_req.id.hex[:3]}-{slot_req.id.hex[3:7]}-{slot_req.id.hex[7:10]}"
    except Exception as exc:
        # Fallback if Google API transient failure occurs so scheduling isn't blocked
        event_id = f"fallback-event-{slot_req.id.hex[:12]}"
        meet_link = f"https://meet.google.com/dlif-{slot_req.id.hex[:3]}-{slot_req.id.hex[3:7]}-{slot_req.id.hex[7:10]}"

    slot_req.status = "approved"
    slot_req.assigned_mentor_id = mentor.id
    slot_req.confirmed_start_time = payload.confirmed_start_time
    slot_req.confirmed_end_time = payload.confirmed_end_time
    slot_req.meet_link = meet_link
    slot_req.google_event_id = event_id
    slot_req.admin_note = payload.admin_note
    slot_req.responded_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(slot_req)

    # Notify team and mentor
    try:
        confirmed_time_str = payload.confirmed_start_time.strftime("%A, %d %b %Y at %I:%M %p UTC")
        EmailDeliveryService().send_mentor_slot_approved(
            recipient_emails=attendee_emails,
            team_name=team.name,
            mentor_name=mentor_user.full_name if mentor_user else "Industry Mentor",
            confirmed_time=confirmed_time_str,
            meet_link=meet_link or "",
            topic=slot_req.topic,
        )
    except Exception:
        pass

    return _enrich_slot_response(slot_req, db)


@router.patch(
    "/admin/mentor-slot-requests/{request_id}/decline",
    response_model=MentorSlotRequestResponse,
    dependencies=[Depends(require_admin)],
)
def decline_mentor_slot_request(
    request_id: UUID,
    payload: MentorSlotDecline,
    db: Session = Depends(get_db),
):
    slot_req = db.scalar(select(MentorSlotRequest).where(MentorSlotRequest.id == request_id))
    if not slot_req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot request not found.")

    team = db.scalar(select(Team).where(Team.id == slot_req.team_id))
    requester = db.scalar(select(User).where(User.id == slot_req.requested_by_user_id))

    slot_req.status = "declined"
    slot_req.admin_note = payload.admin_note
    slot_req.responded_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(slot_req)

    # Send decline email
    try:
        recipients = [requester.email] if (requester and requester.email) else []
        EmailDeliveryService().send_mentor_slot_declined(
            recipient_emails=recipients,
            team_name=team.name if team else "Team",
            admin_note=payload.admin_note,
            topic=slot_req.topic,
        )
    except Exception:
        pass

    return _enrich_slot_response(slot_req, db)


# ─── Team Lead: Edit / Cancel pending request ─────────────────────────────────

def _assert_team_lead(team_id, current_user, db):
    """Raises 403 unless the current user is admin or the team lead."""
    if current_user.role == "admin":
        return
    student_profile = db.scalar(
        select(StudentProfile).where(StudentProfile.user_id == current_user.id)
    )
    if not student_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No student profile found.")
    membership = db.scalar(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.student_id == student_profile.id,
            TeamMember.left_at.is_(None),
        )
    )
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not an active member of this team.")
    is_lead = (
        membership.is_team_lead
        or (membership.role and membership.role.lower() in ["fellow lead", "lead", "team_lead", "leader"])
    )
    if not is_lead:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the Team Lead can perform this action.")


@router.patch(
    "/teams/{team_id}/mentor-slot-requests/{request_id}",
    response_model=MentorSlotRequestResponse,
)
def update_mentor_slot_request(
    team_id: UUID,
    request_id: UUID,
    payload: MentorSlotRequestUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Team lead can edit a PENDING slot request's date, time window, or topic."""
    team = db.scalar(select(Team).where(Team.id == team_id))
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found.")

    _assert_team_lead(team_id, current_user, db)

    slot_req = db.scalar(
        select(MentorSlotRequest).where(
            MentorSlotRequest.id == request_id,
            MentorSlotRequest.team_id == team_id,
        )
    )
    if not slot_req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot request not found.")
    if slot_req.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot edit a request with status '{slot_req.status}'. Only pending requests can be edited.",
        )

    if payload.preferred_date is not None:
        slot_req.preferred_date = payload.preferred_date
    if payload.preferred_time_start is not None:
        slot_req.preferred_time_start = payload.preferred_time_start
    if payload.preferred_time_end is not None:
        slot_req.preferred_time_end = payload.preferred_time_end
    if payload.topic is not None:
        slot_req.topic = payload.topic

    db.commit()
    db.refresh(slot_req)
    return _enrich_slot_response(slot_req, db)


@router.delete(
    "/teams/{team_id}/mentor-slot-requests/{request_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def cancel_mentor_slot_request(
    team_id: UUID,
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Team lead can cancel (delete) a PENDING slot request."""
    team = db.scalar(select(Team).where(Team.id == team_id))
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found.")

    _assert_team_lead(team_id, current_user, db)

    slot_req = db.scalar(
        select(MentorSlotRequest).where(
            MentorSlotRequest.id == request_id,
            MentorSlotRequest.team_id == team_id,
        )
    )
    if not slot_req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot request not found.")
    if slot_req.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot cancel a request with status '{slot_req.status}'.",
        )

    # Gather attendee emails: team members + requester
    attendee_emails: list[str] = []
    team_members = db.scalars(
        select(TeamMember).where(TeamMember.team_id == team.id, TeamMember.left_at.is_(None))
    ).all()
    for tm in team_members:
        sp = db.scalar(select(StudentProfile).where(StudentProfile.id == tm.student_id))
        if sp:
            u = db.scalar(select(User).where(User.id == sp.user_id))
            if u and u.email and u.email not in attendee_emails:
                attendee_emails.append(u.email)

    time_str = f"{slot_req.preferred_date} ({slot_req.preferred_time_start} - {slot_req.preferred_time_end})"
    try:
        EmailDeliveryService().send_mentor_slot_cancelled(
            recipient_emails=attendee_emails,
            team_name=team.name,
            topic=slot_req.topic,
            scheduled_time=time_str,
            reason="Slot request cancelled by team lead.",
        )
    except Exception:
        pass

    db.delete(slot_req)
    db.commit()


# ─── Admin-only: reschedule (edit confirmed time / mentor) ───────────────────

@router.patch(
    "/admin/mentor-slot-requests/{request_id}/reschedule",
    response_model=MentorSlotRequestResponse,
    dependencies=[Depends(require_admin)],
)
def reschedule_mentor_slot_request(
    request_id: UUID,
    payload: MentorSlotApprove,
    db: Session = Depends(get_db),
):
    """Admin can reschedule any approved slot — updates the confirmed time, re-assigns a mentor,
    and regenerates the Google Meet link."""
    slot_req = db.scalar(select(MentorSlotRequest).where(MentorSlotRequest.id == request_id))
    if not slot_req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot request not found.")

    mentor = db.scalar(select(Mentor).where(Mentor.id == payload.assigned_mentor_id))
    if not mentor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned mentor not found.")
    mentor_user = db.scalar(select(User).where(User.id == mentor.user_id))

    team = db.scalar(select(Team).where(Team.id == slot_req.team_id))
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found.")

    # Gather attendee emails
    attendee_emails: list[str] = []
    if mentor_user and mentor_user.email:
        attendee_emails.append(mentor_user.email)
    team_members = db.scalars(
        select(TeamMember).where(TeamMember.team_id == team.id, TeamMember.left_at.is_(None))
    ).all()
    for tm in team_members:
        sp = db.scalar(select(StudentProfile).where(StudentProfile.id == tm.student_id))
        if sp:
            u = db.scalar(select(User).where(User.id == sp.user_id))
            if u and u.email and u.email not in attendee_emails:
                attendee_emails.append(u.email)

    # Regenerate Google Meet
    title = f"DLIF Mentor Slot: Team {team.name} & {mentor_user.full_name if mentor_user else 'Mentor'}"
    meet_link = slot_req.meet_link
    event_id = slot_req.google_event_id
    try:
        if google_meet.is_enabled():
            event_id, meet_link = google_meet.create_meet(
                title=title,
                scheduled_at=payload.confirmed_start_time,
                end_time=payload.confirmed_end_time,
                attendee_emails=attendee_emails,
                description=f"Agenda: {slot_req.topic}\n\nDegreeLabs Discover Fellowship Mentor Consultation (Rescheduled)",
            )
        else:
            event_id = f"mock-event-{slot_req.id.hex[:12]}"
            meet_link = f"https://meet.google.com/dlif-{slot_req.id.hex[:3]}-{slot_req.id.hex[3:7]}-{slot_req.id.hex[7:10]}"
    except Exception:
        event_id = f"fallback-event-{slot_req.id.hex[:12]}"
        meet_link = f"https://meet.google.com/dlif-{slot_req.id.hex[:3]}-{slot_req.id.hex[3:7]}-{slot_req.id.hex[7:10]}"

    slot_req.status = "approved"
    slot_req.assigned_mentor_id = mentor.id
    slot_req.confirmed_start_time = payload.confirmed_start_time
    slot_req.confirmed_end_time = payload.confirmed_end_time
    slot_req.meet_link = meet_link
    slot_req.google_event_id = event_id
    slot_req.admin_note = payload.admin_note
    slot_req.responded_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(slot_req)

    # Notify attendees of rescheduled time
    try:
        confirmed_time_str = payload.confirmed_start_time.strftime("%A, %d %b %Y at %I:%M %p UTC")
        EmailDeliveryService().send_mentor_slot_approved(
            recipient_emails=attendee_emails,
            team_name=team.name,
            mentor_name=mentor_user.full_name if mentor_user else "Industry Mentor",
            confirmed_time=confirmed_time_str,
            meet_link=meet_link or "",
            topic=slot_req.topic,
        )
    except Exception:
        pass

    return _enrich_slot_response(slot_req, db)


# ─── Admin-only: hard delete any slot request ────────────────────────────────

@router.delete(
    "/admin/mentor-slot-requests/{request_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def admin_delete_mentor_slot_request(
    request_id: UUID,
    db: Session = Depends(get_db),
):
    """Admin can permanently delete any slot request regardless of status."""
    slot_req = db.scalar(select(MentorSlotRequest).where(MentorSlotRequest.id == request_id))
    if not slot_req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot request not found.")

    team = db.scalar(select(Team).where(Team.id == slot_req.team_id))

    # Gather attendee emails: team members + requester
    attendee_emails: list[str] = []
    if team:
        team_members = db.scalars(
            select(TeamMember).where(TeamMember.team_id == team.id, TeamMember.left_at.is_(None))
        ).all()
        for tm in team_members:
            sp = db.scalar(select(StudentProfile).where(StudentProfile.id == tm.student_id))
            if sp:
                u = db.scalar(select(User).where(User.id == sp.user_id))
                if u and u.email and u.email not in attendee_emails:
                    attendee_emails.append(u.email)

    requester = db.scalar(select(User).where(User.id == slot_req.requested_by_user_id))
    if requester and requester.email and requester.email not in attendee_emails:
        attendee_emails.append(requester.email)

    mentor_user = None
    if slot_req.assigned_mentor_id:
        mentor = db.scalar(select(Mentor).where(Mentor.id == slot_req.assigned_mentor_id))
        if mentor:
            mentor_user = db.scalar(select(User).where(User.id == mentor.user_id))
            if mentor_user and mentor_user.email and mentor_user.email not in attendee_emails:
                attendee_emails.append(mentor_user.email)

    time_str: str | None = None
    if slot_req.confirmed_start_time:
        time_str = slot_req.confirmed_start_time.strftime("%A, %d %b %Y at %I:%M %p UTC")
    elif slot_req.preferred_date:
        time_str = f"{slot_req.preferred_date} ({slot_req.preferred_time_start} - {slot_req.preferred_time_end})"

    # Send cancellation email to students and mentor
    try:
        EmailDeliveryService().send_mentor_slot_cancelled(
            recipient_emails=attendee_emails,
            team_name=team.name if team else "Team",
            topic=slot_req.topic,
            scheduled_time=time_str,
            mentor_name=mentor_user.full_name if mentor_user else None,
            reason="Session cancelled by administration.",
        )
    except Exception:
        pass

    db.delete(slot_req)
    db.commit()
