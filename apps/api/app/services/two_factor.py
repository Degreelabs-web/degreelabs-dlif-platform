from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

# pyrefly: ignore [missing-import]
import jwt
# pyrefly: ignore [missing-import]
import pyotp
# pyrefly: ignore [missing-import]
from fastapi import HTTPException, status

from app.core.config import settings
from app.db.models.user import User


class TwoFactorService:
    @staticmethod
    def mask_email(email: str) -> str:
        """Mask an email address for safe display (e.g. ad***@degreelabs.com)."""
        parts = email.split("@")
        if len(parts) != 2:
            return email
        name, domain = parts
        if len(name) <= 2:
            masked_name = name + "***"
        else:
            masked_name = name[:2] + "***"
        return f"{masked_name}@{domain}"

    @staticmethod
    def generate_otp() -> str:
        """Generate a cryptographically secure 6-digit numeric OTP."""
        return f"{secrets.randbelow(900000) + 100000}"

    @staticmethod
    def create_challenge_token(user: User, access_token: str) -> str:
        """Create a signed, short-lived 2FA challenge token valid for 5 minutes."""
        now = datetime.now(timezone.utc)
        payload = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
            "type": "2fa_challenge",
            "access_token": access_token,
            "iat": now,
            "exp": now + timedelta(minutes=5),
        }
        signing_key = settings.supabase_service_role_key or "dlif-default-jwt-secret-key-12345"
        return jwt.encode(payload, signing_key, algorithm="HS256")

    @staticmethod
    def verify_challenge_token(token: str) -> dict:
        """Verify and decode the 2FA challenge token."""
        signing_key = settings.supabase_service_role_key or "dlif-default-jwt-secret-key-12345"
        try:
            payload = jwt.decode(token, signing_key, algorithms=["HS256"])
        except jwt.ExpiredSignatureError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Two-factor challenge has expired. Please sign in again.",
            ) from exc
        except jwt.InvalidTokenError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid two-factor challenge token.",
            ) from exc

        if payload.get("type") != "2fa_challenge":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token is not a valid two-factor challenge.",
            )

        return payload

    @staticmethod
    def generate_totp_secret() -> str:
        """Generate a standard Base32 secret for Authenticator apps."""
        return pyotp.random_base32()

    @staticmethod
    def verify_totp_code(secret: str, code: str) -> bool:
        """Verify a 6-digit TOTP code against a user's secret with 1-step window tolerance."""
        totp = pyotp.TOTP(secret)
        return totp.verify(code.strip(), valid_window=1)

    @staticmethod
    def get_totp_uri(secret: str, email: str) -> str:
        """Generate an otpauth:// URI for pairing with Google/Microsoft Authenticator."""
        return pyotp.totp.TOTP(secret).provisioning_uri(
            name=email,
            issuer_name="DegreeLabs Impact Fellowship",
        )
