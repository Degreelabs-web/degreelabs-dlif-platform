from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.discover_curriculum import DiscoverCurriculumService
from app.db.models.attendance import Attendance
from app.db.models.challenge import Challenge
from app.db.models.challenge_assignment import ChallengeAssignment
from app.db.models.cohort import Cohort
from app.db.models.company import Company
from app.db.models.institution import Institution
from app.db.models.mentor import Mentor
from app.db.models.mentor_slot_request import MentorSlotRequest
from app.db.models.project import Project
from app.db.models.student_cohort_assignment import StudentCohortAssignment
from app.db.models.student_profile import StudentProfile
from app.db.models.submission import Submission
from app.db.models.team import Team
from app.db.models.team_member import TeamMember
from app.db.models.team_mentor_assignment import TeamMentorAssignment
from app.db.models.team_project_assignment import TeamProjectAssignment
from app.db.models.user import User
from app.db.models.session import Session as SessionModel
from app.services.mentor_headshot_storage import MentorHeadshotStorageService
from app.services.student_photo_storage import StudentPhotoStorageService


class PortalExperienceService:
    def __init__(self, db: Session):
        self.db = db

    def _build_team_members_list(self, team_id: UUID, cohort: Cohort | None) -> list[dict]:
        all_members = self.db.scalars(
            select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.left_at.is_(None))
        ).all()
        team_members_list = []
        for m in all_members:
            sp = self.db.scalar(select(StudentProfile).where(StudentProfile.id == m.student_id))
            u = self.db.scalar(select(User).where(User.id == sp.user_id)) if sp else None
            inst = self.db.scalar(select(Institution).where(Institution.id == sp.institution_id)) if sp else None

            cohort_asgn = self.db.scalar(
                select(StudentCohortAssignment).where(
                    StudentCohortAssignment.student_id == sp.id,
                    StudentCohortAssignment.status == "active",
                )
            ) if sp else None
            batch_name = None
            if cohort_asgn:
                c_obj = self.db.scalar(select(Cohort).where(Cohort.id == cohort_asgn.cohort_id))
                batch_name = c_obj.name if c_obj else None

            photo_url = None
            if sp and sp.photo_url:
                try:
                    if StudentPhotoStorageService.is_storage_path(sp.photo_url):
                        photo_url = StudentPhotoStorageService().signed_url(sp.photo_url)
                    elif MentorHeadshotStorageService.is_storage_path(sp.photo_url):
                        photo_url = MentorHeadshotStorageService().signed_url(sp.photo_url)
                    else:
                        photo_url = sp.photo_url
                except Exception:
                    photo_url = sp.photo_url

            is_lead = bool(
                getattr(m, "is_team_lead", False)
                or (m.role and m.role.lower() in ["fellow lead", "lead", "team_lead"])
            )
            team_members_list.append({
                "student_id": str(m.student_id),
                "user_id": str(u.id) if u else None,
                "name": u.full_name if u else "Team Member",
                "role": "Fellow Lead" if is_lead else (m.role or "Member"),
                "is_team_lead": is_lead,
                "email": u.email if u else None,
                "status": u.status if u else "active",
                "roll_no": sp.student_id if sp else None,
                "institution_name": inst.name if inst else "Partner Institution",
                "course": sp.course if sp else None,
                "branch": sp.branch if sp else None,
                "current_year_semester": sp.current_year_semester if sp else None,
                "graduation_year": sp.graduation_year if sp else None,
                "phone": sp.phone if sp else None,
                "gender": sp.gender if sp else None,
                "photo_url": photo_url,
                "batch_name": batch_name or (cohort.name if cohort else "Discover Cohort 2026"),
            })
        return team_members_list

    def get_student_portal_context(self, user_id: UUID) -> dict:
        user = self.db.scalar(select(User).where(User.id == user_id))
        if not user:
            raise LookupError("User not found.")

        student = self.db.scalar(
            select(StudentProfile).where(StudentProfile.user_id == user_id)
        )
        if not student:
            raise LookupError("Student profile not found.")

        institution = self.db.scalar(
            select(Institution).where(Institution.id == student.institution_id)
        )

        # 1. Cohort
        cohort_assignment = self.db.scalar(
            select(StudentCohortAssignment)
            .where(
                StudentCohortAssignment.student_id == student.id,
                StudentCohortAssignment.status == "active",
            )
            .order_by(StudentCohortAssignment.assigned_at.desc())
        )
        cohort = None
        if cohort_assignment:
            cohort = self.db.scalar(
                select(Cohort).where(Cohort.id == cohort_assignment.cohort_id)
            )

        # 2. Team
        team_member = self.db.scalar(
            select(TeamMember)
            .where(TeamMember.student_id == student.id, TeamMember.left_at.is_(None))
        )
        team = None
        team_members_list = []
        if team_member:
            team = self.db.scalar(select(Team).where(Team.id == team_member.team_id))
            if team:
                team_members_list = self._build_team_members_list(team.id, cohort)

        # 3. Mentor
        mentor_data = None
        if team:
            mentor_assignment = self.db.scalar(
                select(TeamMentorAssignment).where(
                    TeamMentorAssignment.team_id == team.id,
                    TeamMentorAssignment.status == "active",
                )
            )
            if mentor_assignment:
                mentor = self.db.scalar(
                    select(Mentor).where(Mentor.id == mentor_assignment.mentor_id)
                )
                if mentor:
                    mentor_user = self.db.scalar(select(User).where(User.id == mentor.user_id))
                    mentor_data = {
            "id": str(mentor.id),
            "full_name": mentor_user.full_name if mentor_user else "Mentor",
            "email": mentor_user.email if mentor_user else None,

            "phone": mentor.phone,
            "bio": mentor.bio,

            "designation": mentor.designation,
            "company_name": mentor.company_name,
            "professional_headline": mentor.professional_headline,

            "years_of_experience": mentor.years_of_experience,

            "location": mentor.location,
            "city": mentor.city,
            "country": mentor.country,

            "linkedin_url": mentor.linkedin_url,
            "github_url": mentor.github_url,
            "headshot_url": (
                MentorHeadshotStorageService().signed_url(mentor.headshot_url)
                if MentorHeadshotStorageService.is_storage_path(mentor.headshot_url)
                else mentor.headshot_url
            ),

            "expertise": mentor.expertise or [],
            "industries": mentor.industries or [],
            "support_preferences": mentor.support_preferences or [],

            "mentor_statement": mentor.mentor_statement,

            "status": mentor.status,
            "mentor_category": mentor.mentor_category,
        }

        # 4. Company & Project
        company_data = None
        project_data = None
        if team:
            project_assignment = self.db.scalar(
                select(TeamProjectAssignment).where(
                    TeamProjectAssignment.team_id == team.id,
                    TeamProjectAssignment.status == "active",
                )
            )
            company = None
            project = None
            if project_assignment:
                project = self.db.scalar(
                    select(Project).where(Project.id == project_assignment.project_id)
                )
                company = self.db.scalar(
                    select(Company).where(Company.id == project_assignment.company_id)
                )
            elif team.company_id:
                company = self.db.scalar(
                    select(Company).where(Company.id == team.company_id)
                )

            if company:
                company_data = {
                    "id": str(company.id),
                    "name": company.name,
                    "industry": company.industry,
                    "website": company.website,
                    "logo_url": company.logo_url,
                    "profile": company.profile,
                    "tagline": company.tagline,
                    "accreditation": company.accreditation,
                    "category": company.category,
                    "founder_sponsor": company.founder_sponsor,
                    "founder_title": company.founder_title,
                    "public_journey_stages": company.public_journey_stages,
                    "brand_colors": company.brand_colors,
                    "reference_challenge_areas": company.reference_challenge_areas,
                }
            if project:
                    project_data = {
                        "id": str(project.id),
                        "title": project.title,
                        "description": project.description,
                        "objectives": project.objectives,
                        "expected_deliverables": project.expected_deliverables,
                        "code": project.code,
                        "challenge_area": project.challenge_area,
                        "phase": project.phase,
                        "cohort_date": str(project.cohort_date) if project.cohort_date else None,
                        "challenge_statement": project.challenge_statement,
                        "why_it_matters": project.why_it_matters,
                        "questions_to_investigate": project.questions_to_investigate,
                        "project_boundaries": project.project_boundaries,
                        "north_star_metric": project.north_star_metric,
                        "supporting_measures": project.supporting_measures,
                        "related_context_figures": project.related_context_figures,
                        "discover_timeline": project.discover_timeline,
                        "status": project.status,
                        "start_date": str(project.start_date) if project.start_date else None,
                        "end_date": str(project.end_date) if project.end_date else None,
                        "difficulty": project.difficulty,
                        "gate_schedule": project_assignment.gate_schedule,
                        "company_challenge_owner": project_assignment.company_challenge_owner,
                    }

        # 5. Stats
        sessions_attended = (
            self.db.scalar(
                select(func.count(Attendance.id)).where(
                    Attendance.student_id == student.id, Attendance.status == "present"
                )
            )
            or 0
        )
        submissions_count = 0
        if team:
            submissions_count = (
                self.db.scalar(
                    select(func.count(Submission.id)).where(Submission.team_id == team.id)
                )
                or 0
            )

        # 6. Journey Stage
        stage = "student_profile_created"
        if cohort:
            stage = "cohort_assigned"
        if team:
            stage = "team_assigned"
        if mentor_data:
            stage = "mentor_assigned"
        if project_data:
            stage = "project_assigned"
        if submissions_count > 0:
            stage = "project_in_progress"

        return {
            "student": {
                "profile_id": str(student.id),
                "student_id": student.student_id,
                "full_name": user.full_name,
                "email": user.email,
                "phone": student.phone,
                "status": user.status,
                "institution_id": str(student.institution_id),
                "institution_name": institution.name if institution else None,
                "course": student.course,
                "branch": student.branch,
                "graduation_year": student.graduation_year,
            },
            "cohort": {
                "id": str(cohort.id),
                "name": cohort.name,
                "academic_year": cohort.academic_year,
                "status": cohort.status,
            }
            if cohort
            else None,
            "team": {
                "id": str(team.id),
                "name": team.name,
                "role": team_member.role if team_member else "member",
                "members": team_members_list,
            }
            if team
            else None,
            "mentor": mentor_data,
            "company": company_data,
            "project": project_data,
            "stats": {
                "sessions_attended": sessions_attended,
                "submissions_count": submissions_count,
                "journey_stage": stage,
            },
        }

    def get_mentor_portal_context(self, user_id: UUID) -> dict:
        user = self.db.scalar(select(User).where(User.id == user_id))
        if not user:
            raise LookupError("User not found.")

        mentor = self.db.scalar(select(Mentor).where(Mentor.user_id == user_id))
        if not mentor:
            raise LookupError("Mentor profile not found.")

        # Get assigned teams
        assignments = self.db.scalars(
            select(TeamMentorAssignment).where(
                TeamMentorAssignment.mentor_id == mentor.id,
                TeamMentorAssignment.status == "active",
            )
        ).all()

        assigned_teams = []
        all_student_ids = []
        all_team_ids = [a.team_id for a in assignments]

        for a in assignments:
            team = self.db.scalar(select(Team).where(Team.id == a.team_id))
            if not team:
                continue

            cohort = self.db.scalar(select(Cohort).where(Cohort.id == team.cohort_id))
            members = self.db.scalars(
                select(TeamMember).where(TeamMember.team_id == team.id, TeamMember.left_at.is_(None))
            ).all()

            for m in members:
                all_student_ids.append(m.student_id)

            # Team Project
            proj_assignment = self.db.scalar(
                select(TeamProjectAssignment).where(
                    TeamProjectAssignment.team_id == team.id,
                    TeamProjectAssignment.status == "active",
                )
            )
            project_info = None
            if proj_assignment:
                proj = self.db.scalar(select(Project).where(Project.id == proj_assignment.project_id))
                comp = self.db.scalar(select(Company).where(Company.id == proj_assignment.company_id))
                if proj:
                    project_info = {
                        "id": str(proj.id),
                        "title": proj.title,
                        "company_name": comp.name if comp else None,
                    }

            assigned_teams.append({
                "id": str(team.id),
                "name": team.name,
                "cohort_name": cohort.name if cohort else None,
                "members_count": len(members),
                "project": project_info,
            })

        # Submissions awaiting review from assigned teams
        submissions_awaiting_review = []
        if all_team_ids:
            subs = self.db.scalars(
                select(Submission)
                .where(Submission.team_id.in_(all_team_ids), Submission.status == "submitted")
                .order_by(Submission.submitted_at.desc())
                .limit(10)
            ).all()
            for s in subs:
                submissions_awaiting_review.append({
                    "id": str(s.id),
                    "team_id": str(s.team_id),
                    "task_id": str(s.task_id) if s.task_id else None,
                    "submitted_at": str(s.submitted_at) if s.submitted_at else None,
                    "status": s.status,
                })

        return {
            "mentor": {
                "id": str(mentor.id),
                "full_name": user.full_name,
                "email": user.email,
                "company_name": mentor.company_name,
                "designation": mentor.designation,
                "expertise": mentor.expertise,
            },
            "teams": assigned_teams,
            "stats": {
                "teams_count": len(assigned_teams),
                "students_count": len(set(all_student_ids)),
                "pending_reviews_count": len(submissions_awaiting_review),
            },
            "recent_submissions": submissions_awaiting_review,
        }

    def get_student_dashboard(self, user_id: UUID) -> dict:
        user = self.db.scalar(select(User).where(User.id == user_id))
        if not user:
            raise LookupError("User not found.")

        student = self.db.scalar(
            select(StudentProfile).where(StudentProfile.user_id == user_id)
        )
        if not student:
            raise LookupError("Student profile not found.")

        institution = self.db.scalar(
            select(Institution).where(Institution.id == student.institution_id)
        )

        # 1. Cohort — try direct assignment first, then fall back to team membership
        cohort_assignment = self.db.scalar(
            select(StudentCohortAssignment)
            .where(
                StudentCohortAssignment.student_id == student.id,
                StudentCohortAssignment.status == "active",
            )
            .order_by(StudentCohortAssignment.assigned_at.desc())
        )
        cohort = None
        if cohort_assignment:
            cohort = self.db.scalar(
                select(Cohort).where(Cohort.id == cohort_assignment.cohort_id)
            )

        # 2. Team
        team_member = self.db.scalar(
            select(TeamMember)
            .where(TeamMember.student_id == student.id, TeamMember.left_at.is_(None))
        )
        team = None
        team_members_list = []
        if team_member:
            team = self.db.scalar(select(Team).where(Team.id == team_member.team_id))
            if team:
                # Fallback: resolve cohort via team if not already resolved
                if not cohort:
                    cohort = self.db.scalar(
                        select(Cohort).where(Cohort.id == team.cohort_id)
                    )
                team_members_list = self._build_team_members_list(team.id, cohort)

        # 3. Mentor
        mentor_data = None
        if team:
            mentor_assignment = self.db.scalar(
                select(TeamMentorAssignment).where(
                    TeamMentorAssignment.team_id == team.id,
                    TeamMentorAssignment.status == "active",
                )
            )
            if mentor_assignment:
                mentor = self.db.scalar(
                    select(Mentor).where(Mentor.id == mentor_assignment.mentor_id)
                )
                if mentor:
                    mentor_user = self.db.scalar(select(User).where(User.id == mentor.user_id))
                    mentor_data = {
                        "id": str(mentor.id),
                        "full_name": mentor_user.full_name if mentor_user else "Assigned Mentor",
                        "designation": mentor.designation or "Industry Mentor",
                        "company_name": mentor.company_name or "DegreeLabs Mentor Network",
                        "headshot_url": (
                            MentorHeadshotStorageService().signed_url(mentor.headshot_url)
                            if MentorHeadshotStorageService.is_storage_path(mentor.headshot_url)
                            else mentor.headshot_url
                        ),
                    }

        # 4. Assigned Company Challenge
        assigned_challenge = None
        if team:
            challenge_assignment = self.db.scalar(
                select(ChallengeAssignment).where(
                    ChallengeAssignment.team_id == team.id,
                    ChallengeAssignment.status == "active",
                )
            )
            if challenge_assignment:
                challenge = self.db.scalar(
                    select(Challenge).where(Challenge.id == challenge_assignment.challenge_id)
                )
                if challenge:
                    assigned_challenge = {
                        "id": str(challenge.id),
                        "title": challenge.title,
                        "company_name": challenge.company_name,
                        "challenge_owner": "Enterprise Challenge Sponsor",
                        "industry": "Enterprise Systems",
                        "description": challenge.description,
                        "problem_statement": challenge.problem_statement,
                        "expected_outcome": challenge.expected_outcome,
                        "difficulty": challenge.difficulty,
                        "logo_url": None,
                    }

            if not assigned_challenge:
                # Fallback to project assignment if present
                proj_assignment = self.db.scalar(
                    select(TeamProjectAssignment).where(
                        TeamProjectAssignment.team_id == team.id,
                        TeamProjectAssignment.status == "active",
                    )
                )
                if proj_assignment:
                    project = self.db.scalar(
                        select(Project).where(Project.id == proj_assignment.project_id)
                    )
                    company = self.db.scalar(
                        select(Company).where(Company.id == proj_assignment.company_id)
                    )
                    if project:
                        assigned_challenge = {
                            "id": str(project.id),
                            "title": project.title,
                            "company_name": company.name if company else "Assigned Enterprise Partner",
                            "challenge_owner": company.contact_person if (company and hasattr(company, "contact_person") and company.contact_person) else "Industry Challenge Owner",
                            "industry": company.industry if company else "Strategic Technology",
                            "description": project.description,
                            "problem_statement": project.description,
                            "expected_outcome": project.expected_deliverables,
                            "difficulty": project.difficulty,
                            "logo_url": company.logo_url if company else None,
                        }

        # If still no challenge assigned, provide default enterprise challenge spec
        if not assigned_challenge:
            assigned_challenge = {
                "id": "dlif-challenge-default",
                "title": "Scalable Supply Chain Operational Intelligence",
                "company_name": "Apex Logistics Global",
                "challenge_owner": "Director of Supply Chain Architecture",
                "industry": "Enterprise Logistics & Mobility",
                "description": "Cross-border supply chain visibility, telemetry fragmentation, and freight SLA reliability challenges.",
                "problem_statement": "Apex Logistics operates multi-modal freight corridors across 14 hubs. Disjointed telematics systems and latency in exception handling cause costly SLA penalties and blindspots in multi-carrier handoffs. The team must discover the core root cause, frame the strategic choices, and architect an actionable solution blueprint.",
                "expected_outcome": "Defensible Problem Framing Pack, WWHTBT Strategic Choice Matrix, and Execution Roadmap.",
                "difficulty": "Enterprise Strategic",
                "logo_url": None,
            }

        # 5. Sessions completed count
        attendance_count = (
            self.db.scalar(
                select(func.count(Attendance.id)).where(
                    Attendance.student_id == student.id, Attendance.status == "present"
                )
            )
            or 0
        )
        submissions_count = 0
        submissions_by_week = {}
        if team:
            subs = self.db.scalars(
                select(Submission).where(Submission.team_id == team.id)
            ).all()
            submissions_count = len(subs)
            for s in subs:
                submissions_by_week[getattr(s, "week_number", 1)] = s.status

        # Calculate progress
        completed_sessions = min(12, max(0, attendance_count))
        current_session_number = min(12, max(1, completed_sessions + 1))
        current_week_number = min(4, max(1, (current_session_number - 1) // 3 + 1))

        # 6. Load Curriculum reference data
        curriculum = DiscoverCurriculumService.load_curriculum()
        raw_weeks = curriculum.get("weeks", [])
        capabilities = curriculum.get("capabilities", [])

        # Enrich weeks with team status
        enriched_weeks = []
        for w in raw_weeks:
            wnum = w.get("week_number", 1)
            is_current = wnum == current_week_number
            is_completed = wnum < current_week_number
            sub_status = submissions_by_week.get(wnum)

            if is_completed:
                w_status = "completed"
                gate_status = "passed"
            elif is_current:
                w_status = "in_progress"
                gate_status = "pending"
                if sub_status in ["revisions_requested", "needs_revision"]:
                    gate_status = "revision_required"
                    w_status = "revision_required"
            else:
                w_status = "upcoming"
                gate_status = "locked"

            # Count sessions completed inside this specific week
            week_sessions_completed = min(3, max(0, completed_sessions - (wnum - 1) * 3))

            enriched_weeks.append({
                **w,
                "is_current": is_current,
                "is_completed": is_completed,
                "status": w_status,
                "gate_status": gate_status,
                "sessions_completed": week_sessions_completed,
                "total_sessions": 3,
            })

        # 7. Current week and session objects
        current_week_obj = next(
            (w for w in enriched_weeks if w["week_number"] == current_week_number),
            enriched_weeks[0] if enriched_weeks else {}
        )
        all_sessions = DiscoverCurriculumService.list_all_sessions()
        current_session_obj = next(
            (s for s in all_sessions if s["session_number"] == current_session_number),
            all_sessions[0] if all_sessions else {}
        )

        # 8. Upcoming sessions schedule (next 3 sessions)
        upcoming_sessions = []
        now = datetime.now(timezone.utc)

        # Pre-fetch live DB sessions for the student's cohort so we can
        # attach real scheduled_at times and Google Meet links.
        db_sessions_by_number: dict[int, SessionModel] = {}
        if cohort:
            db_sess_rows = self.db.scalars(
                select(SessionModel).where(
                    SessionModel.cohort_id == cohort.id,
                    SessionModel.status.in_(["published", "scheduled", "completed"]),
                )
            ).all()
            db_sessions_by_number = {s.session_number: s for s in db_sess_rows}

        for idx, s in enumerate(all_sessions):
            if s["session_number"] >= current_session_number and len(upcoming_sessions) < 3:
                offset_days = (idx * 2) + 1
                session_time = now + timedelta(days=offset_days, hours=4)
                # Use the real DB scheduled_at and meet_link when available.
                db_s = db_sessions_by_number.get(s["session_number"])
                real_time = db_s.scheduled_at if db_s and db_s.scheduled_at else session_time
                real_meet_link = (db_s.meet_link if db_s else None) or None
                upcoming_sessions.append({
                    "session_number": s["session_number"],
                    "week_number": s.get("week_number"),
                    "title": s["title"],
                    "session_type": s.get("session_type", "learn_work"),
                    "type_label": s.get("type_label", "Learn & Work Session"),
                    "focus": s.get("focus", ""),
                    "required_working_evidence": s.get("required_working_evidence", ""),
                    "duration_minutes": s.get("duration_minutes", 90),
                    "scheduled_at": real_time.isoformat() if hasattr(real_time, "isoformat") else real_time,
                    "formatted_date": (
                        real_time.astimezone(timezone(timedelta(hours=5, minutes=30))).strftime("%A, %d %b, %I:%M %p IST")
                        if hasattr(real_time, "astimezone")
                        else (real_time.strftime("%A, %d %b, %I:%M %p UTC") if hasattr(real_time, "strftime") else str(real_time))
                    ),
                    "meeting_link": real_meet_link,
                })

        # Prepend active approved mentor slot consultations for this team
        if team:
            approved_slots = self.db.scalars(
                select(MentorSlotRequest)
                .where(
                    MentorSlotRequest.team_id == team.id,
                    MentorSlotRequest.status == "approved",
                    MentorSlotRequest.confirmed_start_time.is_not(None),
                    MentorSlotRequest.confirmed_start_time >= (now - timedelta(hours=2)),
                )
                .order_by(MentorSlotRequest.confirmed_start_time.asc())
            ).all()

            for slot in approved_slots:
                start_dt = slot.confirmed_start_time
                end_dt = slot.confirmed_end_time or (start_dt + timedelta(minutes=45))
                dur = max(15, int((end_dt - start_dt).total_seconds() / 60))
                upcoming_sessions.insert(0, {
                    "session_number": "Mentor Slot",
                    "week_number": current_week_number,
                    "title": f"Mentor Consultation: {slot.topic}",
                    "session_type": "mentor_slot",
                    "type_label": "Mentor Consultation Slot",
                    "focus": f"Team consultation agenda: {slot.topic}",
                    "required_working_evidence": "Consultation notes and actionable sprint steps",
                    "duration_minutes": dur,
                    "scheduled_at": start_dt.isoformat(),
                    "formatted_date": (
                        start_dt.astimezone(timezone(timedelta(hours=5, minutes=30))).strftime("%A, %d %b, %I:%M %p IST")
                        if hasattr(start_dt, "astimezone")
                        else start_dt.strftime("%A, %d %b, %I:%M %p UTC")
                    ),
                    "meeting_link": slot.meet_link,
                })

        # 9. Next Action banner calculation
        is_gate_session = current_session_obj.get("session_type") == "output_review_gate"
        has_revision_requested = current_week_obj.get("gate_status") == "revision_required"

        if has_revision_requested:
            next_action = {
                "title": f"Quality Gate Alert: Revisions Required for Week {current_week_number}",
                "desc": f"The Review Committee requested revisions for '{current_week_obj.get('output_title')}'. Update evidence before advancing.",
                "link": f"/student/deliverables?week={current_week_number}",
                "btn_text": "Review Gate Feedback",
                "alert_level": "warning",
                "is_gate_alert": True,
            }
        elif is_gate_session:
            next_action = {
                "title": f"Quality Gate Review: {current_session_obj.get('title')}",
                "desc": f"Output Pack due: '{current_week_obj.get('output_title')}'. Gate rule: {current_week_obj.get('quality_gate', {}).get('rule')}",
                "link": f"/student/deliverables?week={current_week_number}",
                "btn_text": "Submit Gate Deliverable",
                "alert_level": "gate",
                "is_gate_alert": True,
            }
        else:
            next_action = {
                "title": f"Working Evidence Due for Session {current_session_number}",
                "desc": f"Complete: {current_session_obj.get('required_working_evidence')}",
                "link": f"/student/templates?week={current_week_number}",
                "btn_text": "Open Session Templates",
                "alert_level": "info",
                "is_gate_alert": False,
            }

        # 10. Current week templates + ongoing templates
        current_templates = current_week_obj.get("templates", [])
        ongoing_deliverables = curriculum.get("ongoing_deliverables", [])

        return {
            "student": {
                "id": str(student.id),
                "full_name": user.full_name,
                "email": user.email,
                "student_id": student.student_id,
                "institution_name": institution.name if institution else "DegreeLabs Impact Network",
                "status": user.status,
            },
            "team": {
                "id": str(team.id) if team else "unassigned",
                "name": team.name if team else "Discover Fellow Squad",
                "current_week": current_week_number,
                "current_session": current_session_number,
                "members_count": len(team_members_list) if team_members_list else 5,
                "members": team_members_list,
            },
            "cohort": {
                "name": cohort.name if cohort else "Discover Cohort 2026",
                "status": cohort.status if cohort else "active",
            },
            "mentor": mentor_data or {
                "full_name": "Senior Enterprise Advisor",
                "designation": "Dedicated Strategy Mentor",
                "company_name": "DegreeLabs Mentor Council",
                "headshot_url": None,
            },
            "assigned_challenge": assigned_challenge,
            "current_week": current_week_obj,
            "current_session": current_session_obj,
            "weeks": enriched_weeks,
            "upcoming_sessions": upcoming_sessions,
            "next_action": next_action,
            "capabilities": capabilities,
            "templates": current_templates,
            "ongoing_deliverables": ongoing_deliverables,
            "metrics": {
                "completed_sessions": completed_sessions,
                "total_sessions": 12,
                "completed_outputs": sum(1 for w in enriched_weeks if w.get("gate_status") == "passed"),
                "total_outputs": 4,
                "assigned_mentor": mentor_data["full_name"] if mentor_data else "Assigned Dedicated Mentor",
            },
        }

