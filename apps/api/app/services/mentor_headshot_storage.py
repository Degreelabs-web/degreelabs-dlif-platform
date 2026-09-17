from __future__ import annotations

import logging
from pathlib import Path
from uuid import UUID, uuid4

import httpx
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

logger = logging.getLogger(__name__)


class MentorHeadshotStorageService:
    """Server-side adapter for private mentor profile photos in Supabase Storage."""

    path_prefix = "mentor-headshots/"
    _allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    _allowed_mime_types = {"image/jpeg", "image/png", "image/webp"}

    def __init__(self) -> None:
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Mentor photo storage is not configured.",
            )
        self.base_url = settings.supabase_url.rstrip("/")
        self.bucket = settings.mentor_headshot_storage_bucket
        self.headers = {
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
        }

    @classmethod
    def is_storage_path(cls, value: str | None) -> bool:
        return bool(value and value.startswith(cls.path_prefix))

    def _raise_storage_error(self, *, action: str, status_code: int) -> None:
        logger.warning(
            "Supabase Storage mentor headshot %s failed with status %s for bucket %s",
            action,
            status_code,
            self.bucket,
        )
        if status_code == status.HTTP_404_NOT_FOUND:
            detail = (
                f"Private mentor photo bucket '{self.bucket}' was not found. "
                "Create it in Supabase Storage and keep it private."
            )
        elif status_code in {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN}:
            detail = "Mentor photo storage credentials cannot access the configured private bucket."
        else:
            detail = f"Mentor photo {action} could not be completed."
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail)

    def _validate(self, filename: str, content_type: str | None, data: bytes) -> str:
        extension = Path(filename).suffix.lower()
        if extension not in self._allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Upload a JPG, PNG, or WebP image.",
            )
        if content_type not in self._allowed_mime_types:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="The uploaded image type is not allowed.",
            )
        if not data:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Empty images cannot be uploaded.")
        if len(data) > settings.mentor_headshot_max_upload_mb * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Mentor photos must be {settings.mentor_headshot_max_upload_mb} MB or smaller.",
            )
        return extension

    async def upload(self, mentor_id: UUID, upload: UploadFile) -> str:
        filename = upload.filename or "headshot"
        data = await upload.read()
        extension = self._validate(filename, upload.content_type, data)
        storage_path = f"{self.path_prefix}{mentor_id}/{uuid4().hex}{extension}"
        try:
            response = httpx.post(
                f"{self.base_url}/storage/v1/object/{self.bucket}/{storage_path}",
                headers={
                    **self.headers,
                    "Content-Type": upload.content_type,
                    "x-upsert": "false",
                },
                content=data,
                timeout=30,
            )
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Mentor photo storage is temporarily unavailable.") from exc
        if response.status_code not in (200, 201):
            self._raise_storage_error(action="upload", status_code=response.status_code)
        return storage_path

    def signed_url(self, storage_path: str) -> str:
        try:
            response = httpx.post(
                f"{self.base_url}/storage/v1/object/sign/{self.bucket}/{storage_path}",
                headers={**self.headers, "Content-Type": "application/json"},
                json={"expiresIn": settings.mentor_headshot_signed_url_ttl_seconds},
                timeout=15,
            )
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Mentor photo storage is temporarily unavailable.") from exc
        if response.status_code not in (200, 201):
            self._raise_storage_error(action="link creation", status_code=response.status_code)
        signed_path = response.json().get("signedURL")
        if not isinstance(signed_path, str) or not signed_path:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="A secure mentor photo link could not be created.")
        return signed_path if signed_path.startswith("http") else f"{self.base_url}/storage/v1{signed_path}"

    def delete_quietly(self, storage_path: str) -> None:
        if not self.is_storage_path(storage_path):
            return
        try:
            response = httpx.request(
                "DELETE",
                f"{self.base_url}/storage/v1/object/{self.bucket}",
                headers={**self.headers, "Content-Type": "application/json"},
                json={"prefixes": [storage_path]},
                timeout=20,
            )
            if response.status_code not in (200, 204):
                logger.warning("Could not remove replaced mentor headshot %s", storage_path)
        except httpx.HTTPError:
            logger.warning("Could not remove replaced mentor headshot %s", storage_path)
