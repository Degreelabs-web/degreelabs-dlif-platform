import logging
from pathlib import Path
from uuid import UUID, uuid4

import httpx
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

logger = logging.getLogger(__name__)


class StudentPhotoStorageService:
    """Stores student profile photographs in a private Supabase Storage bucket."""

    path_prefix = "student-photos/"
    _allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    _allowed_mime_types = {"image/jpeg", "image/png", "image/webp"}

    def __init__(self) -> None:
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Student photo storage is not configured.",
            )
        self.base_url = settings.supabase_url.rstrip("/")
        self.service_role_key = settings.supabase_service_role_key
        self.bucket = settings.student_photo_storage_bucket
        self.max_bytes = settings.student_photo_max_upload_mb * 1024 * 1024
        self.headers = {
            "apikey": self.service_role_key,
            "Authorization": f"Bearer {self.service_role_key}",
        }

    @classmethod
    def is_storage_path(cls, value: str | None) -> bool:
        return bool(value and value.startswith(cls.path_prefix))

    def _raise_storage_error(self, *, action: str, status_code: int) -> None:
        logger.warning(
            "Supabase Storage student photo %s failed with status %s for bucket %s",
            action,
            status_code,
            self.bucket,
        )
        if status_code == status.HTTP_404_NOT_FOUND:
            detail = (
                f"Private student photo bucket '{self.bucket}' was not found. "
                "Create it in Supabase Storage and keep it private."
            )
        elif status_code in {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN}:
            detail = "Student photo storage credentials cannot access the configured private bucket."
        else:
            detail = f"Student photo {action} could not be completed."
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail)

    def _validate(self, filename: str, content_type: str | None, data: bytes) -> str:
        extension = Path(filename).suffix.lower()
        if extension not in self._allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Upload a JPG, PNG, or WebP image.",
            )
        if content_type and content_type.lower() not in self._allowed_mime_types:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="The uploaded image type is not allowed.",
            )
        if not data:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Empty images cannot be uploaded.",
            )
        if len(data) > self.max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Student photos must be {settings.student_photo_max_upload_mb} MB or smaller.",
            )
        return extension

    async def upload(self, user_id: UUID, file: UploadFile) -> str:
        filename = file.filename or "photo.jpg"
        content = await file.read()
        extension = self._validate(filename, file.content_type, content)

        object_path = f"{self.path_prefix}{user_id}/{uuid4().hex}{extension}"
        upload_url = f"{self.base_url}/storage/v1/object/{self.bucket}/{object_path}"
        headers = {
            **self.headers,
            "Content-Type": file.content_type or "image/jpeg",
            "x-upsert": "false",
        }

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(upload_url, headers=headers, content=content)
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Student photo storage is temporarily unavailable.",
            ) from exc

        if response.status_code not in (200, 201):
            self._raise_storage_error(action="upload", status_code=response.status_code)
        return object_path

    def signed_url(self, object_path: str) -> str:
        if not self.is_storage_path(object_path):
            return object_path

        url = f"{self.base_url}/storage/v1/object/sign/{self.bucket}/{object_path}"
        try:
            response = httpx.post(
                url,
                headers={**self.headers, "Content-Type": "application/json"},
                json={"expiresIn": settings.student_photo_signed_url_ttl_seconds},
                timeout=15,
            )
            if response.status_code in (200, 201):
                signed_path = response.json().get("signedURL")
                if isinstance(signed_path, str) and signed_path:
                    return signed_path if signed_path.startswith("http") else f"{self.base_url}/storage/v1{signed_path}"
        except httpx.HTTPError:
            pass
        return object_path

    def delete_quietly(self, object_path: str) -> None:
        if not self.is_storage_path(object_path):
            return
        url = f"{self.base_url}/storage/v1/object/{self.bucket}"
        try:
            httpx.request(
                "DELETE",
                url,
                headers={**self.headers, "Content-Type": "application/json"},
                json={"prefixes": [Path(object_path).as_posix()]},
                timeout=20,
            )
        except httpx.HTTPError:
            logger.warning("Could not remove replaced student photo %s", object_path)

