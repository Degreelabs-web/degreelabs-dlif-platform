import logging
import secrets

# pyrefly: ignore [missing-import]
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Header,
    HTTPException,
    UploadFile,
    status,
)
# pyrefly: ignore [missing-import]
from sqlalchemy import func, select
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rbac import require_admin
from app.db.models.enrollment_sync_run import EnrollmentSyncRun
from app.db.models.mentor import Mentor
from app.db.models.student_profile import StudentProfile
from app.db.models.user import User
from app.db.session import SessionLocal, get_db
from app.schemas.enrollment_sync import (
    EnrollmentSyncStatusResponse,
    EnrollmentSyncTriggerResponse,
)
from app.services.enrollment_sources import build_enrollment_source
from app.services.enrollment_sync import (
    EnrollmentSyncAlreadyRunning,
    EnrollmentSyncService,
)
from app.services.enrollment_upload import (
    EnrollmentUploadError,
    EnrollmentWorkbookUploadService,
)


router = APIRouter(prefix="/admin/enrollment-sync")
logger = logging.getLogger(__name__)


def _run_sync_background(trigger: str = "manual") -> None:
    db = SessionLocal()
    try:
        EnrollmentSyncService(db).run(trigger=trigger)
    except EnrollmentSyncAlreadyRunning:
        logger.info("Enrollment sync request skipped because another run is active.")
    except Exception:
        logger.exception("Background enrollment synchronization failed.")
    finally:
        db.close()


@router.get("/status", response_model=EnrollmentSyncStatusResponse)
def get_enrollment_sync_status(
    _current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        source = build_enrollment_source()
        connected = source.is_configured()
        source_type = source.source_type
    except ValueError:
        connected = False
        source_type = settings.enrollment_excel_source_type

    latest_run = db.scalar(
        select(EnrollmentSyncRun).order_by(EnrollmentSyncRun.started_at.desc())
    )
    enrolled_students = db.scalar(
        select(func.count(StudentProfile.id))
    ) or 0
    enrolled_mentors = db.scalar(
        select(func.count(Mentor.id))
    ) or 0

    return EnrollmentSyncStatusResponse(
        enabled=settings.enrollment_sync_enabled,
        connected=connected,
        upload_enabled=(
            source_type.strip().lower() == "local"
            and bool(settings.enrollment_excel_source.strip())
        ),
        source_type=source_type,
        enrolled_students=enrolled_students,
        enrolled_mentors=enrolled_mentors,
        latest_run=latest_run,
    )


@router.post(
    "",
    response_model=EnrollmentSyncTriggerResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def trigger_enrollment_sync(
    background_tasks: BackgroundTasks,
    _current_admin: User = Depends(require_admin),
):
    try:
        source = build_enrollment_source()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    if not source.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The enrollment workbook source is not configured or available.",
        )

    background_tasks.add_task(_run_sync_background, "manual")
    return EnrollmentSyncTriggerResponse(
        accepted=True,
        message="Enrollment synchronization was queued.",
    )


@router.post(
    "/upload",
    response_model=EnrollmentSyncTriggerResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def upload_enrollment_workbook(
    background_tasks: BackgroundTasks,
    workbook: UploadFile = File(...),
    _current_admin: User = Depends(require_admin),
):
    try:
        EnrollmentWorkbookUploadService().save(workbook.filename, workbook.file)
    except EnrollmentUploadError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    finally:
        workbook.file.close()

    background_tasks.add_task(_run_sync_background, "upload")
    return EnrollmentSyncTriggerResponse(
        accepted=True,
        message="Workbook uploaded and enrollment synchronization queued.",
    )


@router.post(
    "/google-form",
    response_model=EnrollmentSyncTriggerResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def notify_google_form_response(
    background_tasks: BackgroundTasks,
    ingestion_secret: str | None = Header(
        default=None,
        alias="X-DLIF-Ingestion-Secret",
    ),
):
    configured_secret = settings.enrollment_google_webhook_secret
    if not configured_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google Form event ingestion is not configured.",
        )
    if not ingestion_secret or not secrets.compare_digest(
        ingestion_secret,
        configured_secret,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid ingestion secret.",
        )

    try:
        source = build_enrollment_source()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    if source.source_type != "google_sheets" or not source.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The private Google Sheets mentor source is not configured.",
        )

    background_tasks.add_task(_run_sync_background, "google_form")
    return EnrollmentSyncTriggerResponse(
        accepted=True,
        message="Google Form mentor synchronization was queued.",
    )
