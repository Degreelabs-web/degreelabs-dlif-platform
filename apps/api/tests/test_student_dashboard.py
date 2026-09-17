import uuid
from datetime import datetime, timezone
import pytest
from sqlalchemy.orm import Session

from app.core.discover_curriculum import DiscoverCurriculumService
from app.db.models.cohort import Cohort
from app.db.models.institution import Institution
from app.db.models.student_cohort_assignment import StudentCohortAssignment
from app.db.models.student_profile import StudentProfile
from app.db.models.team import Team
from app.db.models.team_member import TeamMember
from app.db.models.user import User
from app.db.session import SessionLocal
from app.services.portal_experience import PortalExperienceService


def test_discover_curriculum_loading():
    curriculum = DiscoverCurriculumService.load_curriculum()
    assert curriculum["phase"] == "Discover"
    assert curriculum["total_weeks"] == 4
    assert curriculum["total_sessions"] == 12
    assert len(curriculum["weeks"]) == 4
    assert len(curriculum["capabilities"]) == 5

    # Verify Week 1
    w1 = curriculum["weeks"][0]
    assert w1["week_number"] == 1
    assert w1["title"] == "Discover the Real Problem"
    assert w1["strategic_question"] == "What is really happening here?"
    assert w1["output_title"] == "Business Diagnosis & Problem Framing Pack"
    assert len(w1["sessions"]) == 3
    assert w1["sessions"][2]["session_type"] == "output_review_gate"

    # Verify Week 2
    w2 = curriculum["weeks"][1]
    assert w2["title"] == "Create Strategic Possibilities"
    assert w2["strategic_question"] == "What could we choose to do?"

    # Verify Week 3
    w3 = curriculum["weeks"][2]
    assert w3["title"] == "Design the Strategy"
    assert w3["strategic_question"] == "If this is our choice, how will it actually work?"

    # Verify Week 4
    w4 = curriculum["weeks"][3]
    assert w4["title"] == "Build the Case for Action"
    assert w4["strategic_question"] == "Why should the company believe us?"


def test_student_dashboard_context_generation():
    db: Session = SessionLocal()
    suffix = uuid.uuid4().hex[:6]

    try:
        # Create institution
        institution = Institution(
            id=uuid.uuid4(),
            name=f"University of Tech {suffix}",
            code=f"UOT-{suffix.upper()}",
            status="active",
        )
        db.add(institution)

        # Create user
        user = User(
            id=uuid.uuid4(),
            email=f"fellow_{suffix}@degreelabs.org",
            full_name=f"Discover Fellow {suffix}",
            role="student",
            status="active",
        )
        db.add(user)
        db.flush()

        # Create student profile
        profile = StudentProfile(
            id=uuid.uuid4(),
            user_id=user.id,
            institution_id=institution.id,
            student_id=f"STU-{suffix.upper()}",
            phone="+1234567890",
        )
        db.add(profile)

        # Create cohort
        from datetime import date
        cohort = Cohort(
            id=uuid.uuid4(),
            institution_id=institution.id,
            name=f"Discover Cohort {suffix}",
            academic_year="2026",
            start_date=date(2026, 9, 1),
            end_date=date(2026, 12, 31),
            status="active",
        )
        db.add(cohort)
        db.flush()

        # Cohort assignment
        cohort_assignment = StudentCohortAssignment(
            id=uuid.uuid4(),
            student_id=profile.id,
            cohort_id=cohort.id,
            status="active",
        )
        db.add(cohort_assignment)

        # Create team
        team = Team(
            id=uuid.uuid4(),
            cohort_id=cohort.id,
            name=f"Synergy Squad {suffix}",
            status="active",
        )
        db.add(team)
        db.flush()

        # Team member
        member = TeamMember(
            id=uuid.uuid4(),
            team_id=team.id,
            student_id=profile.id,
            role="Fellow Lead",
        )
        db.add(member)
        db.commit()

        # Run get_student_dashboard
        service = PortalExperienceService(db)
        dashboard = service.get_student_dashboard(user.id)

        # Assertions on returned structure
        assert dashboard["student"]["full_name"] == user.full_name
        assert dashboard["team"]["name"] == team.name
        assert dashboard["team"]["current_week"] == 1
        assert dashboard["team"]["current_session"] == 1
        assert len(dashboard["weeks"]) == 4
        assert dashboard["current_week"]["title"] == "Discover the Real Problem"
        assert dashboard["current_session"]["session_number"] == 1
        assert dashboard["assigned_challenge"] is not None
        assert "Apex Logistics Global" in dashboard["assigned_challenge"]["company_name"] or dashboard["assigned_challenge"]["title"] is not None
        assert dashboard["next_action"]["title"] is not None
        assert dashboard["next_action"]["desc"] is not None
        assert len(dashboard["capabilities"]) == 5
        assert len(dashboard["upcoming_sessions"]) <= 3
        assert dashboard["metrics"]["total_sessions"] == 12

    finally:
        db.rollback()
        db.close()
