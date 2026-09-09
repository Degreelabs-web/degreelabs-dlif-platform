from __future__ import annotations

from fastapi import Depends, HTTPException, status

from app.db.models.user import User
from app.services.auth import get_current_user


def require_roles(*allowed_roles: str):
    def dependency(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )

        return current_user

    return dependency


require_admin = require_roles("admin")
require_student = require_roles("student")
require_mentor = require_roles("mentor")