import uuid
from datetime import date, datetime, timezone
# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.user import User
from app.db.models.institution import Institution
from app.db.models.cohort import Cohort
from app.db.models.student_profile import StudentProfile
from app.db.models.team import Team
from app.db.models.team_member import TeamMember
from app.db.models.mentor import Mentor
from app.db.models.company import Company
from app.db.models.project import Project
from app.db.models.team_mentor_assignment import TeamMentorAssignment
from app.db.models.team_project_assignment import TeamProjectAssignment
from app.db.models.student_cohort_assignment import StudentCohortAssignment
from app.db.models.session import Session as FellowshipSession
from app.db.models.session_task import SessionTask
from app.db.models.submission import Submission

from app.services.mentor import MentorService
from app.services.company import CompanyService
from app.services.project import ProjectService
from app.services.team_assignment import TeamAssignmentService
from app.services.student_cohort_assignment import StudentCohortAssignmentService
from app.services.portal_experience import PortalExperienceService

from app.schemas.mentor import MentorCreate
from app.schemas.company import CompanyCreate
from app.schemas.project import ProjectCreate
from app.schemas.team_mentor_assignment import TeamMentorAssignmentCreate
from app.schemas.team_project_assignment import TeamProjectAssignmentCreate
from app.schemas.student_cohort_assignment import StudentCohortAssignmentCreate


