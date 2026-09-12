from __future__ import annotations

import os
import tempfile
from pathlib import Path
from typing import BinaryIO, Literal

from app.core.config import Settings, settings
from app.services.enrollment_sources.excel import LocalExcelEnrollmentSource


class EnrollmentUploadError(ValueError):
    """Raised when an uploaded enrollment workbook is invalid or unsafe."""


class EnrollmentWorkbookUploadService:
    def __init__(self, config: Settings = settings) -> None:
        self.config = config

    def save(
        self,
        filename: str | None,
        source_file: BinaryIO,
        *,
        entity: Literal["students", "mentors", "both"] = "both",
    ) -> Path:
        if not filename or Path(filename).suffix.lower() != ".xlsx":
            raise EnrollmentUploadError("Only .xlsx enrollment workbooks are accepted.")

        destination_value = (
            self.config.enrollment_excel_source.strip()
            or self.config.enrollment_upload_source.strip()
        )
        if not destination_value:
            raise EnrollmentUploadError("No destination is configured for uploaded workbooks.")
        destination = Path(destination_value).expanduser().resolve()
        destination.parent.mkdir(parents=True, exist_ok=True)
        max_bytes = max(1, self.config.enrollment_upload_max_mb) * 1024 * 1024
        temporary_path: Path | None = None

        try:
            with tempfile.NamedTemporaryFile(
                mode="wb",
                suffix=".xlsx",
                prefix="enrollment-upload-",
                dir=destination.parent,
                delete=False,
            ) as temporary_file:
                temporary_path = Path(temporary_file.name)
                total_bytes = 0
                while chunk := source_file.read(1024 * 1024):
                    total_bytes += len(chunk)
                    if total_bytes > max_bytes:
                        raise EnrollmentUploadError(
                            f"Workbook exceeds the {self.config.enrollment_upload_max_mb} MB limit."
                        )
                    temporary_file.write(chunk)

            if total_bytes == 0:
                raise EnrollmentUploadError("The uploaded workbook is empty.")

            uploaded_rows = LocalExcelEnrollmentSource(
                str(temporary_path),
                self.config.enrollment_student_sheet,
                self.config.enrollment_mentor_sheet,
                include_students=entity in ("students", "both"),
                include_mentors=entity in ("mentors", "both"),
                allow_missing_sheets=True,
            ).read()
            if entity == "students" and not uploaded_rows.students:
                raise EnrollmentUploadError(
                    f"Workbook must contain at least one row in the '{self.config.enrollment_student_sheet}' sheet."
                )
            if entity == "mentors" and not uploaded_rows.mentors:
                raise EnrollmentUploadError(
                    f"Workbook must contain at least one row in the '{self.config.enrollment_mentor_sheet}' sheet."
                )
            if entity == "both" and not (uploaded_rows.students or uploaded_rows.mentors):
                raise EnrollmentUploadError("Workbook does not contain any enrollment rows.")
            os.replace(temporary_path, destination)
            temporary_path = None
            return destination
        except EnrollmentUploadError:
            raise
        except (OSError, ValueError) as exc:
            raise EnrollmentUploadError(
                "The uploaded workbook could not be read or validated."
            ) from exc
        finally:
            if temporary_path is not None:
                temporary_path.unlink(missing_ok=True)
