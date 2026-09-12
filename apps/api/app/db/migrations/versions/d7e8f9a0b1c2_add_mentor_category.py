"""add mentor category

Revision ID: d7e8f9a0b1c2
Revises: c6d7e8f9a0b1
Create Date: 2026-09-12
"""

from alembic import op
import sqlalchemy as sa


revision = "d7e8f9a0b1c2"
down_revision = "c6d7e8f9a0b1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "mentors",
        sa.Column(
            "mentor_category",
            sa.String(length=50),
            nullable=False,
            server_default="dlif",
        ),
    )
    op.create_index(
        "ix_mentors_mentor_category",
        "mentors",
        ["mentor_category"],
    )


def downgrade() -> None:
    op.drop_index("ix_mentors_mentor_category", table_name="mentors")
    op.drop_column("mentors", "mentor_category")
