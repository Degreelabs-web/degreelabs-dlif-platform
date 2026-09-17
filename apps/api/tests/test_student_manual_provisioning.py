import uuid
from unittest.mock import MagicMock, patch
from io import BytesIO

import pytest
from fastapi import HTTPException, UploadFile
from pydantic import ValidationError

from app.db.models.student_profile import StudentProfile
from app.db.models.user import User
from app.schemas.student import (
    StudentProvisionRequest,
    StudentUpdate,
)
from app.services.student import StudentService
from app.services.student_photo_storage import StudentPhotoStorageService


def test_student_provision_request_accepts_all_enrollment_fields() -> None:
    institution_id = uuid.uuid4()
    request = StudentProvisionRequest(
        institution_id=institution_id,
        full_name="Priya Patel",
        email="priya.patel@example.edu",
        student_id="STU-2026-88",
        password="TemporaryPassword123",
        phone="+91 98765 43210",
        course="Computer Science & Engineering",
        branch="Information Technology",
        graduation_year=2026,
        gender="Female",
        current_year_semester="4th Year / 7th Sem",
        aadhaar_number="123456789012",
        pan_number="ABCDE1234F",
        document_url="https://drive.google.com/folder/123",
        photo_url="https://drive.google.com/photo/123",
    )

    assert request.full_name == "Priya Patel"
    assert request.gender == "Female"
    assert request.current_year_semester == "4th Year / 7th Sem"
    assert request.aadhaar_number == "123456789012"
    assert request.pan_number == "ABCDE1234F"
    assert request.document_url == "https://drive.google.com/folder/123"


def test_student_photo_storage_is_storage_path() -> None:
    assert StudentPhotoStorageService.is_storage_path("student-photos/user-123/abc.png")
    assert not StudentPhotoStorageService.is_storage_path("https://drive.google.com/xyz")
    assert not StudentPhotoStorageService.is_storage_path(None)
    assert not StudentPhotoStorageService.is_storage_path("")


def test_student_photo_storage_validation() -> None:
    with patch("app.services.student_photo_storage.settings") as mock_settings:
        mock_settings.supabase_url = "https://example.supabase.co"
        mock_settings.supabase_service_role_key = "secret"
        mock_settings.student_photo_storage_bucket = "dlif-student-photos"
        mock_settings.student_photo_max_upload_mb = 5

        service = StudentPhotoStorageService()

        # Valid JPG
        ext = service._validate("profile.jpg", "image/jpeg", b"valid_image_bytes")
        assert ext == ".jpg"

        # Valid PNG
        ext = service._validate("photo.PNG", "image/png", b"png_data")
        assert ext == ".png"

        # Invalid extension
        with pytest.raises(HTTPException) as exc_info:
            service._validate("file.pdf", "application/pdf", b"pdf_data")
        assert exc_info.value.status_code == 422

        # Empty content
        with pytest.raises(HTTPException) as exc_info:
            service._validate("photo.jpg", "image/jpeg", b"")
        assert exc_info.value.status_code == 422


from datetime import datetime, timezone

def test_student_service_to_response_signs_storage_path() -> None:
    user_id = uuid.uuid4()
    inst_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    user = User(
        id=user_id,
        email="test@example.com",
        full_name="Test Student",
        role="student",
        status="active",
        created_at=now,
        updated_at=now,
    )
    profile = StudentProfile(
        id=uuid.uuid4(),
        user_id=user_id,
        institution_id=inst_id,
        student_id="STU-001",
        photo_url="student-photos/test/headshot.jpg",
        gender="Non-binary",
        current_year_semester="3rd Year / 5th Sem",
        created_at=now,
        updated_at=now,
    )

    mock_db = MagicMock()
    service = StudentService(mock_db)

    with patch.object(
        StudentPhotoStorageService, "signed_url", return_value="https://signed.supabase.co/photo.jpg"
    ):
        response = service._to_response(user, profile)
        assert response.profile is not None
        assert response.profile.photo_url == "https://signed.supabase.co/photo.jpg"
        assert response.profile.gender == "Non-binary"
        assert response.profile.current_year_semester == "3rd Year / 5th Sem"
