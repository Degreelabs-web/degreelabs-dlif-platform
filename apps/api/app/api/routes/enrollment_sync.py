import logging
import secrets
from pathlib import Path
from typing import Literal

# pyrefly: ignore [missing-import]
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    Header,
    HTTPException,
    Query,
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
    MentorGoogleFormWebhookRequest,
)
from app.schemas.mentor import MentorCategory
from app.services.enrollment_sources import build_enrollment_source
from app.services.enrollment_sources.excel import LocalExcelEnrollmentSource
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

def _run_mentor_submission_background(
    values: dict[str, object],
) -> None:
    db = SessionLocal()

    try:
        EnrollmentSyncService(db).run_mentor_submission(
            values,
            trigger="google_form",
        )
    except Exception:
        logger.exception(
            "Google Form mentor synchronization failed."
        )
    finally:
        db.close()


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


def _run_uploaded_workbook_sync(
    workbook_path: str,
    entity: Literal["students", "mentors", "both"],
    mentor_category: MentorCategory = "dlif",
    trigger: str = "upload",
) -> None:
    db = SessionLocal()
    try:
        source = LocalExcelEnrollmentSource(
            workbook_path,
            settings.enrollment_student_sheet,
            settings.enrollment_mentor_sheet,
            include_students=entity in ("students", "both"),
            include_mentors=entity in ("mentors", "both"),
            allow_missing_sheets=True,
            mentor_category=mentor_category if entity in ("mentors", "both") else None,
        )
        EnrollmentSyncService(db, source=source).run(trigger=trigger)
    except Exception:
        logger.exception("Uploaded workbook synchronization failed.")
    finally:
        db.close()


@router.get("/status", response_model=EnrollmentSyncStatusResponse)
def get_enrollment_sync_status(
    mentor_category: MentorCategory | None = None,
    _current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    uploaded_workbook = Path(settings.enrollment_upload_source).expanduser()
    has_uploaded_workbook = uploaded_workbook.is_file()
    try:
        source = build_enrollment_source()
        connected = source.is_configured()
        source_type = source.source_type
    except ValueError:
        connected = False
        source_type = settings.enrollment_excel_source_type

    if not connected and has_uploaded_workbook:
        connected = True
        source_type = "uploaded_excel"

    latest_run = db.scalar(
        select(EnrollmentSyncRun).order_by(EnrollmentSyncRun.started_at.desc())
    )
    enrolled_students = db.scalar(
        select(func.count(StudentProfile.id))
    ) or 0
    mentor_count_statement = select(func.count(Mentor.id))
    if mentor_category is not None:
        mentor_count_statement = mentor_count_statement.where(
            Mentor.mentor_category == mentor_category
        )
    enrolled_mentors = db.scalar(mentor_count_statement) or 0

    return EnrollmentSyncStatusResponse(
        enabled=settings.enrollment_sync_enabled,
        connected=connected,
        upload_enabled=True,
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
    entity: Literal["students", "mentors", "both"] = Query(default="both"),
    mentor_category: MentorCategory = Query(default="dlif"),
    _current_admin: User = Depends(require_admin),
):
    try:
        source = build_enrollment_source()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    if source.is_configured():
        background_tasks.add_task(_run_sync_background, "manual")
    else:
        uploaded_workbook = Path(settings.enrollment_upload_source).expanduser()
        if not uploaded_workbook.is_file():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Upload an enrollment workbook before using Sync Now.",
            )
        background_tasks.add_task(
            _run_uploaded_workbook_sync,
            str(uploaded_workbook),
            entity,
            mentor_category,
            "manual",
        )
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
    entity: Literal["students", "mentors", "both"] = Form(default="both"),
    mentor_category: MentorCategory = Form(default="dlif"),
    _current_admin: User = Depends(require_admin),
):
    try:
        workbook_path = EnrollmentWorkbookUploadService().save(
            workbook.filename,
            workbook.file,
            entity=entity,
        )
    except EnrollmentUploadError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    finally:
        workbook.file.close()

    background_tasks.add_task(
        _run_uploaded_workbook_sync,
        str(workbook_path),
        entity,
        mentor_category,
    )
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
    payload: MentorGoogleFormWebhookRequest,
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

    background_tasks.add_task(
        _run_mentor_submission_background,
        payload.values,
    )

    return EnrollmentSyncTriggerResponse(
        accepted=True,
        message="Google Form mentor submission was queued.",
    )
