"""fellowship workflow entities

Revision ID: a1b2c3d4e5f6
Revises: 84e8ea9f557c
Create Date: 2026-09-10 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '84e8ea9f557c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. mentors table
    op.create_table(
        'mentors',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('phone', sa.String(length=30), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('expertise', postgresql.ARRAY(sa.String(length=100)), nullable=False),
        sa.Column('years_of_experience', sa.Integer(), nullable=True),
        sa.Column('company_name', sa.String(length=255), nullable=True),
        sa.Column('designation', sa.String(length=255), nullable=True),
        sa.Column('linkedin_url', sa.String(length=2048), nullable=True),
        sa.Column('github_url', sa.String(length=2048), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='active', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_mentors_status'), 'mentors', ['status'], unique=False)
    op.create_index(op.f('ix_mentors_user_id'), 'mentors', ['user_id'], unique=True)

    # 2. companies table
    op.create_table(
        'companies',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('profile', sa.Text(), nullable=False),
        sa.Column('industry', sa.String(length=100), nullable=False),
        sa.Column('website', sa.String(length=2048), nullable=True),
        sa.Column('contact_email', sa.String(length=255), nullable=False),
        sa.Column('contact_name', sa.String(length=255), nullable=True),
        sa.Column('contact_phone', sa.String(length=30), nullable=True),
        sa.Column('logo_url', sa.String(length=2048), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='active', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug')
    )
    op.create_index(op.f('ix_companies_industry'), 'companies', ['industry'], unique=False)
    op.create_index(op.f('ix_companies_name'), 'companies', ['name'], unique=False)
    op.create_index(op.f('ix_companies_slug'), 'companies', ['slug'], unique=True)
    op.create_index(op.f('ix_companies_status'), 'companies', ['status'], unique=False)

    # 3. projects table
    op.create_table(
        'projects',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('objectives', sa.Text(), nullable=False),
        sa.Column('expected_deliverables', sa.Text(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='draft', nullable=False),
        sa.Column('difficulty', sa.String(length=50), server_default='intermediate', nullable=False),
        sa.Column('max_teams', sa.Integer(), server_default='5', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint('end_date IS NULL OR start_date IS NULL OR end_date >= start_date', name='ck_project_dates'),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_projects_company_id'), 'projects', ['company_id'], unique=False)
    op.create_index(op.f('ix_projects_status'), 'projects', ['status'], unique=False)

    # 4. team_mentor_assignments table
    op.create_table(
        'team_mentor_assignments',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('team_id', sa.UUID(), nullable=False),
        sa.Column('mentor_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='active', nullable=False),
        sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('unassigned_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['mentor_id'], ['mentors.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_team_mentor_assignments_mentor_id'), 'team_mentor_assignments', ['mentor_id'], unique=False)
    op.create_index(op.f('ix_team_mentor_assignments_team_id'), 'team_mentor_assignments', ['team_id'], unique=False)
    op.create_index(
        'uq_active_team_mentor',
        'team_mentor_assignments',
        ['team_id'],
        unique=True,
        postgresql_where=sa.text("status = 'active'")
    )

    # 5. team_project_assignments table
    op.create_table(
        'team_project_assignments',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('team_id', sa.UUID(), nullable=False),
        sa.Column('project_id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='active', nullable=False),
        sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_team_project_assignments_company_id'), 'team_project_assignments', ['company_id'], unique=False)
    op.create_index(op.f('ix_team_project_assignments_project_id'), 'team_project_assignments', ['project_id'], unique=False)
    op.create_index(op.f('ix_team_project_assignments_team_id'), 'team_project_assignments', ['team_id'], unique=False)
    op.create_index(
        'uq_active_team_project',
        'team_project_assignments',
        ['team_id'],
        unique=True,
        postgresql_where=sa.text("status = 'active'")
    )

    # 6. student_cohort_assignments table
    op.create_table(
        'student_cohort_assignments',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('student_id', sa.UUID(), nullable=False),
        sa.Column('cohort_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='active', nullable=False),
        sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['cohort_id'], ['cohorts.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['student_id'], ['student_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', 'cohort_id', name='uq_student_cohort_assignment')
    )
    op.create_index(op.f('ix_student_cohort_assignments_cohort_id'), 'student_cohort_assignments', ['cohort_id'], unique=False)
    op.create_index(op.f('ix_student_cohort_assignments_student_id'), 'student_cohort_assignments', ['student_id'], unique=False)

    # 7. Add single active team constraint on team_members
    op.create_index(
        'uq_student_single_active_team',
        'team_members',
        ['student_id'],
        unique=True,
        postgresql_where=sa.text("left_at IS NULL")
    )

    # 8. Data Backfill: sync existing enrollments into student_cohort_assignments
    op.execute("""
        INSERT INTO student_cohort_assignments (id, student_id, cohort_id, status, assigned_at)
        SELECT gen_random_uuid(), sp.id, e.cohort_id, e.enrollment_status, e.enrolled_at
        FROM enrollments e
        JOIN student_profiles sp ON sp.user_id = e.user_id
        ON CONFLICT (student_id, cohort_id) DO NOTHING;
    """)


def downgrade() -> None:
    op.drop_index('uq_student_single_active_team', table_name='team_members')
    op.drop_index(op.f('ix_student_cohort_assignments_student_id'), table_name='student_cohort_assignments')
    op.drop_index(op.f('ix_student_cohort_assignments_cohort_id'), table_name='student_cohort_assignments')
    op.drop_table('student_cohort_assignments')
    op.drop_index('uq_active_team_project', table_name='team_project_assignments')
    op.drop_index(op.f('ix_team_project_assignments_team_id'), table_name='team_project_assignments')
    op.drop_index(op.f('ix_team_project_assignments_project_id'), table_name='team_project_assignments')
    op.drop_index(op.f('ix_team_project_assignments_company_id'), table_name='team_project_assignments')
    op.drop_table('team_project_assignments')
    op.drop_index('uq_active_team_mentor', table_name='team_mentor_assignments')
    op.drop_index(op.f('ix_team_mentor_assignments_team_id'), table_name='team_mentor_assignments')
    op.drop_index(op.f('ix_team_mentor_assignments_mentor_id'), table_name='team_mentor_assignments')
    op.drop_table('team_mentor_assignments')
    op.drop_index(op.f('ix_projects_status'), table_name='projects')
    op.drop_index(op.f('ix_projects_company_id'), table_name='projects')
    op.drop_table('projects')
    op.drop_index(op.f('ix_companies_status'), table_name='companies')
    op.drop_index(op.f('ix_companies_slug'), table_name='companies')
    op.drop_index(op.f('ix_companies_name'), table_name='companies')
    op.drop_index(op.f('ix_companies_industry'), table_name='companies')
    op.drop_table('companies')
    op.drop_index(op.f('ix_mentors_user_id'), table_name='mentors')
    op.drop_index(op.f('ix_mentors_status'), table_name='mentors')
    op.drop_table('mentors')
