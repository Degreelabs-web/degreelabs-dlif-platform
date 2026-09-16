"""add student centric materials

Revision ID: f9a0b1c2d3e4
Revises: b9c0d1e2f3a4
Create Date: 2026-09-15
"""

from alembic import op
import sqlalchemy as sa


revision = "f9a0b1c2d3e4"
down_revision = "b9c0d1e2f3a4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "materials",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("material_type", sa.String(length=30), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="draft"),
        sa.Column("visibility", sa.String(length=40), nullable=False, server_default="all_students"),
        sa.Column("external_url", sa.String(length=2048), nullable=True),
        sa.Column("thumbnail_path", sa.String(length=1024), nullable=True),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.UUID(), nullable=False),
        sa.Column("updated_by", sa.UUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    for column in ("status", "category", "material_type", "published_at"):
        op.create_index(f"ix_materials_{column}", "materials", [column])
    op.create_table(
        "material_assets",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("material_id", sa.UUID(), nullable=False),
        sa.Column("storage_path", sa.String(length=1024), nullable=False),
        sa.Column("original_filename", sa.String(length=512), nullable=True),
        sa.Column("mime_type", sa.String(length=255), nullable=True),
        sa.Column("size_bytes", sa.BigInteger(), nullable=True),
        sa.Column("checksum", sa.String(length=128), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("is_current", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("uploaded_by", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["material_id"], ["materials.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["uploaded_by"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("material_id", "version", name="uq_material_asset_version"),
    )
    op.create_index("ix_material_assets_material_id", "material_assets", ["material_id"])
    for table, target, name in (("material_cohorts", "cohorts", "cohort"), ("material_institutions", "institutions", "institution")):
        op.create_table(table, sa.Column("material_id", sa.UUID(), nullable=False), sa.Column(f"{name}_id", sa.UUID(), nullable=False), sa.ForeignKeyConstraint(["material_id"], ["materials.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint([f"{name}_id"], [f"{target}.id"], ondelete="CASCADE"), sa.PrimaryKeyConstraint("material_id", f"{name}_id"))
        op.create_index(f"ix_{table}_{name}_id", table, [f"{name}_id"])
    op.create_table("material_mentor_categories", sa.Column("material_id", sa.UUID(), nullable=False), sa.Column("mentor_category", sa.String(length=50), nullable=False), sa.ForeignKeyConstraint(["material_id"], ["materials.id"], ondelete="CASCADE"), sa.PrimaryKeyConstraint("material_id", "mentor_category"))
    op.create_table(
        "material_engagement",
        sa.Column("id", sa.UUID(), nullable=False), sa.Column("material_id", sa.UUID(), nullable=False), sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("first_viewed_at", sa.DateTime(timezone=True), nullable=True), sa.Column("last_viewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("view_count", sa.Integer(), nullable=False, server_default="0"), sa.Column("download_count", sa.Integer(), nullable=False, server_default="0"), sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["material_id"], ["materials.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"), sa.UniqueConstraint("material_id", "user_id", name="uq_material_engagement_user"),
    )
    op.create_index("ix_material_engagement_material_id", "material_engagement", ["material_id"])
    op.create_index("ix_material_engagement_user_id", "material_engagement", ["user_id"])


def downgrade() -> None:
    op.drop_table("material_engagement")
    op.drop_table("material_mentor_categories")
    op.drop_table("material_institutions")
    op.drop_table("material_cohorts")
    op.drop_table("material_assets")
    op.drop_table("materials")
