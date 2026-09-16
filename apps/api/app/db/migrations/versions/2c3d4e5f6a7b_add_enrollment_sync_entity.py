"""track enrollment sync entity

Revision ID: 2c3d4e5f6a7b
Revises: 1b2c3d4e5f6a
Create Date: 2026-09-16
"""

from alembic import op
import sqlalchemy as sa


revision = "2c3d4e5f6a7b"
down_revision = "1b2c3d4e5f6a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "enrollment_sync_runs",
        sa.Column(
            "entity",
            sa.String(length=20),
            nullable=False,
            server_default="both",
        ),
    )
    op.create_index(
        "ix_enrollment_sync_runs_entity",
        "enrollment_sync_runs",
        ["entity"],
    )


def downgrade() -> None:
    op.drop_index("ix_enrollment_sync_runs_entity", table_name="enrollment_sync_runs")
    op.drop_column("enrollment_sync_runs", "entity")
