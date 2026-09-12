# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient

from app.api.routes import enrollment_sync as enrollment_sync_routes
from app.core.config import settings
from app.main import app


def test_unauthorized_user_cannot_trigger_enrollment_sync() -> None:
    response = TestClient(app).post("/api/v1/admin/enrollment-sync")

    assert response.status_code == 401


def test_unauthorized_user_cannot_upload_enrollment_workbook() -> None:
    response = TestClient(app).post(
        "/api/v1/admin/enrollment-sync/upload",
        files={
            "workbook": (
                "enrollment.xlsx",
                b"not processed before authorization",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        },
    )

    assert response.status_code == 401


def test_unauthorized_user_cannot_read_admin_mentors() -> None:
    response = TestClient(app).get("/api/v1/mentors")

    assert response.status_code == 401


class ConfiguredGoogleSource:
    source_type = "google_sheets"

    def is_configured(self) -> bool:
        return True


def test_google_form_event_queues_secure_sheet_sync(monkeypatch) -> None:
    calls: list[dict[str, object]] = []
    monkeypatch.setattr(settings, "enrollment_google_webhook_secret", "test-secret")
    monkeypatch.setattr(
        enrollment_sync_routes,
        "_run_mentor_submission_background",
        lambda values: calls.append(values),
    )

    response = TestClient(app).post(
        "/api/v1/admin/enrollment-sync/google-form",
        headers={"X-DLIF-Ingestion-Secret": "test-secret"},
        json={
            "values": {
                "Email address": "mentor@example.com",
                "Full name": "Mentor Example",
            }
        },
    )

    assert response.status_code == 202
    assert calls == [{"Email address": "mentor@example.com", "Full name": "Mentor Example"}]


def test_google_form_event_rejects_invalid_secret(monkeypatch) -> None:
    monkeypatch.setattr(settings, "enrollment_google_webhook_secret", "test-secret")

    response = TestClient(app).post(
        "/api/v1/admin/enrollment-sync/google-form",
        headers={"X-DLIF-Ingestion-Secret": "wrong-secret"},
        json={"values": {}},
    )

    assert response.status_code == 401
