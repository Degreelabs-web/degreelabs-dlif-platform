from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.core.config import settings
from app.services.two_factor import (
    TwoFactorConfigurationError,
    TwoFactorService,
)


def challenge_user():
    return SimpleNamespace(
        id=uuid4(),
        email="particular.user@degreelabs.com",
        role="admin",
    )


def test_challenge_is_opaque_and_round_trips_access_token():
    user = challenge_user()
    access_token = "supabase-access-token-that-must-remain-secret"

    with patch.object(settings, "two_factor_challenge_secret", "s" * 48):
        token = TwoFactorService.create_challenge_token(user, access_token)
        payload = TwoFactorService.verify_challenge_token(token)

    assert access_token not in token
    assert user.email not in token
    assert payload["sub"] == str(user.id)
    assert payload["access_token"] == access_token
    assert payload["type"] == "2fa_challenge"


def test_invalid_challenge_is_rejected_as_unauthorized():
    with patch.object(settings, "two_factor_challenge_secret", "s" * 48):
        with pytest.raises(HTTPException) as error:
            TwoFactorService.verify_challenge_token("not-a-valid-token")

    assert error.value.status_code == 401


def test_challenge_requires_server_only_key_material():
    with (
        patch.object(settings, "two_factor_challenge_secret", ""),
        patch.object(settings, "supabase_service_role_key", ""),
    ):
        with pytest.raises(TwoFactorConfigurationError):
            TwoFactorService.create_challenge_token(
                challenge_user(),
                "access-token",
            )


def test_otp_comparison_accepts_only_the_expected_code():
    assert TwoFactorService.verify_otp_code("538647", "538647")
    assert not TwoFactorService.verify_otp_code("538647", "538648")
