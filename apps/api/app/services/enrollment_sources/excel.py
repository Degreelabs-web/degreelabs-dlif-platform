from pathlib import Path

from openpyxl import load_workbook

from app.services.enrollment_sources.base import WorkbookRows, normalize_header


class LocalExcelEnrollmentSource:
    source_type = "local"

    def __init__(
        self,
        source: str,
        student_sheet: str,
        mentor_sheet: str,
    ) -> None:
        self.path = Path(source).expanduser()
        self.student_sheet = student_sheet
        self.mentor_sheet = mentor_sheet

    def is_configured(self) -> bool:
        return bool(str(self.path)) and self.path.is_file()

    def read(self) -> WorkbookRows:
        if not self.is_configured():
            raise FileNotFoundError(
                "The configured enrollment workbook could not be found."
            )

        workbook = load_workbook(
            filename=self.path,
            read_only=True,
            data_only=True,
        )
        try:
            return WorkbookRows(
                students=self._read_sheet(workbook, self.student_sheet),
                mentors=self._read_sheet(workbook, self.mentor_sheet),
            )
        finally:
            workbook.close()

    @staticmethod
    def _read_sheet(workbook, sheet_name: str) -> list[dict[str, object]]:
        if sheet_name not in workbook.sheetnames:
            raise ValueError(f"Workbook sheet '{sheet_name}' was not found.")

        worksheet = workbook[sheet_name]
        rows = worksheet.iter_rows(values_only=True)
        try:
            header_row = next(rows)
        except StopIteration:
            return []

        headers = [normalize_header(value) for value in header_row]
        if not any(headers):
            return []

        result: list[dict[str, object]] = []
        for row_number, values in enumerate(rows, start=2):
            record = {
                header: value
                for header, value in zip(headers, values, strict=False)
                if header
            }
            if any(value not in (None, "") for value in record.values()):
                record["_row_number"] = row_number
                result.append(record)
        return result
