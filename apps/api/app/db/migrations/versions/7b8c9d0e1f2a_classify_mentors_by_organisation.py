"""classify mentors by organisation

Revision ID: 7b8c9d0e1f2a
Revises: 6a7b8c9d0e1f
Create Date: 2026-09-17
"""

from alembic import op


revision = "7b8c9d0e1f2a"
down_revision = "6a7b8c9d0e1f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Existing records need the same employer-derived categorisation as newly
    # imported and manually-created mentors. Whitespace differences in the
    # employer name are ignored and common DegreeLabs legal suffixes are kept
    # in the internal directory.
    op.execute(
        """
        UPDATE mentors
        SET mentor_category = CASE
            WHEN lower(regexp_replace(coalesce(company_name, ''), '\\s+', '', 'g'))
                 LIKE 'degreelabs%'
                THEN 'dlif'
            ELSE 'external_specialist'
        END
        """
    )


def downgrade() -> None:
    # The prior category cannot be reconstructed reliably. Keep the derived
    # values in place when rolling back this data-only migration.
    pass
