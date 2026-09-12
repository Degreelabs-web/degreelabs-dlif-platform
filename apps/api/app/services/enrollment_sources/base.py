from dataclasses import dataclass
import re
from typing import Protocol


@dataclass(frozen=True)
class WorkbookRows:
    students: list[dict[str, object]]
    mentors: list[dict[str, object]]


class EnrollmentSource(Protocol):
    source_type: str

    def read(self) -> WorkbookRows:
        """Read student and mentor rows from the configured enrollment source."""

    def is_configured(self) -> bool:
        """Return whether this source has enough configuration to be read."""


def normalize_header(value: object | None) -> str:
    if value is None:
        return ""
    return re.sub(r"[^a-z0-9]+", "_", str(value).strip().lower()).strip("_")
