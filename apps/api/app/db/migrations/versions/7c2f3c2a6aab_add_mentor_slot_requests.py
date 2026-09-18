"""add_mentor_slot_requests

Revision ID: 7c2f3c2a6aab
Revises: 8c9d0e1f2a3b
Create Date: 2026-09-18 11:10:47.340370

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7c2f3c2a6aab'
down_revision: Union[str, Sequence[str], None] = '8c9d0e1f2a3b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Create mentor_slot_requests table
    op.create_table(
        'mentor_slot_requests',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('team_id', sa.UUID(), nullable=False),
        sa.Column('requested_by_user_id', sa.UUID(), nullable=False),
        sa.Column('preferred_date', sa.Date(), nullable=False),
        sa.Column('preferred_time_start', sa.Time(), nullable=False),
        sa.Column('preferred_time_end', sa.Time(), nullable=False),
        sa.Column('topic', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='pending'),
        sa.Column('assigned_mentor_id', sa.UUID(), nullable=True),
        sa.Column('confirmed_start_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('confirmed_end_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('meet_link', sa.String(length=1024), nullable=True),
        sa.Column('google_event_id', sa.String(length=255), nullable=True),
        sa.Column('admin_note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('responded_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['assigned_mentor_id'], ['mentors.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['requested_by_user_id'], ['users.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_mentor_slot_requests_assigned_mentor_id'), 'mentor_slot_requests', ['assigned_mentor_id'], unique=False)
    op.create_index(op.f('ix_mentor_slot_requests_requested_by_user_id'), 'mentor_slot_requests', ['requested_by_user_id'], unique=False)
    op.create_index(op.f('ix_mentor_slot_requests_status'), 'mentor_slot_requests', ['status'], unique=False)
    op.create_index(op.f('ix_mentor_slot_requests_team_id'), 'mentor_slot_requests', ['team_id'], unique=False)

    # 2. Add is_team_lead column to team_members
    op.add_column('team_members', sa.Column('is_team_lead', sa.Boolean(), nullable=False, server_default=sa.text('false')))

    # 3. Seed is_team_lead = True for existing lead roles
    op.execute(
        sa.text("UPDATE team_members SET is_team_lead = true WHERE lower(role) IN ('fellow lead', 'lead', 'team_lead')")
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('team_members', 'is_team_lead')
    op.drop_index(op.f('ix_mentor_slot_requests_team_id'), table_name='mentor_slot_requests')
    op.drop_index(op.f('ix_mentor_slot_requests_status'), table_name='mentor_slot_requests')
    op.drop_index(op.f('ix_mentor_slot_requests_requested_by_user_id'), table_name='mentor_slot_requests')
    op.drop_index(op.f('ix_mentor_slot_requests_assigned_mentor_id'), table_name='mentor_slot_requests')
    op.drop_table('mentor_slot_requests')
