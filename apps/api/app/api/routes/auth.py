from fastapi import APIRouter, Depends, HTTPException, status

from app.core.rbac import require_admin
from app.core.security import get_current_user_token
from app.db.models.user import User
from app.schemas.user import UserProvisionRequest, UserProvisionResponse
from app.services.auth import get_current_user
from app.services.user_provisioning import (
    UserProvisioningError,
    UserProvisioningService,
)
from app.db.session import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


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