"""002_add_cascades_and_indexes

Add cascade deletes, composite PK on bout_agent, and missing indexes.

Pre-flight checks (run against live DB before applying):

    -- Get actual constraint names:
    SELECT conname, conrelid::regclass, confrelid::regclass 
    FROM pg_constraint 
    WHERE contype = 'f' AND conrelid IN ('bout_agents'::regclass, 'messages'::regclass);

    -- Check for duplicate bout_agent pairs:
    SELECT bout_id, agent_id, COUNT(*) 
    FROM bout_agents 
    GROUP BY bout_id, agent_id 
    HAVING COUNT(*) > 1;

Revision ID: 002
Revises: 001_add_bout_agents
Create Date: 2026-02-06
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '002_add_cascades_and_indexes'
down_revision = '001_add_bout_agents'
branch_labels = None
depends_on = None


def upgrade():
    # --- bout_agent: Convert to composite PK ---
    # Drop existing PK and id column, create composite
    op.drop_constraint('bout_agents_pkey', 'bout_agents', type_='primary')
    op.drop_column('bout_agents', 'id')
    op.create_primary_key('bout_agents_pkey', 'bout_agents', ['bout_id', 'agent_id'])
    
    # --- Foreign keys with CASCADE ---
    # Drop existing FKs (adjust names if auto-generated differently)
    # Check with: SELECT conname FROM pg_constraint WHERE conrelid = 'bout_agents'::regclass;
    op.drop_constraint('bout_agents_bout_id_fkey', 'bout_agents', type_='foreignkey')
    op.drop_constraint('messages_bout_id_fkey', 'messages', type_='foreignkey')
    
    # Recreate with CASCADE
    op.create_foreign_key(
        'fk_bout_agent_bout', 'bout_agents', 'bouts',
        ['bout_id'], ['id'], ondelete='CASCADE'
    )
    op.create_foreign_key(
        'fk_message_bout', 'messages', 'bouts',
        ['bout_id'], ['id'], ondelete='CASCADE'
    )
    
    # --- Indexes ---
    op.create_index('ix_message_bout_turn', 'messages', ['bout_id', 'turn_number'])
    # bout_agent no longer needs separate index — bout_id is now part of PK


def downgrade():
    # Reverse: restore auto-increment PK, drop cascades
    op.drop_index('ix_message_bout_turn', 'messages')
    
    op.drop_constraint('fk_message_bout', 'messages', type_='foreignkey')
    op.drop_constraint('fk_bout_agent_bout', 'bout_agents', type_='foreignkey')
    
    # Restore original FKs (no cascade)
    op.create_foreign_key('messages_bout_id_fkey', 'messages', 'bouts', ['bout_id'], ['id'])
    op.create_foreign_key('bout_agents_bout_id_fkey', 'bout_agents', 'bouts', ['bout_id'], ['id'])
    
    # Restore auto-increment id
    op.drop_constraint('bout_agents_pkey', 'bout_agents', type_='primary')
    op.add_column('bout_agents', sa.Column('id', sa.Integer(), autoincrement=True))
    op.create_primary_key('bout_agents_pkey', 'bout_agents', ['id'])
