from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models.attendance import Attendance
from app.db.models.cohort import Cohort
from app.db.models.company import Company
from app.db.models.institution import Institution
from app.db.models.mentor import Mentor
from app.db.models.project import Project
from app.db.models.student_cohort_assignment import StudentCohortAssignment
from app.db.models.student_profile import StudentProfile
from app.db.models.submission import Submission
from app.db.models.team import Team
from app.db.models.team_member import TeamMember
from app.db.models.team_mentor_assignment import TeamMentorAssignment
from app.db.models.team_project_assignment import TeamProjectAssignment
from app.db.models.user import User


class PortalExperienceService:
    def __init__(self, db: Session):
        self.db = db

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
            all_members = self.db.scalars(
                select(TeamMember).where(TeamMember.team_id == team.id, TeamMember.left_at.is_(None))
            ).all()
            for m in all_members:
                sp = self.db.scalar(select(StudentProfile).where(StudentProfile.id == m.student_id))
                u = self.db.scalar(select(User).where(User.id == sp.user_id)) if sp else None
                team_members_list.append({
                    "student_id": str(m.student_id),
                    "name": u.full_name if u else "Team Member",
                    "role": m.role,
                })

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
                        "designation": mentor.designation,
                        "company_name": mentor.company_name,
                        "email": mentor_user.email if mentor_user else None,
                        "linkedin_url": mentor.linkedin_url,
                        "expertise": mentor.expertise,
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
            if project_assignment:
                project = self.db.scalar(
                    select(Project).where(Project.id == project_assignment.project_id)
                )
                company = self.db.scalar(
                    select(Company).where(Company.id == project_assignment.company_id)
                )
                if company:
                    company_data = {
                        "id": str(company.id),
                        "name": company.name,
                        "industry": company.industry,
                        "website": company.website,
                        "logo_url": company.logo_url,
                        "profile": company.profile,
                    }
                if project:
                    project_data = {
                        "id": str(project.id),
                        "title": project.title,
                        "description": project.description,
                        "objectives": project.objectives,
                        "expected_deliverables": project.expected_deliverables,
                        "status": project.status,
                        "start_date": str(project.start_date) if project.start_date else None,
                        "end_date": str(project.end_date) if project.end_date else None,
                        "difficulty": project.difficulty,
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
