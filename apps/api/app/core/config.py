from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "DLIF Platform API"
    app_version: str = "0.1.0"
    environment: str = "development"

    cors_origins: str = "http://localhost:3000"

    database_url: str = ""

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "DegreeLabs"
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False
    smtp_timeout_seconds: float = 10.0

    two_factor_challenge_secret: str = ""
    two_factor_challenge_ttl_seconds: int = 300

    enrollment_sync_enabled: bool = False
    enrollment_excel_source_type: str = "local"
    enrollment_excel_source: str = ""
    # Persistent destination for browser-uploaded workbooks. This remains
    # available even when the primary source is Google Sheets.
    enrollment_upload_source: str = "data/enrollment-upload.xlsx"
    enrollment_student_sheet: str = "Students"
    enrollment_mentor_sheet: str = "Mentors"
    enrollment_google_spreadsheet_id: str = ""
    enrollment_google_mentor_range: str = "Form responses 1!A:AZ"
    enrollment_google_service_account_file: str = ""
    enrollment_google_webhook_secret: str = ""
    mentor_onboarding_requires_approval: bool = False
    enrollment_sync_interval_minutes: int = 5
    enrollment_invite_redirect_url: str = ""
    # Exact URL allowed in Supabase Auth redirect URLs. Password setup links
    # are generated server-side and sent by the configured email provider.
    mentor_password_setup_redirect_url: str = ""
    enrollment_upload_max_mb: int = 10

    material_storage_bucket: str = "dlif-student-materials"
    material_max_upload_mb: int = 50
    material_signed_url_ttl_seconds: int = 600

    # Private bucket used for mentor profile photographs. Keep this separate
    # from learning materials so access and retention can be managed safely.
    mentor_headshot_storage_bucket: str = "dlif-mentor-headshots"
    mentor_headshot_max_upload_mb: int = 5
    mentor_headshot_signed_url_ttl_seconds: int = 600

    # Private bucket for student profile photographs.
    student_photo_storage_bucket: str = "dlif-student-photos"
    student_photo_max_upload_mb: int = 5
    student_photo_signed_url_ttl_seconds: int = 600
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
