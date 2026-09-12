"""add mentor password setup tracking

Revision ID: a8b9c0d1e2f3
Revises: d7e8f9a0b1c2
Create Date: 2026-09-12
"""

from alembic import op
import sqlalchemy as sa


revision = "a8b9c0d1e2f3"
down_revision = "d7e8f9a0b1c2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "mentors",
        sa.Column("password_setup_status", sa.String(length=30), nullable=False, server_default="pending"),
    )
    op.add_column("mentors", sa.Column("password_setup_sent_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("mentors", sa.Column("password_setup_completed_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_mentors_password_setup_status", "mentors", ["password_setup_status"])


def downgrade() -> None:
    op.drop_index("ix_mentors_password_setup_status", table_name="mentors")
    op.drop_column("mentors", "password_setup_completed_at")
    op.drop_column("mentors", "password_setup_sent_at")
    op.drop_column("mentors", "password_setup_status")
