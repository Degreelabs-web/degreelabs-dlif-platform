"""add project mentor assignment

Revision ID: 6a7b8c9d0e1f
Revises: 5f6a7b8c9d0e
Create Date: 2026-09-17
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "6a7b8c9d0e1f"
down_revision = "5f6a7b8c9d0e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("mentor_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_projects_mentor_id_mentors",
        "projects",
        "mentors",
        ["mentor_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_projects_mentor_id", "projects", ["mentor_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_projects_mentor_id", table_name="projects")
    op.drop_constraint("fk_projects_mentor_id_mentors", "projects", type_="foreignkey")
    op.drop_column("projects", "mentor_id")
