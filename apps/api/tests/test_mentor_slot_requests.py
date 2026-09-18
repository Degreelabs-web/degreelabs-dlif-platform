import uuid
from datetime import date, datetime, time, timedelta, timezone
from unittest.mock import patch

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.api.routes.mentor_slot_requests import (
    approve_mentor_slot_request,
    create_mentor_slot_request,
    decline_mentor_slot_request,
    get_team_mentor_slot_requests,
)
from app.db.models.cohort import Cohort
from app.db.models.institution import Institution
from app.db.models.mentor import Mentor
from app.db.models.mentor_slot_request import MentorSlotRequest
from app.db.models.student_profile import StudentProfile
from app.db.models.team import Team
from app.db.models.team_member import TeamMember
from app.db.models.user import User
from app.db.session import SessionLocal
from app.schemas.mentor_slot_request import (
    MentorSlotApprove,
    MentorSlotDecline,
    MentorSlotRequestCreate,
)
from app.services.portal_experience import PortalExperienceService


@pytest.fixture
def db():
    session: Session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


def test_mentor_slot_request_lifecycle(db: Session):
    suffix = uuid.uuid4().hex[:6]

    # 1. Setup institution and cohort
    inst = Institution(
        id=uuid.uuid4(),
        name=f"Test University {suffix}",
        code=f"TU-{suffix.upper()}",
        status="active",
    )
    db.add(inst)
    db.commit()

    cohort = Cohort(
        id=uuid.uuid4(),
        institution_id=inst.id,
        name=f"Cohort {suffix}",
        academic_year="2026-2027",
        start_date=date.today(),
        end_date=date.today() + timedelta(days=90),
        status="active",
    )
    db.add(cohort)
    db.commit()

    # 2. Setup team
    team = Team(
        id=uuid.uuid4(),
        cohort_id=cohort.id,
        name=f"Alpha Squad {suffix}",
        status="active",
    )
    db.add(team)
    db.commit()

    # 3. Setup Lead Student user + profile + team member
    lead_user = User(
        id=uuid.uuid4(),
        email=f"lead_{suffix}@test.com",
        full_name=f"Lead Student {suffix}",
        role="student",
        status="active",
    )
    db.add(lead_user)
    db.commit()

    lead_profile = StudentProfile(
        id=uuid.uuid4(),
        user_id=lead_user.id,
        institution_id=inst.id,
        student_id=f"DL-{suffix}-01",
    )
    db.add(lead_profile)
    db.commit()

    lead_member = TeamMember(
        id=uuid.uuid4(),
        team_id=team.id,
        student_id=lead_profile.id,
        role="Fellow Lead",
        is_team_lead=True,
    )
    db.add(lead_member)
    db.commit()

    # 4. Setup Regular Student user + profile + team member
    reg_user = User(
        id=uuid.uuid4(),
        email=f"reg_{suffix}@test.com",
        full_name=f"Regular Student {suffix}",
        role="student",
        status="active",
    )
    db.add(reg_user)
    db.commit()

    reg_profile = StudentProfile(
        id=uuid.uuid4(),
        user_id=reg_user.id,
        institution_id=inst.id,
        student_id=f"DL-{suffix}-02",
    )
    db.add(reg_profile)
    db.commit()

    reg_member = TeamMember(
        id=uuid.uuid4(),
        team_id=team.id,
        student_id=reg_profile.id,
        role="member",
        is_team_lead=False,
    )
    db.add(reg_member)
    db.commit()

    # 5. Setup Mentor
    mentor_user = User(
        id=uuid.uuid4(),
        email=f"mentor_{suffix}@test.com",
        full_name=f"Dr. Mentor {suffix}",
        role="mentor",
        status="active",
    )
    db.add(mentor_user)
    db.commit()

    mentor = Mentor(
        id=uuid.uuid4(),
        user_id=mentor_user.id,
        designation="Principal Architect",
        company_name="Tech Corp",
        status="active",
    )
    db.add(mentor)
    db.commit()

    # --- TEST 1: Regular student cannot request mentor slot (403 Forbidden) ---
    req_payload = MentorSlotRequestCreate(
        preferred_date=date.today() + timedelta(days=2),
        preferred_time_start=time(14, 0),
        preferred_time_end=time(15, 0),
        topic="Architecture review and validation of data pipeline choices",
    )

    with pytest.raises(HTTPException) as exc_info:
        create_mentor_slot_request(
            team_id=team.id,
            payload=req_payload,
            current_user=reg_user,
            db=db,
        )
    assert exc_info.value.status_code == 403
    assert "Only the designated Team Lead" in exc_info.value.detail

    # --- TEST 2: Team Lead successfully creates slot request (201) ---
    created_res = create_mentor_slot_request(
        team_id=team.id,
        payload=req_payload,
        current_user=lead_user,
        db=db,
    )
    assert created_res.id is not None
    assert created_res.status == "pending"
    assert created_res.team_name == team.name
    assert created_res.requester_name == lead_user.full_name

    # --- TEST 3: Duplicate pending request is blocked (409 Conflict) ---
    with pytest.raises(HTTPException) as exc_info:
        create_mentor_slot_request(
            team_id=team.id,
            payload=req_payload,
            current_user=lead_user,
            db=db,
        )
    assert exc_info.value.status_code == 409
    assert "already pending" in exc_info.value.detail

    # --- TEST 4: Team members can query team requests ---
    team_slots = get_team_mentor_slot_requests(team_id=team.id, current_user=reg_user, db=db)
    assert len(team_slots) == 1
    assert team_slots[0].id == created_res.id

    # --- TEST 5: Admin can approve the slot request and generate Meet link ---
    now_utc = datetime.now(timezone.utc)
    slot_start = now_utc + timedelta(days=1, hours=2)
    slot_end = slot_start + timedelta(minutes=45)

    approve_payload = MentorSlotApprove(
        assigned_mentor_id=mentor.id,
        confirmed_start_time=slot_start,
        confirmed_end_time=slot_end,
        admin_note="Approved. Dr. Mentor will join on Google Meet.",
    )

    with patch("app.services.google_meet.is_enabled", return_value=True), patch(
        "app.services.google_meet.create_meet",
        return_value=("mock-event-12345", "https://meet.google.com/abc-defg-hij"),
    ):
        approved_res = approve_mentor_slot_request(
            request_id=created_res.id,
            payload=approve_payload,
            db=db,
        )

    assert approved_res.status == "approved"
    assert approved_res.meet_link == "https://meet.google.com/abc-defg-hij"
    assert approved_res.google_event_id == "mock-event-12345"
    assert approved_res.assigned_mentor_name == mentor_user.full_name

    # --- TEST 6: Student dashboard includes the approved mentor slot ---
    portal_service = PortalExperienceService(db)
    dash_data = portal_service.get_student_dashboard(lead_user.id)
    upcoming = dash_data.get("upcoming_sessions", [])

    mentor_slot_session = next(
        (s for s in upcoming if s.get("session_type") == "mentor_slot"), None
    )
    assert mentor_slot_session is not None
    assert mentor_slot_session["meeting_link"] == "https://meet.google.com/abc-defg-hij"
    assert "Architecture review" in mentor_slot_session["title"]

    # --- Cleanup created test rows ---
    db.query(MentorSlotRequest).filter(MentorSlotRequest.team_id == team.id).delete()
    db.query(TeamMember).filter(TeamMember.team_id == team.id).delete()
    db.query(Team).filter(Team.id == team.id).delete()
    db.query(StudentProfile).filter(StudentProfile.id.in_([lead_profile.id, reg_profile.id])).delete()
    db.query(Mentor).filter(Mentor.id == mentor.id).delete()
    db.query(User).filter(User.id.in_([lead_user.id, reg_user.id, mentor_user.id])).delete()
    db.query(Cohort).filter(Cohort.id == cohort.id).delete()
    db.query(Institution).filter(Institution.id == inst.id).delete()
    db.commit()
