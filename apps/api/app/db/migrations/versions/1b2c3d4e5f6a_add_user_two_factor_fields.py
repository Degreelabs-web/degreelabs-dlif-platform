"""add user two factor fields

Revision ID: 1b2c3d4e5f6a
Revises: 0a1b2c3d4e5f
Create Date: 2026-09-15
"""

from alembic import op
import sqlalchemy as sa


revision = "1b2c3d4e5f6a"
down_revision = "0a1b2c3d4e5f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "two_factor_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.add_column(
        "users",
        sa.Column("two_factor_secret", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("two_factor_otp_code", sa.String(length=6), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("two_factor_otp_expires_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "two_factor_otp_expires_at")
    op.drop_column("users", "two_factor_otp_code")
    op.drop_column("users", "two_factor_secret")
    op.drop_column("users", "two_factor_enabled")
