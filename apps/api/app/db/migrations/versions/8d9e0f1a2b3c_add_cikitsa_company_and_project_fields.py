"""add_cikitsa_company_and_project_fields

Revision ID: 8d9e0f1a2b3c
Revises: 7c2f3c2a6aab
Create Date: 2026-09-18 21:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8d9e0f1a2b3c'
down_revision: Union[str, Sequence[str], None] = '7c2f3c2a6aab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Companies fields
    op.add_column('companies', sa.Column('tagline', sa.String(length=255), nullable=True))
    op.add_column('companies', sa.Column('accreditation', sa.String(length=255), nullable=True))
    op.add_column('companies', sa.Column('category', sa.String(length=255), nullable=True))
    op.add_column('companies', sa.Column('founder_sponsor', sa.String(length=255), nullable=True))
    op.add_column('companies', sa.Column('founder_title', sa.String(length=100), nullable=True))
    op.add_column('companies', sa.Column('public_journey_stages', sa.JSON(), nullable=True))
    op.add_column('companies', sa.Column('brand_colors', sa.JSON(), nullable=True))
    op.add_column('companies', sa.Column('reference_challenge_areas', sa.JSON(), nullable=True))

    # 2. Projects fields
    op.add_column('projects', sa.Column('code', sa.String(length=100), nullable=True))
    op.add_column('projects', sa.Column('challenge_area', sa.String(length=100), nullable=True))
    op.add_column('projects', sa.Column('phase', sa.String(length=50), nullable=True))
    op.add_column('projects', sa.Column('cohort_date', sa.Date(), nullable=True))
    op.add_column('projects', sa.Column('challenge_statement', sa.Text(), nullable=True))
    op.add_column('projects', sa.Column('why_it_matters', sa.Text(), nullable=True))
    op.add_column('projects', sa.Column('questions_to_investigate', sa.JSON(), nullable=True))
    op.add_column('projects', sa.Column('project_boundaries', sa.JSON(), nullable=True))
    op.add_column('projects', sa.Column('north_star_metric', sa.Text(), nullable=True))
    op.add_column('projects', sa.Column('supporting_measures', sa.JSON(), nullable=True))
    op.add_column('projects', sa.Column('related_context_figures', sa.JSON(), nullable=True))
    op.add_column('projects', sa.Column('discover_timeline', sa.JSON(), nullable=True))
    op.create_index(op.f('ix_projects_code'), 'projects', ['code'], unique=False)

    # 3. Team Project Assignments fields
    op.add_column('team_project_assignments', sa.Column('gate_schedule', sa.JSON(), nullable=True))
    op.add_column('team_project_assignments', sa.Column('company_challenge_owner', sa.String(length=255), nullable=True))


def downgrade() -> None:
    # 3. Team Project Assignments fields
    op.drop_column('team_project_assignments', 'company_challenge_owner')
    op.drop_column('team_project_assignments', 'gate_schedule')

    # 2. Projects fields
    op.drop_index(op.f('ix_projects_code'), table_name='projects')
    op.drop_column('projects', 'discover_timeline')
    op.drop_column('projects', 'related_context_figures')
    op.drop_column('projects', 'supporting_measures')
    op.drop_column('projects', 'north_star_metric')
    op.drop_column('projects', 'project_boundaries')
    op.drop_column('projects', 'questions_to_investigate')
    op.drop_column('projects', 'why_it_matters')
    op.drop_column('projects', 'challenge_statement')
    op.drop_column('projects', 'cohort_date')
    op.drop_column('projects', 'phase')
    op.drop_column('projects', 'challenge_area')
    op.drop_column('projects', 'code')

    # 1. Companies fields
    op.drop_column('companies', 'reference_challenge_areas')
    op.drop_column('companies', 'brand_colors')
    op.drop_column('companies', 'public_journey_stages')
    op.drop_column('companies', 'founder_title')
    op.drop_column('companies', 'founder_sponsor')
    op.drop_column('companies', 'category')
    op.drop_column('companies', 'accreditation')
    op.drop_column('companies', 'tagline')
