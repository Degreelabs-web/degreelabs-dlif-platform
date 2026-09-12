"""add mentor enrollment source key

Revision ID: b9c0d1e2f3a4
Revises: a8b9c0d1e2f3
Create Date: 2026-09-12
"""

from alembic import op
import sqlalchemy as sa


revision = "b9c0d1e2f3a4"
down_revision = "a8b9c0d1e2f3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("mentors", sa.Column("enrollment_source_key", sa.String(length=100), nullable=True))
    op.create_index("ix_mentors_enrollment_source_key", "mentors", ["enrollment_source_key"])


def downgrade() -> None:
    op.drop_index("ix_mentors_enrollment_source_key", table_name="mentors")
    op.drop_column("mentors", "enrollment_source_key")
