import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

# pyrefly: ignore [missing-import]
import httpx
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rbac import require_admin
from app.core.security import get_current_user_token
from app.db.models.user import User
from app.db.models.mentor import Mentor
from app.db.session import get_db
from app.schemas.user import (
    TwoFactorConfirmRequest,
    TwoFactorResendRequest,
    TwoFactorSetupResponse,
    TwoFactorVerifyRequest,
    UserLoginRequest,
    MentorOnboardingCompleteRequest,
    UserLoginResponse,
    UserProfileUpdateRequest,
    UserProvisionRequest,
    UserProvisionResponse,
)
from app.services.auth import get_current_user
from app.services.email_delivery import (
    EmailConfigurationError,
    EmailDeliveryError,
    EmailDeliveryService,
)
from app.services.two_factor import (
    TwoFactorConfigurationError,
    TwoFactorService,
)
from app.services.user_provisioning import (
    UserProvisioningError,
    UserProvisioningService,
)
from app.services.supabase_admin import SupabaseAdminError, SupabaseAdminService

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


def _two_factor_configuration_unavailable(
    exc: TwoFactorConfigurationError,
) -> HTTPException:
    logger.error("Two-factor challenge encryption is not configured: %s", exc)
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=(
            "Two-factor authentication is not configured securely. "
            "Please contact the administrator."
        ),
    )


def _create_two_factor_challenge(user: User, access_token: str) -> str:
    try:
        return TwoFactorService.create_challenge_token(user, access_token)
    except TwoFactorConfigurationError as exc:
        raise _two_factor_configuration_unavailable(exc) from exc


def _verify_two_factor_challenge(token: str) -> dict:
    try:
        return TwoFactorService.verify_challenge_token(token)
    except TwoFactorConfigurationError as exc:
        raise _two_factor_configuration_unavailable(exc) from exc


def _challenge_user_id(payload: dict) -> UUID:
    try:
        return UUID(payload["sub"])
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Two-factor challenge has an invalid user identifier.",
        ) from exc


def _deliver_two_factor_code(
    user: User,
    code: str,
    db: Session,
) -> None:
    try:
        EmailDeliveryService().send_two_factor_code(user.email, code)
    except EmailConfigurationError as exc:
        db.rollback()
        logger.error("Two-factor email delivery is not configured: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Verification email delivery is not configured. "
                "Please contact the administrator."
            ),
        ) from exc
    except EmailDeliveryError as exc:
        db.rollback()
        logger.exception("Unable to deliver two-factor email to user %s", user.id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "We could not send your verification email. "
                "Please try again shortly."
            ),
        ) from exc


@router.post(
    "/login",
    response_model=UserLoginResponse,
)
def login(
    data: UserLoginRequest,
    db: Session = Depends(get_db),
):
    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/token?grant_type=password"
    try:
        resp = httpx.post(
            url,
            headers={
                "apikey": settings.supabase_anon_key,
                "Content-Type": "application/json",
            },
            json={"email": data.email, "password": data.password},
            timeout=10,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unreachable.",
        ) from exc

    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    auth_data = resp.json()
    access_token = auth_data.get("access_token")
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed to return access token.",
        )

    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User exists in Supabase Auth but is not provisioned in DLIF.",
        )

    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    # Enforce 2FA for , all students, or if two_factor_enabled is True
    is_admin = user.email.strip().lower() == "samatha.reddy@degreelabs.com"
    is_student = user.role == "student"
    requires_2fa = is_admin or is_student or user.two_factor_enabled

    if requires_2fa:
        two_factor_token = _create_two_factor_challenge(user, access_token)
        otp = TwoFactorService.generate_otp()
        user.two_factor_otp_code = otp
        user.two_factor_otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
        _deliver_two_factor_code(user, otp, db)
        db.commit()

        return UserLoginResponse(
            requires_2fa=True,
            two_factor_token=two_factor_token,
            masked_email=TwoFactorService.mask_email(user.email),
            methods=["otp", "totp"] if user.two_factor_secret else ["otp"],
            totp_configured=bool(user.two_factor_secret),
            message="A 6-digit verification code was sent to your email address.",
        )

    return UserLoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserProvisionResponse.model_validate(user),
        requires_2fa=False,
    )


