"""add session delivery lifecycle

Revision ID: 4e5f6a7b8c9d
Revises: 3d4e5f6a7b8c
Create Date: 2026-09-16
"""

from alembic import op
import sqlalchemy as sa


revision = "4e5f6a7b8c9d"
down_revision = "3d4e5f6a7b8c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("sessions", sa.Column("agenda", sa.Text(), nullable=True))
    op.add_column("sessions", sa.Column("session_type", sa.String(length=50), nullable=False, server_default="workshop"))
    op.add_column("sessions", sa.Column("facilitator_name", sa.String(length=255), nullable=True))
    op.add_column("sessions", sa.Column("join_available_from", sa.DateTime(timezone=True), nullable=True))
    op.add_column("sessions", sa.Column("join_available_until", sa.DateTime(timezone=True), nullable=True))
    op.add_column("sessions", sa.Column("recording_url", sa.String(length=2048), nullable=True))
    op.add_column("sessions", sa.Column("published_at", sa.DateTime(timezone=True), nullable=True))
    op.alter_column("sessions", "session_type", server_default=None)


def downgrade() -> None:
    op.drop_column("sessions", "published_at")
    op.drop_column("sessions", "recording_url")
    op.drop_column("sessions", "join_available_until")
    op.drop_column("sessions", "join_available_from")
    op.drop_column("sessions", "facilitator_name")
    op.drop_column("sessions", "session_type")
    op.drop_column("sessions", "agenda")
