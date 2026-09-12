from __future__ import annotations

import base64
import hashlib
import json
import secrets

# pyrefly: ignore [missing-import]
import pyotp
# pyrefly: ignore [missing-import]
from cryptography.fernet import Fernet, InvalidToken
# pyrefly: ignore [missing-import]
from fastapi import HTTPException, status

from app.core.config import settings
from app.db.models.user import User


class TwoFactorConfigurationError(RuntimeError):
    """Raised when secure two-factor challenge encryption is unavailable."""


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

    @classmethod
    def create_challenge_token(cls, user: User, access_token: str) -> str:
        """Create an opaque, encrypted two-factor challenge token."""
        payload = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
            "type": "2fa_challenge",
            "access_token": access_token,
        }
        serialized = json.dumps(
            payload,
            separators=(",", ":"),
        ).encode("utf-8")
        return cls._challenge_cipher().encrypt(serialized).decode("ascii")

    @classmethod
    def verify_challenge_token(cls, token: str) -> dict:
        """Decrypt and validate a short-lived two-factor challenge token."""
        try:
            serialized = cls._challenge_cipher().decrypt(
                token.encode("ascii"),
                ttl=settings.two_factor_challenge_ttl_seconds,
            )
            payload = json.loads(serialized.decode("utf-8"))
        except (InvalidToken, UnicodeError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=(
                    "Invalid or expired two-factor challenge. "
                    "Please sign in again."
                ),
            ) from exc

        if (
            not isinstance(payload, dict)
            or payload.get("type") != "2fa_challenge"
            or not isinstance(payload.get("sub"), str)
            or not isinstance(payload.get("access_token"), str)
            or not payload["access_token"]
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token is not a valid two-factor challenge.",
            )

        return payload

    @staticmethod
    def verify_otp_code(expected_code: str, submitted_code: str) -> bool:
        """Compare one-time codes without data-dependent string timing."""
        return secrets.compare_digest(expected_code, submitted_code.strip())

    @staticmethod
    def _challenge_cipher() -> Fernet:
        if settings.two_factor_challenge_ttl_seconds <= 0:
            raise TwoFactorConfigurationError(
                "TWO_FACTOR_CHALLENGE_TTL_SECONDS must be greater than zero."
            )

        secret = (
            settings.two_factor_challenge_secret
            or settings.supabase_service_role_key
        )
        if len(secret) < 32:
            raise TwoFactorConfigurationError(
                "TWO_FACTOR_CHALLENGE_SECRET or SUPABASE_SERVICE_ROLE_KEY "
                "must provide at least 32 characters of server-only key material."
            )

        derived_key = hashlib.sha256(
            f"degreelabs:two-factor-challenge:{secret}".encode("utf-8")
        ).digest()
        return Fernet(base64.urlsafe_b64encode(derived_key))

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
