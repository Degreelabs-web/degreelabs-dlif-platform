import os
import sys
from datetime import date, datetime, timezone
from uuid import UUID, uuid4

# Add parent directory to path so app can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal
from app.db.models.company import Company
from app.db.models.project import Project
from app.db.models.team import Team
from app.db.models.team_member import TeamMember
from app.db.models.student_profile import StudentProfile
from app.db.models.user import User
from app.db.models.mentor import Mentor
from app.db.models.team_project_assignment import TeamProjectAssignment
from app.db.models.team_mentor_assignment import TeamMentorAssignment
from app.db.models.cohort import Cohort


def seed_cikitsa():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        print("1. Seeding Company: Cikitsa India...")

        company = db.query(Company).filter(Company.slug == "cikitsa-india").first()
        if not company:
            company = db.query(Company).filter(Company.name == "Cikitsa India").first()

        company_data = {
            "name": "Cikitsa India",
            "slug": "cikitsa-india",
            "tagline": "Let Us.. Take Care...",
            "accreditation": "NABH Accredited",
            "category": "Medical Value Travel (MVT) Facilitator",
            "founder_sponsor": "Punit Sureka",
            "founder_title": "Founder",
            "profile": (
                "Cikitsa India supports international patients travelling to India for medical "
                "treatment. It coordinates patients, referral sources, hospitals, documentation, "
                "medical-travel requirements, appointments, travel support and post-treatment follow-up."
            ),
            "industry": "Medical Value Travel (MVT) Facilitator",
            "website": "https://cikitsaindia.com",
            "contact_email": "punit@cikitsaindia.com",
            "contact_name": "Punit Sureka",
            "contact_phone": "+91 98300 00000",
            "logo_url": "/assets/cikitsa-india-logo.png",
            "status": "active",
            "public_journey_stages": [
                "Initial Inquiry",
                "VIL Issue",
                "Visa Processing",
                "Travel & Treatment",
                "Post-Treatment",
            ],
            "brand_colors": {
                "primary_red": "#ED1C24",
                "primary_green": "#39B54A",
                "accent_blue": "#2E5AA8",
            },
            "reference_challenge_areas": [
                "Intake Intelligence",
                "Operations Intelligence",
            ],
        }

        if company:
            for k, v in company_data.items():
                setattr(company, k, v)
            company.updated_at = now
            print(f"   Updated existing company: {company.name} ({company.id})")
        else:
            company = Company(
                id=uuid4(),
                created_at=now,
                updated_at=now,
                **company_data,
            )
            db.add(company)
            db.flush()
            print(f"   Created company: {company.name} ({company.id})")

        print("\n2. Seeding Project A: Journey Intelligence...")
        project = db.query(Project).filter(Project.code == "PROJECT_A_JOURNEY_INTELLIGENCE").first()
        if not project:
            project = db.query(Project).filter(
                Project.company_id == company.id,
                Project.challenge_area == "Journey Intelligence",
            ).first()

        # Dedicated mentor
        dedicated_mentor = db.query(Mentor).join(User).filter(User.email == "siddharth@tailwebs.com").first()
        if not dedicated_mentor:
            dedicated_mentor = db.query(Mentor).first()

        project_data = {
            "company_id": company.id,
            "mentor_id": dedicated_mentor.id if dedicated_mentor else None,
            "code": "PROJECT_A_JOURNEY_INTELLIGENCE",
            "title": "AI Patient Follow-up & Arrival Conversion",
            "challenge_area": "Journey Intelligence",
            "phase": "Discover",
            "cohort_date": date(2026, 9, 15),
            "status": "assigned",
            "difficulty": "advanced",
            "max_teams": 5,
            "description": (
                "How might Cikitsa India use AI to ensure that every viable patient receives "
                "the right follow-up, at the right time, through the right person — so that fewer "
                "patients become invisible between VIL issuance, visa approval, arrival and hospital treatment?"
            ),
            "objectives": (
                "1. Map the patient follow-up handoff ecosystem across referral sources, hospitals, and coordinators.\n"
                "2. Identify leakage points where patient visibility weakens after VIL issuance.\n"
                "3. Frame strategic choices between deterministic follow-ups and AI-assisted intervention.\n"
                "4. Architect an executive proposal and working blueprint for patient arrival conversion."
            ),
            "expected_deliverables": (
                "Week 1: Business Diagnosis & Problem Framing Pack\n"
                "Week 2: Strategic Possibility & Choice Pack\n"
                "Week 3: Strategy & Execution Blueprint\n"
                "Week 4: Final Executive Proposal + Company Presentation"
            ),
            "challenge_statement": (
                "How might Cikitsa India use AI to ensure that every viable patient receives "
                "the right follow-up, at the right time, through the right person — so that fewer "
                "patients become invisible between VIL issuance, visa approval, arrival and hospital treatment?"
            ),
            "why_it_matters": (
                "Cikitsa India invests significant effort before and during the VIL process, but visibility "
                "weakens later in the journey. When downstream status is unclear, the company loses the ability "
                "to coordinate next actions, maintain source/hospital attribution, offer relevant services, "
                "and understand the eventual treatment or commercial outcome."
            ),
            "questions_to_investigate": [
                "What events currently trigger a follow-up, and who owns each one?",
                "How are follow-up dates decided and recorded?",
                "What happens when an agent, patient or hospital does not respond?",
                "How does Cikitsa learn that a visa was issued, travel is planned, a patient arrived, or a hospital visit occurred?",
                "At which handoffs does context or visibility weaken most often?",
                "Which follow-up activities create measurable business value?",
                "Which actions can be deterministic, which may benefit from AI assistance, and which require human judgement?",
            ],
            "project_boundaries": [
                "Do not assume the answer is a chatbot, CRM, WhatsApp bot, predictive model or 'arrival tracker'.",
                "Do not design unauthorised passport, border, telecom, device or location tracking.",
                "Do not make autonomous clinical or medical decisions.",
                "Any future patient communication must be designed around consent, human oversight and company approval.",
            ],
            "north_star_metric": (
                "Percentage of visa-approved cases for which Cikitsa India can account for the downstream journey."
            ),
            "supporting_measures": [
                "Overdue follow-ups",
                "Response rate",
                "Arrival confirmation",
                "Time-to-next-action",
                "Treatment attribution",
            ],
            "related_context_figures": {
                "vil_requests_per_month": "~2,000",
                "patients_obtaining_visas_per_month": "~150",
                "known_tracked_arrivals": "~30-35",
                "hospital_network": "~900",
                "bangladesh_patient_share": "~67%",
            },
            "discover_timeline": {
                "week_1": {"focus": "Understand", "output": "Business Diagnosis & Problem Framing Pack"},
                "week_2": {"focus": "Explore", "output": "Strategic Possibility & Choice Pack"},
                "week_3": {"focus": "Design", "output": "Strategy & Execution Blueprint"},
                "week_4": {"focus": "Propose", "output": "Executive Proposal + Company Presentation"},
            },
        }

        if project:
            for k, v in project_data.items():
                setattr(project, k, v)
            project.updated_at = now
            print(f"   Updated existing project: {project.title} ({project.id})")
        else:
            project = Project(
                id=uuid4(),
                created_at=now,
                updated_at=now,
                **project_data,
            )
            db.add(project)
            db.flush()
            print(f"   Created project: {project.title} ({project.id})")

        print("\n3. Seeding Teams & Assignments...")
        cohort = db.query(Cohort).first()
        cohort_id = cohort.id if cohort else uuid4()

        # Fellows list per the program handbook (fixed team size 5)
        fellow_rolls = [
            "DL-IF/2026/001",  # Shrihari Chikkodikar
            "DL-IF/2026/009",  # SREEHARI HARSHAN
            "DL-IF/2026/019",  # Midhun Krishna
            "DL-IF/2026/028",  # SARA FARHATH
            "DL-IF/2026/032",  # PRANAV MADAN SHEKHAR
        ]

        fellow_profiles = (
            db.query(StudentProfile)
            .filter(StudentProfile.student_id.in_(fellow_rolls))
            .all()
        )
        print(f"   Found {len(fellow_profiles)} fellowship students matching roster.")

        gate_schedule = {
            "week_1_gate": "Business Diagnosis & Problem Framing Pack",
            "week_2_gate": "Strategic Possibility & Choice Pack",
            "week_3_gate": "Strategy & Execution Blueprint",
            "week_4_gate": "Final Executive Proposal + Presentation",
        }

        # 3a. Use existing team SIGMA or create Cohort-Sep26-Team-A
        team = db.query(Team).filter(Team.name == "Cohort-Sep26-Team-A").first()
        if not team:
            team = db.query(Team).filter(Team.name == "SIGMA").first()
            if team:
                team.name = "Cohort-Sep26-Team-A"
                print(f"   Renamed team SIGMA -> Cohort-Sep26-Team-A ({team.id})")
            else:
                team = Team(
                    id=uuid4(),
                    cohort_id=cohort_id,
                    name="Cohort-Sep26-Team-A",
                    status="active",
                    created_at=now,
                    updated_at=now,
                )
                db.add(team)
                db.flush()
                print(f"   Created team: {team.name} ({team.id})")

        # 3b. Remove test students from this team so size is exactly 5 fellows
        test_student_rolls = ["DLIF-STUDENT-TEST-001"]
        test_profiles = db.query(StudentProfile).filter(StudentProfile.student_id.in_(test_student_rolls)).all()
        for tp in test_profiles:
            db.query(TeamMember).filter(TeamMember.team_id == team.id, TeamMember.student_id == tp.id).delete()

        # 3c. Ensure all 5 fellows belong exclusively to this active team
        for fp in fellow_profiles:
            # If fellow is in any other team, delete membership from other teams
            db.query(TeamMember).filter(
                TeamMember.student_id == fp.id,
                TeamMember.team_id != team.id,
            ).delete()

            tm = db.query(TeamMember).filter(
                TeamMember.team_id == team.id,
                TeamMember.student_id == fp.id,
            ).first()

            is_lead = (fp.student_id == "DL-IF/2026/001")
            if not tm:
                tm = TeamMember(
                    id=uuid4(),
                    team_id=team.id,
                    student_id=fp.id,
                    role="Fellow Lead" if is_lead else "Fellow",
                    is_team_lead=is_lead,
                    joined_at=now,
                    left_at=None,
                )
                db.add(tm)
                print(f"     Added fellow {fp.student_id} to {team.name}")
            else:
                tm.left_at = None
                tm.is_team_lead = is_lead
                tm.role = "Fellow Lead" if is_lead else "Fellow"
                print(f"     Updated fellow {fp.student_id} in {team.name}")

        # 3d. Deactivate previous active project assignments for this team
        db.query(TeamProjectAssignment).filter(
            TeamProjectAssignment.team_id == team.id,
            TeamProjectAssignment.project_id != project.id,
            TeamProjectAssignment.status == "active",
        ).update({"status": "completed", "completed_at": now})

        # 3e. Link Team to Project A & Cikitsa India
        tpa = db.query(TeamProjectAssignment).filter(
            TeamProjectAssignment.team_id == team.id,
            TeamProjectAssignment.project_id == project.id,
        ).first()

        if not tpa:
            tpa = TeamProjectAssignment(
                id=uuid4(),
                team_id=team.id,
                project_id=project.id,
                company_id=company.id,
                status="active",
                assigned_at=now,
                gate_schedule=gate_schedule,
                company_challenge_owner="Punit Sureka",
                notes="Assigned DISCOVER challenge: AI Patient Follow-up & Arrival Conversion",
            )
            db.add(tpa)
            print(f"     Linked {team.name} -> Project A ({project.code})")
        else:
            tpa.status = "active"
            tpa.company_id = company.id
            tpa.gate_schedule = gate_schedule
            tpa.company_challenge_owner = "Punit Sureka"
            tpa.notes = "Assigned DISCOVER challenge: AI Patient Follow-up & Arrival Conversion"
            print(f"     Updated {team.name} -> Project A assignment")

        # 3f. Assign Dedicated Team Mentor
        if dedicated_mentor:
            db.query(TeamMentorAssignment).filter(
                TeamMentorAssignment.team_id == team.id,
                TeamMentorAssignment.mentor_id != dedicated_mentor.id,
                TeamMentorAssignment.status == "active",
            ).update({"status": "completed", "unassigned_at": now})

            tma = db.query(TeamMentorAssignment).filter(
                TeamMentorAssignment.team_id == team.id,
                TeamMentorAssignment.mentor_id == dedicated_mentor.id,
            ).first()

            if not tma:
                tma = TeamMentorAssignment(
                    id=uuid4(),
                    team_id=team.id,
                    mentor_id=dedicated_mentor.id,
                    status="active",
                    assigned_at=now,
                    notes="Dedicated Team Mentor: questions, critiques, exposes gaps, coaches reasoning",
                )
                db.add(tma)
                print(f"     Assigned Dedicated Team Mentor to {team.name}")
            else:
                tma.status = "active"
                tma.notes = "Dedicated Team Mentor: questions, critiques, exposes gaps, coaches reasoning"
                print(f"     Reactivated Dedicated Team Mentor for {team.name}")

        db.commit()
        print("\nSUCCESS: Cikitsa India and Project A successfully seeded into DLIF platform!")

    except Exception as e:
        db.rollback()
        print(f"\nERROR seeding Cikitsa: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_cikitsa()
