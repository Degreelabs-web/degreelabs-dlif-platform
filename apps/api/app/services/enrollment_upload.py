from __future__ import annotations

import os
import tempfile
from pathlib import Path
from typing import BinaryIO

from app.core.config import Settings, settings
from app.services.enrollment_sources.excel import LocalExcelEnrollmentSource


class EnrollmentUploadError(ValueError):
    """Raised when an uploaded enrollment workbook is invalid or unsafe."""


class EnrollmentWorkbookUploadService:
    def __init__(self, config: Settings = settings) -> None:
        self.config = config

    def save(self, filename: str | None, source_file: BinaryIO) -> Path:
        if self.config.enrollment_excel_source_type.strip().lower() != "local":
            raise EnrollmentUploadError(
                "Browser uploads are available only for the local workbook source."
            )
        if not filename or Path(filename).suffix.lower() != ".xlsx":
            raise EnrollmentUploadError("Only .xlsx enrollment workbooks are accepted.")
        if not self.config.enrollment_excel_source.strip():
            raise EnrollmentUploadError(
                "ENROLLMENT_EXCEL_SOURCE must be configured before uploading."
            )

        destination = Path(self.config.enrollment_excel_source).expanduser().resolve()
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

            LocalExcelEnrollmentSource(
                str(temporary_path),
                self.config.enrollment_student_sheet,
                self.config.enrollment_mentor_sheet,
            ).read()
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
