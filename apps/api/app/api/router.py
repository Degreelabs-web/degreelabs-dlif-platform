from fastapi import APIRouter

from app.api.routes.attendance import router as attendance_router
from app.api.routes.auth import router as auth_router
from app.api.routes.challenge_assignments import (
    router as challenge_assignments_router,
)
from app.api.routes.challenges import router as challenges_router
from app.api.routes.cohorts import router as cohorts_router
from app.api.routes.companies import router as companies_router
from app.api.routes.enrollments import router as enrollments_router
from app.api.routes.enrollment_sync import router as enrollment_sync_router
from app.api.routes.feedback import router as feedback_router
from app.api.routes.health import router as health_router
from app.api.routes.institutions import router as institutions_router
from app.api.routes.mentors import router as mentors_router
from app.api.routes.portal import router as portal_router
from app.api.routes.projects import router as projects_router
from app.api.routes.recordings import router as recordings_router
from app.api.routes.sessions import router as sessions_router
from app.api.routes.student_cohort_assignments import (
    router as student_cohort_assignments_router,
)
from app.api.routes.students import router as students_router
from app.api.routes.submissions import router as submissions_router
from app.api.routes.team_assignments import router as team_assignments_router
from app.api.routes.teams import router as teams_router


api_router = APIRouter(prefix="/api/v1")


api_router.include_router(
    health_router,
    tags=["Health"],
)

api_router.include_router(
    institutions_router,
    tags=["Institutions"],
)

api_router.include_router(
    cohorts_router,
    tags=["Cohorts"],
)

api_router.include_router(
    students_router,
    tags=["Students"],
)

api_router.include_router(
    enrollments_router,
    tags=["Enrollments"],
)

api_router.include_router(
    enrollment_sync_router,
    tags=["Enrollment Sync"],
)

api_router.include_router(
    teams_router,
    tags=["Teams"],
)

api_router.include_router(
    mentors_router,
    tags=["Mentors"],
)

api_router.include_router(
    companies_router,
    tags=["Companies"],
)

api_router.include_router(
    projects_router,
    tags=["Projects"],
)

api_router.include_router(
    team_assignments_router,
    tags=["Team Assignments"],
)

api_router.include_router(
    student_cohort_assignments_router,
    tags=["Student Cohort Assignments"],
)

api_router.include_router(
    portal_router,
    tags=["Portal Experience"],
)

api_router.include_router(
    challenges_router,
    tags=["Challenges"],
)

api_router.include_router(
    challenge_assignments_router,
    tags=["Challenge Assignments"],
)

api_router.include_router(
    sessions_router,
    tags=["Sessions"],
)

api_router.include_router(
    submissions_router,
    tags=["Submissions"],
)

api_router.include_router(
    feedback_router,
    tags=["Feedback"],
)

api_router.include_router(
    attendance_router,
    tags=["Attendance"],
)

api_router.include_router(
    recordings_router,
    tags=["Recordings"],
)

api_router.include_router(auth_router)



