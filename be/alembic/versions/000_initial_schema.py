"""Initial schema with bouts table

Revision ID: 000_initial
Revises: 
Create Date: 2026-02-06

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = "000_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Bouts table
    op.create_table(
        "bouts",
        sa.Column("id", sa.String(10), primary_key=True),
        sa.Column("preset_id", sa.String(50), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("model_tier", sa.String(20), nullable=False, server_default="standard"),
        sa.Column("topic", sa.Text(), nullable=True),
        sa.Column("agent_count", sa.Integer(), nullable=False, server_default="4"),
        sa.Column("total_turns", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("token_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ip_hash", sa.String(64), nullable=True),
        sa.Column("extra", JSONB, nullable=True),
    )
    op.create_index("ix_bouts_ip_hash_created_at", "bouts", ["ip_hash", "created_at"])

    # Messages table
    op.create_table(
        "messages",
        sa.Column("id", sa.String(12), primary_key=True),
        sa.Column("bout_id", sa.String(10), sa.ForeignKey("bouts.id"), nullable=False, index=True),
        sa.Column("agent_name", sa.String(100), nullable=False),
        sa.Column("agent_role", sa.String(200), nullable=True),
        sa.Column("turn_number", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("tokens_in", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("tokens_out", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("model_used", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("latency_ms", sa.Integer(), nullable=True),
    )

    # Metrics table
    op.create_table(
        "metrics",
        sa.Column("id", sa.String(12), primary_key=True),
        sa.Column("event", sa.String(50), nullable=False, index=True),
        sa.Column("bout_id", sa.String(10), nullable=True, index=True),
        sa.Column("payload", JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), index=True),
        sa.Column("ip_hash", sa.String(64), nullable=True),
    )

    # Waitlist table
    op.create_table(
        "waitlist",
        sa.Column("id", sa.String(8), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False, unique=True),
        sa.Column("source", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("ip_hash", sa.String(64), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("waitlist")
    op.drop_table("metrics")
    op.drop_table("messages")
    op.drop_index("ix_bouts_ip_hash_created_at", table_name="bouts")
    op.drop_table("bouts")
