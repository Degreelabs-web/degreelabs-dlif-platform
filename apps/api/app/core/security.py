from __future__ import annotations

from functools import lru_cache
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from app.core.config import settings


security_scheme = HTTPBearer(auto_error=False)


@lru_cache
def get_jwks_client() -> PyJWKClient:
    jwks_url = (
        settings.supabase_url.rstrip("/")
        + "/auth/v1/.well-known/jwks.json"
    )

    return PyJWKClient(jwks_url)


def _unauthorized(detail: str = "Invalid or missing authentication token"):
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def verify_access_token(token: str) -> dict:
    if not settings.supabase_url:
        raise RuntimeError("SUPABASE_URL is not configured")

    issuer = settings.supabase_url.rstrip("/") + "/auth/v1"

    try:
        signing_key = get_jwks_client().get_signing_key_from_jwt(token)

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            issuer=issuer,
            audience="authenticated",
            leeway=5,
            options={
                "require": ["exp", "sub", "iss"],
            },
        )

        return payload

    except jwt.ExpiredSignatureError as exc:
        raise _unauthorized("Authentication token has expired") from exc

    except (
        jwt.InvalidTokenError,
        jwt.PyJWKClientError,
    ) as exc:
        raise _unauthorized() from exc


def get_current_user_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        security_scheme
    ),
) -> dict:
    if credentials is None:
        raise _unauthorized()

    if credentials.scheme.lower() != "bearer":
        raise _unauthorized()

    return verify_access_token(credentials.credentials)


def get_current_user_id(
    token: dict = Depends(get_current_user_token),
) -> UUID:
    subject = token.get("sub")

    if not subject:
        raise _unauthorized("Authentication token is missing subject")

    try:
        return UUID(subject)
    except ValueError as exc:
        raise _unauthorized("Authentication token has invalid subject") from exc