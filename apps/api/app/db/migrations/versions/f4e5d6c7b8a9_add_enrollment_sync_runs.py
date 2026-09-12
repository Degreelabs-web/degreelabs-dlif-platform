"""add enrollment sync runs

Revision ID: f4e5d6c7b8a9
Revises: e20b9dbb8e2c
Create Date: 2026-09-11 15:00:00.000000
"""

from typing import Sequence, Union

# pyrefly: ignore [missing-import]
from alembic import op
# pyrefly: ignore [missing-import]
import sqlalchemy as sa


revision: str = "f4e5d6c7b8a9"
down_revision: Union[str, Sequence[str], None] = "e20b9dbb8e2c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "enrollment_sync_runs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("trigger", sa.String(length=30), nullable=False),
        sa.Column("source_type", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rows_processed", sa.Integer(), server_default="0", nullable=False),
        sa.Column("students_created", sa.Integer(), server_default="0", nullable=False),
        sa.Column("students_updated", sa.Integer(), server_default="0", nullable=False),
        sa.Column("mentors_created", sa.Integer(), server_default="0", nullable=False),
        sa.Column("mentors_updated", sa.Integer(), server_default="0", nullable=False),
        sa.Column("rows_skipped", sa.Integer(), server_default="0", nullable=False),
        sa.Column("validation_errors", sa.JSON(), nullable=False),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_enrollment_sync_runs_started_at"),
        "enrollment_sync_runs",
        ["started_at"],
        unique=False,
    )
    op.create_index(
        op.f("ix_enrollment_sync_runs_status"),
        "enrollment_sync_runs",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_enrollment_sync_runs_status"),
        table_name="enrollment_sync_runs",
    )
    op.drop_index(
        op.f("ix_enrollment_sync_runs_started_at"),
        table_name="enrollment_sync_runs",
    )
    op.drop_table("enrollment_sync_runs")
