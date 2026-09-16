from __future__ import annotations

import hashlib
import logging
import re
from pathlib import Path
from uuid import UUID, uuid4

import httpx
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

logger = logging.getLogger(__name__)


class MaterialStorageService:
    """Private Supabase Storage adapter. Service credentials stay server-side."""

    _allowed_extensions = {".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg", ".mp4"}
    _allowed_mime_prefixes = ("application/pdf", "application/msword", "application/vnd.", "image/png", "image/jpeg", "video/mp4")

    def __init__(self) -> None:
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Material storage is not configured.")
        self.base_url = settings.supabase_url.rstrip("/")
        self.bucket = settings.material_storage_bucket
        self.headers = {"apikey": settings.supabase_service_role_key, "Authorization": f"Bearer {settings.supabase_service_role_key}"}

    def _raise_storage_error(self, *, action: str, status_code: int) -> None:
        logger.warning(
            "Supabase Storage material %s failed with status %s for bucket %s",
            action,
            status_code,
            self.bucket,
        )
        if status_code == status.HTTP_404_NOT_FOUND:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    f"Private material storage bucket '{self.bucket}' was not found. "
                    "Create it in Supabase Storage and keep it private."
                ),
            )
        if status_code in {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN}:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Material storage credentials cannot access the configured private bucket. "
                    "Use the Supabase service-role key on the API server."
                ),
            )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Material {action} could not be completed.",
        )

    def _validate(self, filename: str, content_type: str | None, data: bytes) -> None:
        extension = Path(filename).suffix.lower()
        if extension not in self._allowed_extensions:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="This file type is not supported.")
        if not data:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Empty files cannot be uploaded.")
        if len(data) > settings.material_max_upload_mb * 1024 * 1024:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=f"Files must be {settings.material_max_upload_mb} MB or smaller.")
        if content_type and not content_type.startswith(self._allowed_mime_prefixes):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="The uploaded MIME type is not allowed.")

    async def upload(self, material_id: UUID, version: int, upload: UploadFile) -> tuple[str, str, int, str]:
        filename = upload.filename or "upload"
        data = await upload.read()
        self._validate(filename, upload.content_type, data)
        extension = Path(filename).suffix.lower()
        safe_name = re.sub(r"[^a-zA-Z0-9_-]", "-", Path(filename).stem)[:80] or "file"
        storage_path = f"materials/{material_id}/v{version}/{safe_name}-{uuid4().hex}{extension}"
        try:
            response = httpx.post(
                f"{self.base_url}/storage/v1/object/{self.bucket}/{storage_path}",
                headers={**self.headers, "Content-Type": upload.content_type or "application/octet-stream", "x-upsert": "false"},
                content=data,
                timeout=45,
            )
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Material storage is temporarily unavailable.") from exc
        if response.status_code not in (200, 201):
            self._raise_storage_error(action="upload", status_code=response.status_code)
        return storage_path, upload.content_type or "application/octet-stream", len(data), hashlib.sha256(data).hexdigest()

    def signed_url(self, storage_path: str) -> str:
        try:
            response = httpx.post(
                f"{self.base_url}/storage/v1/object/sign/{self.bucket}/{storage_path}",
                headers={**self.headers, "Content-Type": "application/json"},
                json={"expiresIn": settings.material_signed_url_ttl_seconds},
                timeout=15,
            )
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Material storage is temporarily unavailable.") from exc
        if response.status_code not in (200, 201):
            self._raise_storage_error(action="download link creation", status_code=response.status_code)
        signed_path = response.json().get("signedURL")
        if not isinstance(signed_path, str) or not signed_path:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="A secure material link could not be created.")
        return signed_path if signed_path.startswith("http") else f"{self.base_url}/storage/v1{signed_path}"

    def delete(self, storage_paths: list[str]) -> None:
        """Permanently remove private objects after an archived material is deleted."""
        if not storage_paths:
            return
        try:
            response = httpx.request(
                "DELETE",
                f"{self.base_url}/storage/v1/object/{self.bucket}",
                headers={**self.headers, "Content-Type": "application/json"},
                json={"prefixes": storage_paths},
                timeout=30,
            )
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Material storage is temporarily unavailable.") from exc
        if response.status_code not in (200, 204):
            self._raise_storage_error(action="deletion", status_code=response.status_code)
