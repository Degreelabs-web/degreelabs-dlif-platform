"""add extended mentor profile fields

Revision ID: b5c6d7e8f9a0
Revises: f4e5d6c7b8a9
Create Date: 2026-09-11 10:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "b5c6d7e8f9a0"
down_revision: Union[str, Sequence[str], None] = "f4e5d6c7b8a9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("mentors", sa.Column("location", sa.String(length=255), nullable=True))
    op.add_column(
        "mentors",
        sa.Column("professional_headline", sa.String(length=500), nullable=True),
    )
    op.add_column("mentors", sa.Column("headshot_url", sa.String(length=2048), nullable=True))
    op.add_column(
        "mentors",
        sa.Column(
            "industries",
            postgresql.ARRAY(sa.String(length=100)),
            server_default=sa.text("'{}'::character varying[]"),
            nullable=False,
        ),
    )
    op.add_column(
        "mentors",
        sa.Column(
            "support_preferences",
            postgresql.ARRAY(sa.String(length=255)),
            server_default=sa.text("'{}'::character varying[]"),
            nullable=False,
        ),
    )
    op.add_column("mentors", sa.Column("mentor_statement", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("mentors", "mentor_statement")
    op.drop_column("mentors", "support_preferences")
    op.drop_column("mentors", "industries")
    op.drop_column("mentors", "headshot_url")
    op.drop_column("mentors", "professional_headline")
    op.drop_column("mentors", "location")
