from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.api.routes.auth import login, resend_two_factor_code
from app.schemas.user import UserLoginRequest, TwoFactorResendRequest
from app.services.email_delivery import EmailDeliveryError


def active_user(email: str):
    return SimpleNamespace(
        id=uuid4(),
        email=email,
        full_name="Test User",
        role="student",
        status="active",
        two_factor_enabled=False,
        two_factor_secret=None,
        two_factor_otp_code=None,
        two_factor_otp_expires_at=None,
    )


def db_returning(user):
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = user
    return db


@patch("app.api.routes.auth.TwoFactorService.create_challenge_token")
@patch("app.api.routes.auth.TwoFactorService.generate_otp")
@patch("app.api.routes.auth.EmailDeliveryService.send_two_factor_code")
@patch("app.api.routes.auth.httpx.post")
def test_login_emails_the_authenticated_database_user(
    mock_auth_post,
    mock_send_code,
    mock_generate_otp,
    mock_create_token,
):
    user = active_user("particular.user@degreelabs.com")
    db = db_returning(user)
    mock_auth_post.return_value.status_code = 200
    mock_auth_post.return_value.json.return_value = {"access_token": "access-token"}
    mock_generate_otp.return_value = "538647"
    mock_create_token.return_value = "challenge-token"

    response = login(
        UserLoginRequest(email=user.email, password="test-password"),
        db,
    )

    mock_send_code.assert_called_once_with(user.email, "538647")
    assert user.two_factor_otp_code == "538647"
    assert response.masked_email == "pa***@degreelabs.com"
    assert response.two_factor_token == "challenge-token"
    assert not hasattr(response, "dev_code")
    db.commit.assert_called_once()


@patch("app.api.routes.auth.TwoFactorService.create_challenge_token")
@patch("app.api.routes.auth.TwoFactorService.verify_challenge_token")
@patch("app.api.routes.auth.TwoFactorService.generate_otp")
@patch("app.api.routes.auth.EmailDeliveryService.send_two_factor_code")
def test_resend_emails_the_challenge_user(
    mock_send_code,
    mock_generate_otp,
    mock_verify_token,
    mock_create_token,
):
    user = active_user("student@institution.edu")
    db = db_returning(user)
    mock_verify_token.return_value = {
        "sub": str(user.id),
        "access_token": "access-token",
    }
    mock_generate_otp.return_value = "123456"
    mock_create_token.return_value = "refreshed-challenge-token"

    response = resend_two_factor_code(
        TwoFactorResendRequest(two_factor_token="challenge-token"),
        db,
    )

    mock_send_code.assert_called_once_with(user.email, "123456")
    assert "sent to your email" in response["message"]
    assert response["two_factor_token"] == "refreshed-challenge-token"
    db.commit.assert_called_once()


@patch("app.api.routes.auth.TwoFactorService.create_challenge_token")
@patch("app.api.routes.auth.TwoFactorService.generate_otp")
@patch("app.api.routes.auth.EmailDeliveryService.send_two_factor_code")
@patch("app.api.routes.auth.httpx.post")
def test_login_rolls_back_when_email_delivery_fails(
    mock_auth_post,
    mock_send_code,
    mock_generate_otp,
    mock_create_token,
):
    user = active_user("student@institution.edu")
    db = db_returning(user)
    mock_auth_post.return_value.status_code = 200
    mock_auth_post.return_value.json.return_value = {"access_token": "access-token"}
    mock_generate_otp.return_value = "123456"
    mock_send_code.side_effect = EmailDeliveryError("SMTP unavailable")

    with pytest.raises(HTTPException) as error:
        login(
            UserLoginRequest(email=user.email, password="test-password"),
            db,
        )

    assert error.value.status_code == 503
    db.rollback.assert_called_once()
    db.commit.assert_not_called()
    mock_create_token.assert_called_once_with(user, "access-token")
