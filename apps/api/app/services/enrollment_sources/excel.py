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
        *,
        include_students: bool = True,
        include_mentors: bool = True,
        allow_missing_sheets: bool = False,
        mentor_category: str | None = None,
    ) -> None:
        self.path = Path(source).expanduser()
        self.student_sheet = student_sheet
        self.mentor_sheet = mentor_sheet
        self.include_students = include_students
        self.include_mentors = include_mentors
        self.allow_missing_sheets = allow_missing_sheets
        self.mentor_category = mentor_category

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
            students = (
                self._read_sheet(workbook, self.student_sheet)
                if self.include_students
                else []
            )
            mentors = (
                self._read_sheet(
                    workbook,
                    self.mentor_sheet,
                    aliases=("Form responses 1",),
                )
                if self.include_mentors
                else []
            )
            if self.mentor_category:
                mentors = [
                    {**row, "mentor_category": self.mentor_category}
                    for row in mentors
                ]
            return WorkbookRows(students=students, mentors=mentors)
        finally:
            workbook.close()

    def _read_sheet(
        self,
        workbook,
        sheet_name: str,
        *,
        aliases: tuple[str, ...] = (),
    ) -> list[dict[str, object]]:
        resolved_sheet_name = next(
            (
                candidate
                for candidate in (sheet_name, *aliases)
                if candidate in workbook.sheetnames
            ),
            None,
        )
        if resolved_sheet_name is None:
            if self.allow_missing_sheets:
                return []
            raise ValueError(f"Workbook sheet '{sheet_name}' was not found.")

        worksheet = workbook[resolved_sheet_name]
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
