"""add student material access mode

Revision ID: 0a1b2c3d4e5f
Revises: f9a0b1c2d3e4
Create Date: 2026-09-15
"""

from alembic import op
import sqlalchemy as sa


revision = "0a1b2c3d4e5f"
down_revision = "f9a0b1c2d3e4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "materials",
        sa.Column(
            "student_access_mode",
            sa.String(length=30),
            nullable=False,
            server_default="view_download",
        ),
    )


def downgrade() -> None:
    op.drop_column("materials", "student_access_mode")
