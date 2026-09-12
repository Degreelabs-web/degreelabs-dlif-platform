from app.core.config import Settings, settings
from app.services.enrollment_sources.base import EnrollmentSource
from app.services.enrollment_sources.excel import LocalExcelEnrollmentSource
from app.services.enrollment_sources.google_sheets import GoogleSheetsMentorSource


def build_enrollment_source(config: Settings = settings) -> EnrollmentSource:
    source_type = config.enrollment_excel_source_type.strip().lower()
    if source_type == "local":
        return LocalExcelEnrollmentSource(
            source=config.enrollment_excel_source,
            student_sheet=config.enrollment_student_sheet,
            mentor_sheet=config.enrollment_mentor_sheet,
        )
    if source_type == "google_sheets":
        return GoogleSheetsMentorSource(
            spreadsheet_id=config.enrollment_google_spreadsheet_id,
            mentor_range=config.enrollment_google_mentor_range,
            service_account_file=config.enrollment_google_service_account_file,
        )

    raise ValueError(f"Unsupported enrollment source type '{source_type}'.")