def test_complete_fellowship_workflow():
    db: Session = SessionLocal()
    suffix = uuid.uuid4().hex[:6]

    try:
        # =========================================================================
        # Stage 1: Institution
        # =========================================================================
        institution = Institution(
            id=uuid.uuid4(),
            name=f"Apex Institute of Technology {suffix}",
            code=f"AIT-{suffix.upper()}",
            status="active",
        )
        db.add(institution)
        db.commit()
        db.refresh(institution)
        assert institution.id is not None

        # =========================================================================
        # Stage 2-4: Student Enrolled, Onboarded, Profile Created
        # =========================================================================
        student_user = User(
            id=uuid.uuid4(),
            email=f"fellow_{suffix}@ait.edu",
            full_name=f"Aarav Sharma {suffix}",
            role="student",
            status="active",
        )
        db.add(student_user)
        db.commit()

        student_profile = StudentProfile(
            id=uuid.uuid4(),
            user_id=student_user.id,
            institution_id=institution.id,
            student_id=f"STU-{suffix.upper()}",
            course="B.Tech Computer Science",
            branch="AI & Data Science",
            graduation_year=2027,
        )
        db.add(student_profile)
        db.commit()
        db.refresh(student_profile)
        assert student_profile.id is not None

        # =========================================================================
        # Stage 5: Student Assigned To Cohort
        # =========================================================================
        cohort = Cohort(
            id=uuid.uuid4(),
            institution_id=institution.id,
            name=f"Cohort Alpha {suffix}",
            academic_year="2026-2027",
            start_date=date(2026, 9, 1),
            end_date=date(2026, 12, 31),
            status="active",
        )
        db.add(cohort)
        db.commit()

        cohort_service = StudentCohortAssignmentService(db)
        cohort_assign = cohort_service.assign_student(
            StudentCohortAssignmentCreate(
                student_id=student_profile.id,
                cohort_id=cohort.id,
            )
        )
        assert cohort_assign.status == "active"
        assert cohort_assign.cohort_name == cohort.name

        # Verify duplicate active assignment rejected
        with pytest.raises(ValueError):
            cohort_service.assign_student(
                StudentCohortAssignmentCreate(
                    student_id=student_profile.id,
                    cohort_id=cohort.id,
                )
            )

        # =========================================================================
        # Stage 6: Student Assigned To Team
        # =========================================================================
        team = Team(
            id=uuid.uuid4(),
            cohort_id=cohort.id,
            name=f"Team Quantum {suffix}",
            status="active",
        )
        db.add(team)
        db.commit()

        team_member = TeamMember(
            id=uuid.uuid4(),
            team_id=team.id,
            student_id=student_profile.id,
            role="leader",
        )
        db.add(team_member)
        db.commit()

        # =========================================================================
        # Stage 7: Team Assigned Mentor
        # =========================================================================
        mentor_service = MentorService(db)

        mentor_1 = mentor_service.create(
            MentorCreate(
                full_name=f"Dr. Vikram Sarabhai {suffix}",
                email=f"vikram_{suffix}@spacex.com",
                password="TestMentor@123",
                company_name="SpaceX",
                designation="Director of Propulsion AI",
                expertise=["Aerospace", "Autonomous Navigation"],
                years_of_experience=15,
            )
        )
        assert mentor_1.id is not None

        mentor_2 = mentor_service.create(
            MentorCreate(
                full_name=f"Priya Nair {suffix}",
                email=f"priya_{suffix}@deepmind.com",
                password="TestMentor@123",
                company_name="Google DeepMind",
                designation="Research Scientist",
                expertise=["Reinforcement Learning"],
                years_of_experience=8,
            )
        )
        assert mentor_2.id is not None

        assignment_service = TeamAssignmentService(db)

        # Assign mentor_1 to team
        team_mentor_assign = assignment_service.assign_mentor(
            TeamMentorAssignmentCreate(
                team_id=team.id,
                mentor_id=mentor_1.id,
                notes="Initial AI navigation advisor.",
            )
        )
        assert team_mentor_assign.status == "active"
        assert team_mentor_assign.mentor_name == mentor_1.full_name

        # INVARIANT TEST: Assign mentor_2 to team -> mentor_1 must be automatically retired/reassigned
        assignment_service.assign_mentor(
            TeamMentorAssignmentCreate(
                team_id=team.id,
                mentor_id=mentor_2.id,
                notes="Reassigned to Priya Nair.",
            )
        )

        active_assignments = assignment_service.get_mentor_assignments(
            team_id=team.id, status="active"
        )
        assert len(active_assignments) == 1
        assert active_assignments[0].mentor_id == mentor_2.id

        retired_assignments = assignment_service.get_mentor_assignments(
            team_id=team.id, status="reassigned"
        )
        assert len(retired_assignments) == 1
        assert retired_assignments[0].mentor_id == mentor_1.id

        # =========================================================================
        # Stage 8: Team Assigned Company & Stage 9: Company Assigned Project
        # =========================================================================
        company_service = CompanyService(db)
        company = company_service.create(
            CompanyCreate(
                name=f"Novus Energy {suffix}",
                industry="CleanTech",
                profile="Next-generation nuclear fusion telemetry and plasma stability control.",
                contact_email=f"contact_{suffix}@novusenergy.org",
                website="https://novusenergy.org",
            )
        )
        assert company.id is not None

        project_service = ProjectService(db)
        project = project_service.create(
            ProjectCreate(
                company_id=company.id,
                title="Plasma Confinement Anomaly Detection",
                description="Predict magnetic confinement disruptions using high-frequency sensor streams.",
                objectives="Real-time ingestion, microsecond inference, emergency dampening triggers.",
                expected_deliverables="C++ inference core, FastAPI supervision agent, telemetry dashboard.",
                start_date=date(2026, 10, 1),
                end_date=date(2026, 12, 15),
                difficulty="advanced",
                max_teams=2,
            )
        )
        assert project.id is not None
        assert project.company_name == company.name

        # Assign project to team
        team_proj_assign = assignment_service.assign_project(
            TeamProjectAssignmentCreate(
                team_id=team.id,
                project_id=project.id,
                notes="Primary capstone allocation.",
            )
        )
        assert team_proj_assign.status == "active"
        assert team_proj_assign.project_title == project.title
        assert team_proj_assign.company_name == company.name

        # =========================================================================
        # Stage 10: Student Works On Project (Session Task & Submission)
        # =========================================================================
        f_session = FellowshipSession(
            id=uuid.uuid4(),
            cohort_id=cohort.id,
            week_number=1,
            session_number=1,
            title="Capstone Sprint 1",
            scheduled_at=datetime.now(timezone.utc),
        )
        db.add(f_session)
        db.commit()

        task = SessionTask(
            id=uuid.uuid4(),
            session_id=f_session.id,
            title="Submit Architecture Deck",
            task_type="activity",
            required=True,
        )
        db.add(task)
        db.commit()

        submission = Submission(
            id=uuid.uuid4(),
            task_id=task.id,
            team_id=team.id,
            status="submitted",
            submitted_by=student_user.id,
            submitted_at=datetime.now(timezone.utc),
        )
        db.add(submission)
        db.commit()

        # =========================================================================
        # Stage 11: Verify Portal Context Aggregation
        # =========================================================================
        portal_service = PortalExperienceService(db)
        student_ctx = portal_service.get_student_portal_context(student_user.id)

        assert student_ctx["student"]["full_name"] == student_user.full_name
        assert student_ctx["student"]["institution_name"] == institution.name
        assert student_ctx["cohort"]["name"] == cohort.name
        assert student_ctx["team"]["name"] == team.name
        assert student_ctx["mentor"]["full_name"] == mentor_2.full_name
        assert student_ctx["company"]["name"] == company.name
        assert student_ctx["project"]["title"] == project.title
        assert student_ctx["stats"]["submissions_count"] == 1
        assert student_ctx["stats"]["journey_stage"] == "project_in_progress"

        mentor_ctx = portal_service.get_mentor_portal_context(mentor_2.user_id)
        assert mentor_ctx["mentor"]["full_name"] == mentor_2.full_name
        assert mentor_ctx["stats"]["teams_count"] == 1
        assert mentor_ctx["teams"][0]["name"] == team.name
        assert mentor_ctx["teams"][0]["project"]["title"] == project.title

        print("\n>>> ALL 11 STAGES AND BUSINESS INVARIANTS VERIFIED 100% SUCCESSFULLY! <<<")

    finally:
        db.close()


if __name__ == "__main__":
    test_complete_fellowship_workflow()
