"""Google Calendar / Meet integration service.

Uses OAuth 2.0 with a long-lived refresh token belonging to a dedicated
scheduling account (e.g. scheduling@yourorg.com).  Credentials are read
exclusively from environment variables — nothing is ever sent to the
frontend.

Required env vars (see .env.example):
    GOOGLE_MEET_ENABLED          – must be "true" to activate
    GOOGLE_CALENDAR_CLIENT_ID
    GOOGLE_CALENDAR_CLIENT_SECRET
    GOOGLE_CALENDAR_REFRESH_TOKEN
    GOOGLE_CALENDAR_ID           – defaults to "primary"
    GOOGLE_CALENDAR_TIMEZONE     – IANA name, defaults to "UTC"
"""

from __future__ import annotations

import logging
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING

import requests

from app.core.config import settings

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
_CALENDAR_BASE = "https://www.googleapis.com/calendar/v3"

# How many seconds before expiry we proactively refresh the access token.
_TOKEN_REFRESH_BUFFER = 60

# Retry config for transient Google API errors (429 / 5xx).
_MAX_RETRIES = 3
_RETRY_BACKOFF_BASE = 2  # seconds


# ---------------------------------------------------------------------------
# Simple in-process token cache (sufficient for single-process uvicorn).
# For multi-worker deployments, move this to Redis / shared cache.
# ---------------------------------------------------------------------------

_cached_access_token: str | None = None
_cached_token_expiry: float = 0.0  # Unix timestamp


