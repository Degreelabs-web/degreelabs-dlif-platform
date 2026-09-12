from datetime import datetime
from uuid import UUID, uuid4

# pyrefly: ignore [missing-import]
from sqlalchemy import DateTime, Integer, JSON, String, Text, func
# pyrefly: ignore [missing-import]
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class EnrollmentSyncRun(Base):
    __tablename__ = "enrollment_sync_runs"

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    trigger: Mapped[str] = mapped_column(String(30), nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    rows_processed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    students_created: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    students_updated: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    mentors_created: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    mentors_updated: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rows_skipped: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    validation_errors: Mapped[list[dict]] = mapped_column(
        JSON,
        default=list,
        nullable=False,
    )
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)

