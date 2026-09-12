import smtplib
from types import SimpleNamespace
from unittest.mock import patch

import pytest

from app.services.email_delivery import (
    EmailConfigurationError,
    EmailDeliveryError,
    EmailDeliveryService,
)


def smtp_config(**overrides):
    values = {
        "smtp_host": "smtp.example.com",
        "smtp_port": 587,
        "smtp_username": "mailer@example.com",
        "smtp_password": "test-password",
        "smtp_from_email": "no-reply@example.com",
        "smtp_from_name": "DegreeLabs",
        "smtp_use_tls": True,
        "smtp_use_ssl": False,
        "smtp_timeout_seconds": 10.0,
    }
    values.update(overrides)
    return SimpleNamespace(**values)


@patch("app.services.email_delivery.ssl.create_default_context")
@patch("app.services.email_delivery.smtplib.SMTP")
def test_sends_code_to_exact_recipient_over_starttls(mock_smtp, mock_context):
    client = mock_smtp.return_value
    service = EmailDeliveryService(smtp_config())

    service.send_two_factor_code(
        "particular.user@degreelabs.com",
        "538647",
    )

    mock_smtp.assert_called_once_with(
        "smtp.example.com",
        587,
        timeout=10.0,
    )
    client.starttls.assert_called_once_with(context=mock_context.return_value)
    client.login.assert_called_once_with("mailer@example.com", "test-password")

    message = client.send_message.call_args.args[0]
    assert message["To"] == "particular.user@degreelabs.com"
    assert message["From"] == "DegreeLabs <no-reply@example.com>"
    assert message["Subject"] == "Your DegreeLabs verification code"
    assert "538647" in message.get_body(preferencelist=("plain",)).get_content()
    assert "538647" in message.get_body(preferencelist=("html",)).get_content()


@patch("app.services.email_delivery.smtplib.SMTP_SSL")
def test_supports_implicit_tls_without_starttls(mock_smtp_ssl):
    client = mock_smtp_ssl.return_value
    service = EmailDeliveryService(
        smtp_config(smtp_port=465, smtp_use_tls=False, smtp_use_ssl=True)
    )

    service.send_two_factor_code("student@example.edu", "123456")

    client.starttls.assert_not_called()
    client.send_message.assert_called_once()


@pytest.mark.parametrize(
    ("overrides", "expected_setting"),
    [
        ({"smtp_host": ""}, "SMTP_HOST"),
        ({"smtp_from_email": ""}, "SMTP_FROM_EMAIL"),
        ({"smtp_password": ""}, "SMTP_PASSWORD"),
        (
            {"smtp_use_tls": True, "smtp_use_ssl": True},
            "SMTP_USE_SSL and SMTP_USE_TLS",
        ),
        ({"smtp_port": 0}, "SMTP_PORT"),
        ({"smtp_timeout_seconds": 0}, "SMTP_TIMEOUT_SECONDS"),
        (
            {"smtp_use_tls": False, "smtp_use_ssl": False},
            "Authenticated SMTP requires TLS or SSL",
        ),
    ],
)
def test_rejects_invalid_configuration_before_connecting(
    overrides,
    expected_setting,
):
    service = EmailDeliveryService(smtp_config(**overrides))

    with patch("app.services.email_delivery.smtplib.SMTP") as mock_smtp:
        with pytest.raises(EmailConfigurationError, match=expected_setting):
            service.send_two_factor_code("student@example.edu", "123456")

    mock_smtp.assert_not_called()


@patch("app.services.email_delivery.smtplib.SMTP")
def test_wraps_smtp_delivery_errors(mock_smtp):
    client = mock_smtp.return_value
    client.send_message.side_effect = smtplib.SMTPException("rejected")
    service = EmailDeliveryService(smtp_config())

    with pytest.raises(EmailDeliveryError) as error:
        service.send_two_factor_code("student@example.edu", "123456")

    assert isinstance(error.value.__cause__, smtplib.SMTPException)


@patch("app.services.email_delivery.smtplib.SMTP")
def test_does_not_report_failure_when_quit_fails_after_delivery(mock_smtp):
    client = mock_smtp.return_value
    client.quit.side_effect = smtplib.SMTPServerDisconnected("connection closed")
    service = EmailDeliveryService(smtp_config())

    service.send_two_factor_code("student@example.edu", "123456")

    client.send_message.assert_called_once()
    client.close.assert_called_once()
