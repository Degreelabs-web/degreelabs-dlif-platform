from uuid import UUID

# pyrefly: ignore [missing-import]
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


ALLOWED_ROLES = {"admin", "student", "mentor"}


class UserProvisionRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    role: str = Field(..., min_length=1, max_length=50)
    password: str | None = Field(
        default=None,
        min_length=8,
        max_length=128,
    )

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        normalized = value.strip().lower()

        if normalized not in ALLOWED_ROLES:
            raise ValueError(
                "Role must be one of: admin, student, mentor"
            )

        return normalized


class UserProvisionResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    status: str

    model_config = ConfigDict(from_attributes=True)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserLoginResponse(BaseModel):
    access_token: str | None = None
    token_type: str = "bearer"
    user: UserProvisionResponse | None = None
    requires_2fa: bool = False
    two_factor_token: str | None = None
    masked_email: str | None = None
    methods: list[str] = Field(default_factory=lambda: ["otp", "totp"])
    totp_configured: bool = False
    dev_code: str | None = None
    message: str | None = None


class TwoFactorVerifyRequest(BaseModel):
    two_factor_token: str
    code: str = Field(..., min_length=6, max_length=8)


class TwoFactorResendRequest(BaseModel):
    two_factor_token: str


class TwoFactorSetupResponse(BaseModel):
    secret: str
    otpauth_uri: str


class TwoFactorConfirmRequest(BaseModel):
    secret: str
    code: str = Field(..., min_length=6, max_length=6)

