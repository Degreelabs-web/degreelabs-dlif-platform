from uuid import UUID

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