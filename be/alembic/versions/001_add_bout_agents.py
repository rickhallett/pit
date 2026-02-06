"""Add bout_agents junction table for multi-agent battles

Revision ID: 001_bout_agents
Revises: 
Create Date: 2026-02-06

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "001_bout_agents"
down_revision: Union[str, None] = "000_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "bout_agents",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("bout_id", sa.String(10), sa.ForeignKey("bouts.id"), nullable=False),
        sa.Column("agent_id", sa.String(50), nullable=False),
        sa.Column("agent_name", sa.String(100), nullable=False),
        sa.Column("agent_role", sa.String(200), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("team", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_bout_agents_bout_id", "bout_agents", ["bout_id"])


def downgrade() -> None:
    op.drop_index("ix_bout_agents_bout_id", table_name="bout_agents")
    op.drop_table("bout_agents")