def _get_access_token() -> str:
    """Return a valid OAuth2 access token, refreshing when near expiry."""
    global _cached_access_token, _cached_token_expiry

    now = time.time()
    if _cached_access_token and now < _cached_token_expiry - _TOKEN_REFRESH_BUFFER:
        return _cached_access_token

    resp = requests.post(
        _TOKEN_ENDPOINT,
        data={
            "client_id": settings.google_calendar_client_id,
            "client_secret": settings.google_calendar_client_secret,
            "refresh_token": settings.google_calendar_refresh_token,
            "grant_type": "refresh_token",
        },
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()

    _cached_access_token = data["access_token"]
    # Google returns expires_in in seconds; default to 3600 if missing.
    expires_in = int(data.get("expires_in", 3600))
    _cached_token_expiry = now + expires_in

    logger.debug("Google OAuth2 access token refreshed (expires in %ss)", expires_in)
    return _cached_access_token


def _auth_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {_get_access_token()}"}


def _request_with_retry(
    method: str,
    url: str,
    *,
    params: dict | None = None,
    json: dict | None = None,
) -> requests.Response:
    """Execute an HTTP request with exponential-backoff retry on 429/5xx."""
    for attempt in range(_MAX_RETRIES):
        try:
            resp = requests.request(
                method,
                url,
                headers=_auth_headers(),
                params=params,
                json=json,
                timeout=20,
            )
            if resp.status_code == 429 or resp.status_code >= 500:
                wait = _RETRY_BACKOFF_BASE ** attempt
                logger.warning(
                    "Google API %s %s → %s; retrying in %ss (attempt %s/%s)",
                    method,
                    url,
                    resp.status_code,
                    wait,
                    attempt + 1,
                    _MAX_RETRIES,
                )
                time.sleep(wait)
                continue
            return resp
        except requests.RequestException as exc:
            if attempt == _MAX_RETRIES - 1:
                raise
            wait = _RETRY_BACKOFF_BASE ** attempt
            logger.warning("Google API request error: %s; retrying in %ss", exc, wait)
            time.sleep(wait)
    # Should not reach here, but satisfy the type checker.
    raise RuntimeError("Google API request failed after retries")


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------


def is_enabled() -> bool:
    """Return True only when credentials are fully configured."""
    return (
        settings.google_meet_enabled
        and bool(settings.google_calendar_client_id)
        and bool(settings.google_calendar_client_secret)
        and bool(settings.google_calendar_refresh_token)
    )


def _build_event_body(
    title: str,
    scheduled_at: datetime,
    duration_minutes: int,
    request_id: str | None = None,
) -> dict:
    """Build the Calendar event JSON payload."""
    start_dt = scheduled_at.astimezone(timezone.utc)
    end_dt = start_dt + timedelta(minutes=duration_minutes)

    return {
        "summary": title,
        "start": {
            "dateTime": start_dt.strftime("%Y-%m-%dT%H:%M:%S") + "Z",
            "timeZone": settings.google_calendar_timezone,
        },
        "end": {
            "dateTime": end_dt.strftime("%Y-%m-%dT%H:%M:%S") + "Z",
            "timeZone": settings.google_calendar_timezone,
        },
        "conferenceData": {
            "createRequest": {
                # A unique ID per create request ensures idempotency.
                "requestId": request_id or str(uuid.uuid4()),
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        },
    }


def _extract_meet_link(event: dict) -> str | None:
    """Pull the Meet URL out of a Calendar event response."""
    # Primary field — almost always populated.
    if event.get("hangoutLink"):
        return event["hangoutLink"]
    # Fallback: walk conferenceData entry points.
    for ep in (
        event.get("conferenceData", {}).get("entryPoints", [])
    ):
        if ep.get("entryPointType") == "video":
            return ep.get("uri")
    return None


def create_meet(
    *,
    title: str,
    scheduled_at: datetime,
    duration_minutes: int,
) -> tuple[str, str]:
    """Create a Google Calendar event with a Meet link.

    Returns:
        (google_event_id, meet_link)

    Raises:
        RuntimeError: on API or auth failure.
    """
    if not is_enabled():
        raise RuntimeError("Google Meet integration is not enabled.")

    calendar_id = settings.google_calendar_id
    url = f"{_CALENDAR_BASE}/calendars/{calendar_id}/events"
    body = _build_event_body(title, scheduled_at, duration_minutes)

    resp = _request_with_retry(
        "POST",
        url,
        params={"conferenceDataVersion": "1"},
        json=body,
    )

    if not resp.ok:
        raise RuntimeError(
            f"Google Calendar API error {resp.status_code}: {resp.text[:400]}"
        )

    event = resp.json()
    meet_link = _extract_meet_link(event)
    if not meet_link:
        raise RuntimeError(
            "Google Calendar event created but no Meet link returned. "
            "Ensure 'conferenceDataVersion=1' was sent and the account has "
            "Google Meet enabled."
        )

    logger.info(
        "Created Google Meet: event_id=%s link=%s", event["id"], meet_link
    )
    return event["id"], meet_link


def update_meet(
    *,
    google_event_id: str,
    title: str,
    scheduled_at: datetime,
    duration_minutes: int,
) -> None:
    """Patch an existing Calendar event's start/end times.

    The Meet link is stable across patches — same event ID keeps the same
    Meet room so students' calendar invites auto-update.

    Raises:
        RuntimeError: on API or auth failure.
    """
    if not is_enabled():
        raise RuntimeError("Google Meet integration is not enabled.")

    calendar_id = settings.google_calendar_id
    url = f"{_CALENDAR_BASE}/calendars/{calendar_id}/events/{google_event_id}"

    start_dt = scheduled_at.astimezone(timezone.utc)
    end_dt = start_dt + timedelta(minutes=duration_minutes)

    patch_body = {
        "summary": title,
        "start": {
            "dateTime": start_dt.strftime("%Y-%m-%dT%H:%M:%S") + "Z",
            "timeZone": settings.google_calendar_timezone,
        },
        "end": {
            "dateTime": end_dt.strftime("%Y-%m-%dT%H:%M:%S") + "Z",
            "timeZone": settings.google_calendar_timezone,
        },
    }

    resp = _request_with_retry(
        "PATCH",
        url,
        params={"conferenceDataVersion": "1"},
        json=patch_body,
    )

    if not resp.ok:
        raise RuntimeError(
            f"Google Calendar patch error {resp.status_code}: {resp.text[:400]}"
        )

    logger.info("Updated Google Calendar event %s", google_event_id)


def cancel_meet(*, google_event_id: str) -> None:
    """Delete a Google Calendar event (and its Meet room).

    Silently ignores 404 (already deleted / never existed).

    Raises:
        RuntimeError: on unexpected API failure.
    """
    if not is_enabled():
        return  # Nothing to cancel if feature is off.

    calendar_id = settings.google_calendar_id
    url = f"{_CALENDAR_BASE}/calendars/{calendar_id}/events/{google_event_id}"

    resp = _request_with_retry("DELETE", url)

    if resp.status_code == 404:
        logger.warning(
            "Google Calendar event %s not found on delete (already removed).",
            google_event_id,
        )
        return

    if not resp.ok:
        raise RuntimeError(
            f"Google Calendar delete error {resp.status_code}: {resp.text[:400]}"
        )

    logger.info("Deleted Google Calendar event %s", google_event_id)
