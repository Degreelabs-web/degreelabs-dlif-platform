from datetime import datetime
from uuid import UUID, uuid4

# pyrefly: ignore [missing-import]
from sqlalchemy import (
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
    func,
)
# pyrefly: ignore [missing-import]
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Batch(Base):
    __tablename__ = "batches"

    __table_args__ = (
        UniqueConstraint(
            "cohort_id",
            "name",
            name="uq_batch_cohort_name",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    cohort_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("cohorts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="active",
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