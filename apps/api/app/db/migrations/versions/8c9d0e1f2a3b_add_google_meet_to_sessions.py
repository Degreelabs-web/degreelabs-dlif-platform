"""add google meet fields to sessions

Revision ID: 8c9d0e1f2a3b
Revises: 7b8c9d0e1f2a
Create Date: 2026-09-17
"""

from alembic import op
import sqlalchemy as sa


revision = "8c9d0e1f2a3b"
down_revision = "7b8c9d0e1f2a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "sessions",
        sa.Column("google_event_id", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "sessions",
        sa.Column("meet_link", sa.String(length=2048), nullable=True),
    )
    op.add_column(
        "sessions",
        sa.Column(
            "meet_status",
            sa.String(length=50),
            nullable=False,
            server_default="not_scheduled",
        ),
    )
    # Remove server_default so future inserts must pass the value explicitly
    op.alter_column("sessions", "meet_status", server_default=None)


def downgrade() -> None:
    op.drop_column("sessions", "meet_status")
    op.drop_column("sessions", "meet_link")
    op.drop_column("sessions", "google_event_id")
