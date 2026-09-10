import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rbac import require_admin
from app.core.security import get_current_user_token
from app.db.models.user import User
from app.schemas.user import (
    UserLoginRequest,
    UserLoginResponse,
    UserProvisionRequest,
    UserProvisionResponse,
)
from app.services.auth import get_current_user
from app.services.user_provisioning import (
    UserProvisioningError,
    UserProvisioningService,
)
from datetime import datetime, timedelta, timezone
from uuid import UUID

from app.db.session import get_db
from app.services.two_factor import TwoFactorService
from app.schemas.user import (
    TwoFactorConfirmRequest,
    TwoFactorResendRequest,
    TwoFactorSetupResponse,
    TwoFactorVerifyRequest,
    UserLoginRequest,
    UserLoginResponse,
    UserProvisionRequest,
    UserProvisionResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


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

    # Enforce 2FA for admin@degreelabs.com, all students, or if two_factor_enabled is True
    is_admin = user.email.strip().lower() == "admin@degreelabs.com"
    is_student = user.role == "student"
    requires_2fa = is_admin or is_student or user.two_factor_enabled

    if requires_2fa:
        otp = TwoFactorService.generate_otp()
        user.two_factor_otp_code = otp
        user.two_factor_otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
        db.commit()

        # Print to terminal/server log for security audit & easy verification
        print(f"\n[2FA SECURITY] Verification code for {user.email}: {otp} (Expires in 5 minutes)\n")

        two_factor_token = TwoFactorService.create_challenge_token(user, access_token)

        return UserLoginResponse(
            requires_2fa=True,
            two_factor_token=two_factor_token,
            masked_email=TwoFactorService.mask_email(user.email),
            methods=["otp", "totp"] if user.two_factor_secret else ["otp"],
            totp_configured=bool(user.two_factor_secret),
            dev_code=otp if settings.environment == "development" else None,
            message="Please enter the 6-digit verification code to complete sign in.",
        )

    return UserLoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserProvisionResponse.model_validate(user),
        requires_2fa=False,
    )


@router.post(
    "/2fa/verify",
    response_model=UserLoginResponse,
)
def verify_two_factor(
    data: TwoFactorVerifyRequest,
    db: Session = Depends(get_db),
):
    payload = TwoFactorService.verify_challenge_token(data.two_factor_token)
    user_id = payload.get("sub")
    access_token = payload.get("access_token")

    if not user_id or not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed two-factor challenge token.",
        )

    user = db.query(User).filter(User.id == UUID(user_id)).first()
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
        if user.two_factor_otp_expires_at > now and user.two_factor_otp_code == code:
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
    payload = TwoFactorService.verify_challenge_token(data.two_factor_token)
    user_id = payload.get("sub")

    user = db.query(User).filter(User.id == UUID(user_id)).first()
    if not user or user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not found or account is inactive.",
        )

    otp = TwoFactorService.generate_otp()
    user.two_factor_otp_code = otp
    user.two_factor_otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    db.commit()

    print(f"\n[2FA SECURITY RESEND] Verification code for {user.email}: {otp} (Expires in 5 minutes)\n")

    return {
        "success": True,
        "message": "A fresh verification code has been generated.",
        "dev_code": otp if settings.environment == "development" else None,
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