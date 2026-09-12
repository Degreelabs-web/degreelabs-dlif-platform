from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Mentor(Base):
    __tablename__ = "mentors"

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    user_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    phone: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    bio: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    expertise: Mapped[list[str]] = mapped_column(
        ARRAY(String(100)),
        nullable=False,
        default=list,
    )

    years_of_experience: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    company_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    designation: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    location: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    city: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    country: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    professional_headline: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    linkedin_url: Mapped[str | None] = mapped_column(
        String(2048),
        nullable=True,
    )

    github_url: Mapped[str | None] = mapped_column(
        String(2048),
        nullable=True,
    )

    headshot_url: Mapped[str | None] = mapped_column(
        String(2048),
        nullable=True,
    )

    industries: Mapped[list[str]] = mapped_column(
        ARRAY(String(100)),
        nullable=False,
        default=list,
    )

    support_preferences: Mapped[list[str]] = mapped_column(
        ARRAY(String(255)),
        nullable=False,
        default=list,
    )

    mentor_statement: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="active",
        index=True,
    )

    mentor_category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="dlif",
        index=True,
    )

    # Identifies whether this profile is managed by a roster source or was
    # created manually. It lets synchronization safely reconcile deletions
    # without deleting manually provisioned mentors.
    enrollment_source_key: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    # Supabase owns the one-time recovery token. We retain only delivery and
    # completion metadata so an administrator can safely re-send a setup link
    # without persisting a credential or token in the application database.
    password_setup_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="pending",
        index=True,
    )

    password_setup_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    password_setup_completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    @property
    def current_role(self) -> str | None:
        return self.designation

    @current_role.setter
    def current_role(self, value: str | None) -> None:
        self.designation = value

    @property
    def organisation(self) -> str | None:
        return self.company_name

    @organisation.setter
    def organisation(self, value: str | None) -> None:
        self.company_name = value

    @property
    def professional_headshot_url(self) -> str | None:
        return self.headshot_url

    @professional_headshot_url.setter
    def professional_headshot_url(self, value: str | None) -> None:
        self.headshot_url = value

    @property
    def mentoring_statement(self) -> str | None:
        return self.mentor_statement

    @mentoring_statement.setter
    def mentoring_statement(self, value: str | None) -> None:
        self.mentor_statement = value
