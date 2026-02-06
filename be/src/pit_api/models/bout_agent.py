"""BoutAgent model — junction table for N agents per bout."""

from sqlalchemy import Column, ForeignKey, Integer, String

from .base import Base


class BoutAgent(Base):
    """Maps agents to bouts with position and optional team."""

    __tablename__ = "bout_agents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    bout_id = Column(String(10), ForeignKey("bouts.id"), nullable=False, index=True)

    # Agent identity
    agent_id = Column(String(50), nullable=False)  # e.g., "darwin", "tech-bro"
    agent_name = Column(String(100), nullable=False)  # display name
    agent_role = Column(String(200), nullable=True)  # stance/description

    # Position and team for battle patterns
    position = Column(Integer, nullable=False)  # turn order: 1, 2, 3...
    team = Column(Integer, nullable=True)  # null for FFA, 1/2 for team battles

    def to_dict(self) -> dict:
        """Convert to dictionary for API responses."""
        return {
            "agent_id": self.agent_id,
            "agent_name": self.agent_name,
            "agent_role": self.agent_role,
            "position": self.position,
            "team": self.team,
        }
