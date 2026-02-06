"""Core schema from canonical SQL

Revision ID: 001_core
Revises: 
Create Date: 2026-02-06

Source: db/migrations/001_core_schema.sql
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID


revision: str = "001_core"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Models table — Available LLMs
    op.create_table(
        "models",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("provider", sa.Text(), nullable=False),
        sa.Column("model_id", sa.Text(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("params_json", JSONB, server_default="{}"),
        sa.Column("active", sa.Boolean(), server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("provider", "model_id"),
    )

    # Presets table — Debate format definitions
    op.create_table(
        "presets",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("agent_count", sa.Integer(), nullable=False),
        sa.Column("config_json", JSONB, nullable=False),
        sa.Column("active", sa.Boolean(), server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # Bouts table — Individual debate instances
    op.create_table(
        "bouts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("preset_id", sa.Text(), sa.ForeignKey("presets.id"), nullable=False),
        sa.Column("topic", sa.Text(), nullable=True),
        sa.Column("status", sa.Text(), server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_bouts_status", "bouts", ["status"])
    op.create_index("idx_bouts_preset", "bouts", ["preset_id"])

    # Bout agents table — Junction table (models ↔ bouts)
    op.create_table(
        "bout_agents",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("bout_id", UUID(as_uuid=True), sa.ForeignKey("bouts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("model_id", UUID(as_uuid=True), sa.ForeignKey("models.id"), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("persona", sa.Text(), nullable=True),
        sa.Column("config_json", JSONB, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("bout_id", "position"),
    )
    op.create_index("idx_bout_agents_bout", "bout_agents", ["bout_id"])
    op.create_index("idx_bout_agents_model", "bout_agents", ["model_id"])


def downgrade() -> None:
    op.drop_index("idx_bout_agents_model", table_name="bout_agents")
    op.drop_index("idx_bout_agents_bout", table_name="bout_agents")
    op.drop_table("bout_agents")
    op.drop_index("idx_bouts_preset", table_name="bouts")
    op.drop_index("idx_bouts_status", table_name="bouts")
    op.drop_table("bouts")
    op.drop_table("presets")
    op.drop_table("models")
