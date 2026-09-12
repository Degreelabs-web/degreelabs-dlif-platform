from __future__ import annotations

import smtplib
import ssl
from email.message import EmailMessage
from html import escape

from app.core.config import Settings, settings


class EmailDeliveryError(RuntimeError):
    """Raised when a transactional email cannot be delivered."""


class EmailConfigurationError(EmailDeliveryError):
    """Raised when required SMTP configuration is missing or inconsistent."""


class EmailDeliveryService:
    def __init__(self, config: Settings = settings) -> None:
        self.config = config

    def send_two_factor_code(
        self,
        recipient_email: str,
        code: str,
        expires_in_minutes: int = 5,
    ) -> None:
        self._validate_configuration()

        try:
            message = self._build_message(
                recipient_email,
                code,
                expires_in_minutes,
            )

            if self.config.smtp_use_ssl:
                with smtplib.SMTP_SSL(
                    self.config.smtp_host,
                    self.config.smtp_port,
                    timeout=self.config.smtp_timeout_seconds,
                    context=ssl.create_default_context(),
                ) as client:
                    self._authenticate_and_send(client, message, use_tls=False)
            else:
                with smtplib.SMTP(
                    self.config.smtp_host,
                    self.config.smtp_port,
                    timeout=self.config.smtp_timeout_seconds,
                ) as client:
                    self._authenticate_and_send(
                        client,
                        message,
                        use_tls=self.config.smtp_use_tls,
                    )
        except (OSError, ValueError, smtplib.SMTPException) as exc:
            raise EmailDeliveryError(
                "The verification email could not be delivered."
            ) from exc

    def _validate_configuration(self) -> None:
        required = {
            "SMTP_HOST": self.config.smtp_host,
            "SMTP_FROM_EMAIL": self.config.smtp_from_email,
        }
        missing = [name for name, value in required.items() if not value.strip()]

        if missing:
            raise EmailConfigurationError(
                f"Missing email configuration: {', '.join(missing)}"
            )

        if self.config.smtp_username and not self.config.smtp_password:
            raise EmailConfigurationError(
                "SMTP_PASSWORD is required when SMTP_USERNAME is configured."
            )

        if self.config.smtp_use_ssl and self.config.smtp_use_tls:
            raise EmailConfigurationError(
                "SMTP_USE_SSL and SMTP_USE_TLS cannot both be enabled."
            )

        if not 1 <= self.config.smtp_port <= 65535:
            raise EmailConfigurationError(
                "SMTP_PORT must be between 1 and 65535."
            )

        if self.config.smtp_timeout_seconds <= 0:
            raise EmailConfigurationError(
                "SMTP_TIMEOUT_SECONDS must be greater than zero."
            )

        if self.config.smtp_username and not (
            self.config.smtp_use_tls or self.config.smtp_use_ssl
        ):
            raise EmailConfigurationError(
                "Authenticated SMTP requires TLS or SSL."
            )

    def _build_message(
        self,
        recipient_email: str,
        code: str,
        expires_in_minutes: int,
    ) -> EmailMessage:
        message = EmailMessage()
        message["Subject"] = "Your DegreeLabs verification code"
        message["From"] = (
            f"{self.config.smtp_from_name} <{self.config.smtp_from_email}>"
        )
        message["To"] = recipient_email
        message.set_content(
            "\n".join(
                [
                    "DegreeLabs sign-in verification",
                    "",
                    f"Your verification code is: {code}",
                    "",
                    f"This code expires in {expires_in_minutes} minutes.",
                    "If you did not attempt to sign in, you can ignore this email.",
                ]
            )
        )
        message.add_alternative(
            self._build_html_message(code, expires_in_minutes),
            subtype="html",
        )
        return message

    def _authenticate_and_send(
        self,
        client: smtplib.SMTP,
        message: EmailMessage,
        *,
        use_tls: bool,
    ) -> None:
        client.ehlo()

        if use_tls:
            client.starttls(context=ssl.create_default_context())
            client.ehlo()

        if self.config.smtp_username:
            client.login(
                self.config.smtp_username,
                self.config.smtp_password,
            )

        client.send_message(message)

    def _build_html_message(self, code: str, expires_in_minutes: int) -> str:
        safe_code = escape(code)
        safe_name = escape(self.config.smtp_from_name)

        return f"""\
<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f5f9ff;font-family:Arial,sans-serif;color:#10233f">
    <div style="max-width:520px;margin:0 auto;padding:40px 20px">
      <div style="background:#ffffff;border:1px solid #d8e5f5;border-radius:20px;padding:32px">
        <div style="font-size:24px;font-weight:800">Degree<span style="color:#3978f6">Labs</span></div>
        <p style="margin:24px 0 8px;font-size:18px;font-weight:700">Confirm your sign in</p>
        <p style="margin:0;color:#58708e;line-height:1.6">
          Use this verification code to complete your {safe_name} sign in.
        </p>
        <div style="margin:24px 0;padding:18px;border-radius:14px;background:#eff8ff;text-align:center;font-family:monospace;font-size:30px;font-weight:800;letter-spacing:8px;color:#255ed8">
          {safe_code}
        </div>
        <p style="margin:0;color:#58708e;font-size:14px;line-height:1.6">
          This code expires in {expires_in_minutes} minutes. If you did not attempt to sign in, you can safely ignore this email.
        </p>
      </div>
    </div>
  </body>
</html>
"""
