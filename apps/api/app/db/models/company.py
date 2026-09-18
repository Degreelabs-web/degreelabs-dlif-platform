from datetime import datetime
from uuid import UUID, uuid4

# pyrefly: ignore [missing-import]
from sqlalchemy import DateTime, JSON, String, Text, func
# pyrefly: ignore [missing-import]
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    slug: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    profile: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    industry: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    website: Mapped[str | None] = mapped_column(
        String(2048),
        nullable=True,
    )

    contact_email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    contact_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    contact_phone: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    logo_url: Mapped[str | None] = mapped_column(
        String(2048),
        nullable=True,
    )

    tagline: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    accreditation: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    category: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    founder_sponsor: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    founder_title: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    public_journey_stages: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
    )

    brand_colors: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    reference_challenge_areas: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="active",
        index=True,
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
