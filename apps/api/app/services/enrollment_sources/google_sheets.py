from __future__ import annotations

from pathlib import Path
from typing import Callable, Protocol
from urllib.parse import quote

import httpx

from app.services.enrollment_sources.base import WorkbookRows, normalize_header


GOOGLE_SHEETS_READ_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly"


class HttpClient(Protocol):
    def get(self, url: str, **kwargs) -> httpx.Response:
        """Send a GET request."""


class GoogleSheetsMentorSource:
    source_type = "google_sheets"

    def __init__(
        self,
        *,
        spreadsheet_id: str,
        mentor_range: str,
        service_account_file: str,
        access_token_provider: Callable[[], str] | None = None,
        http_client: HttpClient | None = None,
    ) -> None:
        self.spreadsheet_id = spreadsheet_id.strip()
        self.mentor_range = mentor_range.strip()
        self.service_account_file = Path(service_account_file).expanduser()
        self.access_token_provider = access_token_provider
        self.http_client = http_client or httpx

    def is_configured(self) -> bool:
        credentials_available = (
            self.access_token_provider is not None
            or self.service_account_file.is_file()
        )
        return bool(self.spreadsheet_id and self.mentor_range and credentials_available)

    def read(self) -> WorkbookRows:
        if not self.is_configured():
            raise FileNotFoundError(
                "The Google Sheets mentor source or its service-account credentials "
                "are not configured."
            )

        token = (
            self.access_token_provider()
            if self.access_token_provider is not None
            else self._service_account_access_token()
        )
        encoded_range = quote(self.mentor_range, safe="")
        url = (
            "https://sheets.googleapis.com/v4/spreadsheets/"
            f"{quote(self.spreadsheet_id, safe='')}/values/{encoded_range}"
        )
        response = self.http_client.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            params={"majorDimension": "ROWS"},
            timeout=20.0,
        )
        if response.status_code >= 400:
            raise ValueError(
                f"Google Sheets API returned status {response.status_code}. "
                "Confirm that the sheet is shared with the configured service account."
            )

        payload = response.json()
        values = payload.get("values", [])
        if not isinstance(values, list):
            raise ValueError("Google Sheets returned an invalid rows payload.")

        return WorkbookRows(students=[], mentors=self._records(values))

    @staticmethod
    def _records(values: list[object]) -> list[dict[str, object]]:
        if not values:
            return []
        header_row = values[0]
        if not isinstance(header_row, list):
            raise ValueError("The Google Sheets mentor header row is invalid.")

        headers = [normalize_header(value) for value in header_row]
        records: list[dict[str, object]] = []
        for row_number, raw_values in enumerate(values[1:], start=2):
            if not isinstance(raw_values, list):
                continue
            record = {
                header: value
                for header, value in zip(headers, raw_values, strict=False)
                if header
            }
            if any(value not in (None, "") for value in record.values()):
                record["_row_number"] = row_number
                records.append(record)
        return records

    def _service_account_access_token(self) -> str:
        try:
            from google.auth.transport.requests import Request
            from google.oauth2.service_account import Credentials
        except ImportError as exc:  # pragma: no cover - deployment dependency guard
            raise RuntimeError(
                "google-auth is required for the private Google Sheets source."
            ) from exc

        credentials = Credentials.from_service_account_file(
            str(self.service_account_file),
            scopes=[GOOGLE_SHEETS_READ_SCOPE],
        )
        credentials.refresh(Request())
        if not credentials.token:
            raise RuntimeError("Google did not issue an access token.")
        return credentials.token
