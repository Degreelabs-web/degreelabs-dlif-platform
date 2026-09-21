"""add student password setup tracking

Revision ID: ae22d5ea1484
Revises: 8d9e0f1a2b3c
Create Date: 2026-09-21 11:56:22.536693

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ae22d5ea1484'
down_revision: Union[str, Sequence[str], None] = '8d9e0f1a2b3c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add onboarding tracking fields.
    # Start password_setup_status as nullable so existing students can be
    # backfilled safely before enforcing NOT NULL.
    op.add_column(
        "student_profiles",
        sa.Column(
            "password_setup_status",
            sa.String(length=30),
            nullable=True,
        ),
    )

    op.add_column(
        "student_profiles",
        sa.Column(
            "password_setup_sent_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.add_column(
        "student_profiles",
        sa.Column(
            "password_setup_completed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    # Existing students were created before this onboarding flow existed.
    # Treat them as already onboarded so they are not suddenly blocked.
    op.execute(
        """
        UPDATE student_profiles
        SET password_setup_status = 'completed'
        WHERE password_setup_status IS NULL
        """
    )

    # Future student profiles default to pending until the student
    # finishes the password setup flow.
    op.alter_column(
        "student_profiles",
        "password_setup_status",
        existing_type=sa.String(length=30),
        nullable=False,
        server_default="pending",
    )

    op.create_index(
        "ix_student_profiles_password_setup_status",
        "student_profiles",
        ["password_setup_status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_student_profiles_password_setup_status",
        table_name="student_profiles",
    )

    op.drop_column(
        "student_profiles",
        "password_setup_completed_at",
    )

    op.drop_column(
        "student_profiles",
        "password_setup_sent_at",
    )

    op.drop_column(
        "student_profiles",
        "password_setup_status",
    )
