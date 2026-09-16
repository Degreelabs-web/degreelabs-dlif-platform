"""add institution address

Revision ID: 3d4e5f6a7b8c
Revises: 2c3d4e5f6a7b
Create Date: 2026-09-16
"""

from alembic import op
import sqlalchemy as sa


revision = "3d4e5f6a7b8c"
down_revision = "2c3d4e5f6a7b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("institutions", sa.Column("address", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("institutions", "address")