@router.post(
    "/mentor-onboarding/complete",
    response_model=UserProvisionResponse,
)
def complete_mentor_onboarding(
    data: MentorOnboardingCompleteRequest,
    token: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    """Activate a pending mentor after Supabase verified a recovery link.

    The only credential accepted here is a valid, short-lived Supabase Auth
    recovery session. No onboarding token is stored in DLIF's database.
    """
    user_id = _challenge_user_id(token)
    user = db.get(User, user_id)
    if user is None or user.role != "mentor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This password setup link is not valid for a mentor account.",
        )
    if user.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This mentor account has already completed onboarding or is unavailable.",
        )

    mentor = db.query(Mentor).filter(Mentor.user_id == user.id).first()
    if mentor is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The mentor profile is unavailable. Please contact DegreeLabs support.",
        )

    try:
        SupabaseAdminService().update_user(str(user.id), password=data.password)
    except (RuntimeError, SupabaseAdminError) as exc:
        logger.exception("Unable to complete mentor onboarding for user %s", user.id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="We could not save your password securely. Please try again shortly.",
        ) from exc


@router.patch("/me", response_model=UserProvisionResponse)
def update_current_user_profile(
    data: UserProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Allow an authenticated user to update their own display name."""
    current_user.full_name = data.full_name
    db.commit()
    db.refresh(current_user)
    return current_user

    now = datetime.now(timezone.utc)
    user.status = "active"
    mentor.status = "active"
    mentor.password_setup_status = "completed"
    mentor.password_setup_completed_at = now
    db.commit()
    db.refresh(user)
    return UserProvisionResponse.model_validate(user)


@router.post(
    "/2fa/verify",
    response_model=UserLoginResponse,
)
def verify_two_factor(
    data: TwoFactorVerifyRequest,
    db: Session = Depends(get_db),
):
    payload = _verify_two_factor_challenge(data.two_factor_token)
    user_id = _challenge_user_id(payload)
    access_token = payload.get("access_token")

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed two-factor challenge token.",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not found or account is inactive.",
        )

    code = data.code.strip()
    is_valid = False

    # 1. Check OTP code
    if user.two_factor_otp_code and user.two_factor_otp_expires_at:
        now = datetime.now(timezone.utc)
        if (
            user.two_factor_otp_expires_at > now
            and TwoFactorService.verify_otp_code(
                user.two_factor_otp_code,
                code,
            )
        ):
            is_valid = True

    # 2. Check TOTP Authenticator code if not matched by OTP
    if not is_valid and user.two_factor_secret:
        if TwoFactorService.verify_totp_code(user.two_factor_secret, code):
            is_valid = True

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code. Please check and try again.",
        )

    # Invalidate used OTP code to prevent replay attacks
    user.two_factor_otp_code = None
    user.two_factor_otp_expires_at = None
    db.commit()

    return UserLoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserProvisionResponse.model_validate(user),
        requires_2fa=False,
    )


@router.post("/2fa/resend")
def resend_two_factor_code(
    data: TwoFactorResendRequest,
    db: Session = Depends(get_db),
):
    payload = _verify_two_factor_challenge(data.two_factor_token)
    user_id = _challenge_user_id(payload)

    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not found or account is inactive.",
        )

    refreshed_token = _create_two_factor_challenge(
        user,
        payload["access_token"],
    )
    otp = TwoFactorService.generate_otp()
    user.two_factor_otp_code = otp
    user.two_factor_otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    _deliver_two_factor_code(user, otp, db)
    db.commit()

    return {
        "success": True,
        "message": "A fresh verification code was sent to your email address.",
        "two_factor_token": refreshed_token,
    }


@router.get(
    "/2fa/setup",
    response_model=TwoFactorSetupResponse,
)
def setup_two_factor(
    current_user: User = Depends(get_current_user),
):
    secret = TwoFactorService.generate_totp_secret()
    otpauth_uri = TwoFactorService.get_totp_uri(secret, current_user.email)
    return TwoFactorSetupResponse(
        secret=secret,
        otpauth_uri=otpauth_uri,
    )


@router.post("/2fa/confirm-setup")
def confirm_setup_two_factor(
    data: TwoFactorConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not TwoFactorService.verify_totp_code(data.secret, data.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code for authenticator setup.",
        )

    current_user.two_factor_secret = data.secret
    current_user.two_factor_enabled = True
    db.commit()

    return {
        "success": True,
        "message": "Authenticator app successfully linked for two-factor authentication.",
    }




@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user),
    token: dict = Depends(get_current_user_token),
):
    return {
        "authenticated": True,
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role,
            "status": current_user.status,
        },
        "supabase_token_role": token.get("role"),
    }


@router.post(
    "/provision-user",
    response_model=UserProvisionResponse,
    status_code=status.HTTP_201_CREATED,
)
def provision_user(
    data: UserProvisionRequest,
    current_user: User = Depends(require_admin),
    db=Depends(get_db),
):
    service = UserProvisioningService(db)

    try:
        return service.provision_user(
            email=str(data.email),
            full_name=data.full_name,
            role=data.role,
            password=data.password,
        )
    except UserProvisioningError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
