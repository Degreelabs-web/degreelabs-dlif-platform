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
                client = smtplib.SMTP_SSL(
                    self.config.smtp_host,
                    self.config.smtp_port,
                    timeout=self.config.smtp_timeout_seconds,
                    context=ssl.create_default_context(),
                )
                self._send_and_close(client, message, use_tls=False)
            else:
                client = smtplib.SMTP(
                    self.config.smtp_host,
                    self.config.smtp_port,
                    timeout=self.config.smtp_timeout_seconds,
                )
                self._send_and_close(
                    client,
                    message,
                    use_tls=self.config.smtp_use_tls,
                )
        except (OSError, ValueError, smtplib.SMTPException) as exc:
            raise EmailDeliveryError(
                "The verification email could not be delivered."
            ) from exc

    def send_password_setup_link(
        self,
        recipient_email: str,
        full_name: str,
        setup_link: str,
    ) -> None:
        """Deliver a one-time Supabase recovery link; never send a password."""
        self._validate_configuration()
        try:
            message = EmailMessage()
            message["Subject"] = "Set up your DegreeLabs mentor account"
            message["From"] = (
                f"{self.config.smtp_from_name} <{self.config.smtp_from_email}>"
            )
            message["To"] = recipient_email
            message.set_content(
                "\n".join(
                    [
                        f"Hello {full_name},",
                        "",
                        "Your DegreeLabs mentor profile is ready.",
                        "Use this secure, one-time link to set your password:",
                        setup_link,
                        "",
                        "If you did not expect this email, you can safely ignore it.",
                    ]
                )
            )
            safe_name = escape(full_name)
            safe_link = escape(setup_link, quote=True)
            message.add_alternative(
                f'''<!doctype html><html><body style="margin:0;background:#f5f9ff;font-family:Arial,sans-serif;color:#10233f"><div style="max-width:520px;margin:0 auto;padding:40px 20px"><div style="background:#fff;border:1px solid #d8e5f5;border-radius:20px;padding:32px"><div style="font-size:24px;font-weight:800">Degree<span style="color:#3978f6">Labs</span></div><p style="margin:24px 0 8px;font-size:18px;font-weight:700">Set up your mentor account</p><p>Hello {safe_name}, your mentor profile is ready. Choose a password to activate your account.</p><p style="margin:28px 0"><a href="{safe_link}" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:700">Set your password</a></p><p style="color:#58708e;font-size:14px;line-height:1.6">This link is single-use and expires according to the security policy. We will never email you a password.</p></div></div></body></html>''',
                subtype="html",
            )
            self._deliver_message(message)
        except (OSError, ValueError, smtplib.SMTPException) as exc:
            raise EmailDeliveryError("The password setup email could not be delivered.") from exc

    def send_student_password_setup_link(
        self,
        recipient_email: str,
        full_name: str,
        setup_link: str,
    ) -> None:
        self._validate_configuration()

        try:
            message = EmailMessage()

            message["Subject"] = "Activate your DegreeLabs student account"
            message["From"] = (
                f"{self.config.smtp_from_name} "
                f"<{self.config.smtp_from_email}>"
            )
            message["To"] = recipient_email

            message.set_content(
                "\n".join(
                    [
                        f"Hello {full_name},",
                        "",
                        "Your DegreeLabs student account has been created.",
                        "",
                        f"Username: {recipient_email}",
                        "",
                        "Use the secure link below to set your password:",
                        setup_link,
                        "",
                        "After setting your password, sign in to the Student Portal.",
                        "You will be asked to complete two-factor authentication.",
                        "",
                        "If you did not expect this email, you can safely ignore it.",
                    ]
                )
            )

            safe_name = escape(full_name)
            safe_email = escape(recipient_email)
            safe_link = escape(setup_link, quote=True)

            message.add_alternative(
                f"""
                <!doctype html>
                <html>
                <body style="
                    margin:0;
                    background:#f5f9ff;
                    font-family:Arial,sans-serif;
                    color:#10233f;
                ">
                    <div style="
                    max-width:520px;
                    margin:0 auto;
                    padding:40px 20px;
                    ">
                    <div style="
                        background:#ffffff;
                        border:1px solid #d8e5f5;
                        border-radius:20px;
                        padding:32px;
                    ">

                        <div style="
                        font-size:24px;
                        font-weight:800;
                        ">
                        Degree<span style="color:#3978f6">Labs</span>
                        </div>

                        <p style="
                        margin:24px 0 8px;
                        font-size:18px;
                        font-weight:700;
                        ">
                        Activate your student account
                        </p>

                        <p>
                        Hello {safe_name},
                        </p>

                        <p>
                        Your DegreeLabs student account has been created.
                        </p>

                        <p>
                        <strong>Username</strong><br>
                        {safe_email}
                        </p>

                        <p>
                        Create your password using the secure link below.
                        </p>

                        <p style="margin:28px 0">
                        <a
                            href="{safe_link}"
                            style="
                            display:inline-block;
                            background:#2563eb;
                            color:#ffffff;
                            padding:14px 22px;
                            border-radius:10px;
                            text-decoration:none;
                            font-weight:700;
                            "
                        >
                            Set Your Password
                        </a>
                        </p>

                        <p style="
                        color:#58708e;
                        font-size:14px;
                        line-height:1.6;
                        ">
                        After setting your password, sign in to the Student
                        Portal. You will complete two-factor authentication
                        during sign in.
                        </p>

                        <p style="
                        color:#58708e;
                        font-size:14px;
                        line-height:1.6;
                        ">
                        This is a secure single-use password setup link.
                        DegreeLabs will never email you your password.
                        </p>

                    </div>
                    </div>
                </body>
                </html>
                """,
                subtype="html",
            )

            if self.config.smtp_use_ssl:
                client = smtplib.SMTP_SSL(
                    self.config.smtp_host,
                    self.config.smtp_port,
                    timeout=self.config.smtp_timeout_seconds,
                    context=ssl.create_default_context(),
                )

                self._send_and_close(
                    client,
                    message,
                    use_tls=False,
                )

            else:
                client = smtplib.SMTP(
                    self.config.smtp_host,
                    self.config.smtp_port,
                    timeout=self.config.smtp_timeout_seconds,
                )

                self._send_and_close(
                    client,
                    message,
                    use_tls=self.config.smtp_use_tls,
                )

        except (OSError, ValueError, smtplib.SMTPException) as exc:
            raise EmailDeliveryError(
                "The student account setup email could not be delivered."
            ) from exc

    def _deliver_message(self, message: EmailMessage) -> None:
        self._validate_configuration()
        if self.config.smtp_use_ssl:
            client = smtplib.SMTP_SSL(
                self.config.smtp_host,
                self.config.smtp_port,
                timeout=self.config.smtp_timeout_seconds,
                context=ssl.create_default_context(),
            )
            self._send_and_close(client, message, use_tls=False)
        else:
            client = smtplib.SMTP(
                self.config.smtp_host,
                self.config.smtp_port,
                timeout=self.config.smtp_timeout_seconds,
            )
            self._send_and_close(client, message, use_tls=self.config.smtp_use_tls)

    def send_mentor_slot_requested_admin(
        self,
        *,
        team_name: str,
        lead_name: str,
        preferred_date: str,
        time_window: str,
        topic: str,
        request_id: str,
    ) -> None:
        """Notify the DLIF admin when a team lead submits a mentor slot request."""
        recipient = self.config.admin_notification_email or "admin.dlif@degreelabs.com"
        message = EmailMessage()
        message["Subject"] = f"New Mentor Slot Request: {team_name} (Lead: {lead_name})"
        message["From"] = f"{self.config.smtp_from_name} <{self.config.smtp_from_email}>"
        message["To"] = recipient

        body_text = "\n".join([
            "DLIF Administrator,",
            "",
            f"A new mentor slot request has been submitted by {lead_name} on behalf of Team {team_name}.",
            "",
            f"Preferred Date: {preferred_date}",
            f"Preferred Time Window: {time_window}",
            f"Topic / Agenda: {topic}",
            "",
            "Please review, assign a mentor, and approve or decline in the Admin Command Center:",
            "/admin/mentor-slots",
        ])
        message.set_content(body_text)

        safe_team = escape(team_name)
        safe_lead = escape(lead_name)
        safe_date = escape(preferred_date)
        safe_time = escape(time_window)
        safe_topic = escape(topic)

        message.add_alternative(
            f'''<!doctype html><html><body style="margin:0;background:#f5f9ff;font-family:Arial,sans-serif;color:#10233f"><div style="max-width:560px;margin:0 auto;padding:32px 16px"><div style="background:#fff;border:1px solid #d8e5f5;border-radius:16px;padding:32px"><div style="font-size:22px;font-weight:800">Degree<span style="color:#3978f6">Labs</span></div><h2 style="margin:20px 0 8px;font-size:18px;color:#0f172a">New Mentor Slot Request</h2><p style="color:#475569;margin-top:0">A team lead has requested an advisory consultation slot.</p><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:20px 0"><p style="margin:0 0 8px"><strong>Team:</strong> {safe_team}</p><p style="margin:0 0 8px"><strong>Fellow Lead:</strong> {safe_lead}</p><p style="margin:0 0 8px"><strong>Preferred Date:</strong> {safe_date}</p><p style="margin:0 0 8px"><strong>Time Window:</strong> {safe_time}</p><p style="margin:0"><strong>Agenda:</strong> {safe_topic}</p></div><p style="color:#64748b;font-size:13px">Log in to the Admin Dashboard to review, assign an available mentor, and generate the Google Meet room.</p></div></div></body></html>''',
            subtype="html",
        )
        try:
            self._deliver_message(message)
        except Exception as exc:
            # Do not crash the request if transactional email delivery fails in dev/test
            pass

    def send_mentor_slot_approved(
        self,
        *,
        recipient_emails: list[str],
        team_name: str,
        mentor_name: str,
        confirmed_time: str,
        meet_link: str,
        topic: str,
    ) -> None:
        """Notify team members and the assigned mentor of the confirmed session."""
        valid_recipients = [e for e in recipient_emails if e and "@" in e]
        if not valid_recipients:
            return

        message = EmailMessage()
        message["Subject"] = f"Mentor Slot Confirmed: Team {team_name} with {mentor_name}"
        message["From"] = f"{self.config.smtp_from_name} <{self.config.smtp_from_email}>"
        message["To"] = ", ".join(valid_recipients)

        body_text = "\n".join([
            f"Hello Team {team_name},",
            "",
            "Your mentor consultation slot has been confirmed!",
            "",
            f"Assigned Mentor: {mentor_name}",
            f"Scheduled Date & Time: {confirmed_time}",
            f"Topic / Agenda: {topic}",
            f"Google Meet Link: {meet_link}",
            "",
            "Please join the room 5 minutes prior to the start time.",
        ])
        message.set_content(body_text)

        safe_team = escape(team_name)
        safe_mentor = escape(mentor_name)
        safe_time = escape(confirmed_time)
        safe_meet = escape(meet_link, quote=True)
        safe_topic = escape(topic)

        message.add_alternative(
            f'''<!doctype html><html><body style="margin:0;background:#f5f9ff;font-family:Arial,sans-serif;color:#10233f"><div style="max-width:560px;margin:0 auto;padding:32px 16px"><div style="background:#fff;border:1px solid #d8e5f5;border-radius:16px;padding:32px"><div style="font-size:22px;font-weight:800">Degree<span style="color:#3978f6">Labs</span></div><h2 style="margin:20px 0 8px;font-size:18px;color:#0f172a">Mentor Slot Confirmed</h2><p style="color:#475569;margin-top:0">Your team consultation session is scheduled.</p><div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:16px;margin:20px 0"><p style="margin:0 0 8px"><strong>Team:</strong> {safe_team}</p><p style="margin:0 0 8px"><strong>Assigned Mentor:</strong> {safe_mentor}</p><p style="margin:0 0 8px"><strong>Date &amp; Time:</strong> {safe_time}</p><p style="margin:0 0 16px"><strong>Topic:</strong> {safe_topic}</p><a href="{safe_meet}" style="display:inline-block;background:#0284c7;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700">Join Google Meet</a></div><p style="color:#64748b;font-size:13px">You can also join directly from your DegreeLabs Student Dashboard under Upcoming Sessions.</p></div></div></body></html>''',
            subtype="html",
        )
        try:
            self._deliver_message(message)
        except Exception:
            pass

    def send_mentor_slot_declined(
        self,
        *,
        recipient_emails: list[str],
        team_name: str,
        admin_note: str,
        topic: str,
    ) -> None:
        """Notify the team lead if a slot request could not be accommodated."""
        valid_recipients = [e for e in recipient_emails if e and "@" in e]
        if not valid_recipients:
            return

        message = EmailMessage()
        message["Subject"] = f"Mentor Slot Request Update: Team {team_name}"
        message["From"] = f"{self.config.smtp_from_name} <{self.config.smtp_from_email}>"
        message["To"] = ", ".join(valid_recipients)

        body_text = "\n".join([
            f"Hello Team {team_name},",
            "",
            "Your recent mentor slot request could not be scheduled at this time.",
            "",
            f"Topic: {topic}",
            f"Admin Note: {admin_note}",
            "",
            "You may submit an updated request with alternative time slots via your Team Workspace.",
        ])
        message.set_content(body_text)

        safe_team = escape(team_name)
        safe_note = escape(admin_note)
        safe_topic = escape(topic)

        message.add_alternative(
            f'''<!doctype html><html><body style="margin:0;background:#f5f9ff;font-family:Arial,sans-serif;color:#10233f"><div style="max-width:560px;margin:0 auto;padding:32px 16px"><div style="background:#fff;border:1px solid #d8e5f5;border-radius:16px;padding:32px"><div style="font-size:22px;font-weight:800">Degree<span style="color:#3978f6">Labs</span></div><h2 style="margin:20px 0 8px;font-size:18px;color:#0f172a">Mentor Slot Request Update</h2><p style="color:#475569;margin-top:0">Status update for Team {safe_team}</p><div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:20px 0"><p style="margin:0 0 8px"><strong>Topic:</strong> {safe_topic}</p><p style="margin:0"><strong>Admin Note:</strong> {safe_note}</p></div><p style="color:#64748b;font-size:13px">Please coordinate with your team and submit an updated slot request with alternate availability.</p></div></div></body></html>''',
            subtype="html",
        )
        try:
            self._deliver_message(message)
        except Exception:
            pass

    def send_mentor_slot_cancelled(
        self,
        *,
        recipient_emails: list[str],
        team_name: str,
        topic: str,
        scheduled_time: str | None = None,
        mentor_name: str | None = None,
        reason: str | None = None,
    ) -> None:
        """Notify students (and mentor) when a mentor session or slot request is cancelled."""
        valid_recipients = [e for e in recipient_emails if e and "@" in e]
        if not valid_recipients:
            return

        message = EmailMessage()
        message["Subject"] = f"Mentor Session Cancelled: Team {team_name}"
        message["From"] = f"{self.config.smtp_from_name} <{self.config.smtp_from_email}>"
        message["To"] = ", ".join(valid_recipients)

        lines = [
            f"Hello Team {team_name},",
            "",
            "Please note that the following mentor consultation session has been cancelled:",
            "",
            f"Topic / Agenda: {topic}",
        ]
        if mentor_name:
            lines.append(f"Mentor: {mentor_name}")
        if scheduled_time:
            lines.append(f"Scheduled Time: {scheduled_time}")
        if reason:
            lines.append(f"Reason / Note: {reason}")
        lines.extend([
            "",
            "If you need to reschedule or request another slot, please submit a new request via your Team Workspace.",
            "",
            "DegreeLabs Fellowship Team",
        ])
        body_text = "\n".join(lines)
        message.set_content(body_text)

        safe_team = escape(team_name)
        safe_topic = escape(topic)
        safe_mentor = escape(mentor_name) if mentor_name else None
        safe_time = escape(scheduled_time) if scheduled_time else None
        safe_reason = escape(reason) if reason else None

        details_html = f"<p style='margin:0 0 8px'><strong>Team:</strong> {safe_team}</p>"
        details_html += f"<p style='margin:0 0 8px'><strong>Topic:</strong> {safe_topic}</p>"
        if safe_mentor:
            details_html += f"<p style='margin:0 0 8px'><strong>Mentor:</strong> {safe_mentor}</p>"
        if safe_time:
            details_html += f"<p style='margin:0 0 8px'><strong>Time:</strong> {safe_time}</p>"
        if safe_reason:
            details_html += f"<p style='margin:0'><strong>Note:</strong> {safe_reason}</p>"

        message.add_alternative(
            f'''<!doctype html><html><body style="margin:0;background:#f5f9ff;font-family:Arial,sans-serif;color:#10233f"><div style="max-width:560px;margin:0 auto;padding:32px 16px"><div style="background:#fff;border:1px solid #d8e5f5;border-radius:16px;padding:32px"><div style="font-size:22px;font-weight:800">Degree<span style="color:#3978f6">Labs</span></div><h2 style="margin:20px 0 8px;font-size:18px;color:#dc2626">Mentor Session Cancelled</h2><p style="color:#475569;margin-top:0">The mentor consultation session for Team {safe_team} has been cancelled.</p><div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:20px 0">{details_html}</div><p style="color:#64748b;font-size:13px">You can submit a new slot request with updated availability anytime from your Team Workspace on the DegreeLabs platform.</p></div></div></body></html>''',
            subtype="html",
        )
        try:
            self._deliver_message(message)
        except Exception:
            pass

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

    def _send_and_close(
        self,
        client: smtplib.SMTP,
        message: EmailMessage,
        *,
        use_tls: bool,
    ) -> None:
        """Deliver a message without treating a post-delivery QUIT failure as a send failure."""
        delivered = False
        try:
            self._authenticate_and_send(client, message, use_tls=use_tls)
            delivered = True
        finally:
            try:
                client.quit()
            except (OSError, smtplib.SMTPException):
                client.close()
                if not delivered:
                    raise

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
