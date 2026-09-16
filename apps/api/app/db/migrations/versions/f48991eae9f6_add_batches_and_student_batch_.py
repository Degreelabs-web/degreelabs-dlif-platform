"""add batches and student batch assignments

Revision ID: f48991eae9f6
Revises: 3d4e5f6a7b8c
Create Date: 2026-09-16 15:06:34.256604

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f48991eae9f6'
down_revision: Union[str, Sequence[str], None] = '3d4e5f6a7b8c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('batches',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('cohort_id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=50), nullable=False),
    sa.Column('status', sa.String(length=50), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['cohort_id'], ['cohorts.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('cohort_id', 'name', name='uq_batch_cohort_name')
    )
    op.create_index(op.f('ix_batches_cohort_id'), 'batches', ['cohort_id'], unique=False)
    op.create_table('student_batch_assignments',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('student_id', sa.UUID(), nullable=False),
    sa.Column('batch_id', sa.UUID(), nullable=False),
    sa.Column('status', sa.String(length=50), nullable=False),
    sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['batch_id'], ['batches.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['student_id'], ['student_profiles.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('student_id', 'batch_id', name='uq_student_batch_assignment')
    )
    op.create_index(op.f('ix_student_batch_assignments_batch_id'), 'student_batch_assignments', ['batch_id'], unique=False)
    op.create_index(op.f('ix_student_batch_assignments_student_id'), 'student_batch_assignments', ['student_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_student_batch_assignments_student_id'), table_name='student_batch_assignments')
    op.drop_index(op.f('ix_student_batch_assignments_batch_id'), table_name='student_batch_assignments')
    op.drop_table('student_batch_assignments')
    op.drop_index(op.f('ix_batches_cohort_id'), table_name='batches')
    op.drop_table('batches')
