"""Orchestrator — bout lifecycle management."""

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Callable

from sqlalchemy.orm import Session

from pit_api.config import config
from pit_api.models import Bout, BoutAgent, Message

from .agent_runner import AgentConfig, AgentRunner
from .token_meter import TokenMeter
from .turn_manager import TurnManager


@dataclass
class BoutConfig:
    """Configuration for a new bout."""

    preset_id: str | None
    agents: list[AgentConfig]
    model_tier: str = "standard"
    topic: str | None = None
    ip_hash: str | None = None


@dataclass
class OrchestratorEvents:
    """Event callbacks for the orchestrator."""

    on_turn_start: Callable[[str, str, int], None] | None = None  # bout_id, agent_name, turn
    # TODO: on_token is unused until streaming is implemented via AgentRunner.run_streaming()
    on_token: Callable[[str, str], None] | None = None  # bout_id, token
    on_turn_end: Callable[[str, str, int, str], None] | None = None  # bout_id, agent, turn, msg_id
    on_bout_complete: Callable[[str, float], None] | None = None  # bout_id, total_cost
    on_error: Callable[[str, str], None] | None = None  # bout_id, error_message


class Orchestrator:
    """
    Manages the full lifecycle of a bout.

    Coordinates AgentRunner, TurnManager, and TokenMeter to run a complete
    multi-agent conversation and persist results to the database.
    """

    def __init__(self, db: Session, events: OrchestratorEvents | None = None):
        """Initialize with database session and optional event callbacks."""
        self.db = db
        self.events = events or OrchestratorEvents()

    def _get_model_for_tier(self, tier: str) -> str:
        """Map tier name to model string."""
        return {
            "standard": config.MODEL_STANDARD,
            "juiced": config.MODEL_JUICED,
            "unleashed": config.MODEL_UNLEASHED,
        }.get(tier, config.MODEL_STANDARD)

    def _get_turns_for_tier(self, tier: str) -> int:
        """Map tier name to turn count."""
        return {
            "standard": config.TURNS_STANDARD,
            "juiced": config.TURNS_JUICED,
            "unleashed": config.TURNS_UNLEASHED,
        }.get(tier, config.TURNS_STANDARD)

    def _get_cost_ceiling_for_tier(self, tier: str) -> float:
        """Map tier name to cost ceiling in dollars."""
        return {
            "standard": config.COST_CEILING_STANDARD,
            "juiced": config.COST_CEILING_JUICED,
            "unleashed": config.COST_CEILING_UNLEASHED,
        }.get(tier, config.COST_CEILING_STANDARD)

    def create(self, bout_config: BoutConfig) -> Bout:
        """Create a new bout in pending state with agent records."""
        bout = Bout(
            preset_id=bout_config.preset_id,
            status="pending",
            model_tier=bout_config.model_tier,
            topic=bout_config.topic,
            agent_count=len(bout_config.agents),
            ip_hash=bout_config.ip_hash,
        )
        self.db.add(bout)
        self.db.flush()  # Get bout.id before creating agents

        # Create BoutAgent records for each agent
        for position, agent in enumerate(bout_config.agents, start=1):
            bout_agent = BoutAgent(
                bout_id=bout.id,
                agent_id=agent.id or agent.name.lower().replace(" ", "-"),
                agent_name=agent.name,
                agent_role=agent.role,
                position=position,
                team=agent.team,
            )
            self.db.add(bout_agent)

        self.db.commit()
        self.db.refresh(bout)
        return bout

    def get_agents(self, bout_id: str) -> list[AgentConfig]:
        """Load agents for a bout from the database."""
        bout_agents = (
            self.db.query(BoutAgent)
            .filter(BoutAgent.bout_id == bout_id)
            .order_by(BoutAgent.position)
            .all()
        )
        # Note: system_prompt must be loaded from preset store separately
        return [
            AgentConfig(
                id=ba.agent_id,
                name=ba.agent_name,
                role=ba.agent_role or "",
                system_prompt="",  # Loaded by caller from preset store
                team=ba.team,
            )
            for ba in bout_agents
        ]

    def run(self, bout: Bout, agents: list[AgentConfig]) -> Bout:
        """
        Run a bout to completion.

        Args:
            bout: The bout record (must be in pending state)
            agents: List of agent configurations

        Returns:
            The updated bout record
        """
        if bout.status != "pending":
            raise ValueError(f"Bout {bout.id} is not in pending state: {bout.status}")

        # Update status
        bout.status = "running"
        self.db.commit()

        try:
            # Initialize components (inside try so failures mark bout as error)
            model = self._get_model_for_tier(bout.model_tier)
            max_turns = self._get_turns_for_tier(bout.model_tier)
            cost_ceiling = self._get_cost_ceiling_for_tier(bout.model_tier)

            runner = AgentRunner(model=model)
            turn_manager = TurnManager(agents)
            meter = TokenMeter(budget=cost_ceiling)
            for turn_num, agent in turn_manager.turns(max_turns):
                # Emit turn start event
                if self.events.on_turn_start:
                    self.events.on_turn_start(bout.id, agent.name, turn_num)

                try:
                    # Run the agent
                    result = runner.run(
                        agent=agent,
                        conversation=turn_manager.conversation,
                        max_tokens=config.MAX_TOKENS_PER_TURN,
                    )

                    # Record token usage
                    meter.record(result.tokens_in, result.tokens_out, result.model_used)

                    # Save message to database
                    message = Message(
                        bout_id=bout.id,
                        agent_name=agent.name,
                        agent_role=agent.role,
                        turn_number=turn_num,
                        content=result.content,
                        tokens_in=result.tokens_in,
                        tokens_out=result.tokens_out,
                        model_used=result.model_used,
                        latency_ms=result.latency_ms,
                    )
                    self.db.add(message)
                    self.db.commit()

                    # Advance turn
                    turn_manager.advance_turn(result.content)

                    # Emit turn end event
                    if self.events.on_turn_end:
                        self.events.on_turn_end(bout.id, agent.name, turn_num, message.id)

                    # Check budget — end gracefully if ceiling hit
                    if meter.is_over_budget():
                        if self.events.on_error:
                            self.events.on_error(
                                bout.id,
                                f"Cost ceiling reached (${cost_ceiling:.2f}). "
                                f"Bout completed early at turn {turn_num}."
                            )
                        break

                except Exception as e:
                    turn_manager.record_failure()
                    if self.events.on_error:
                        self.events.on_error(bout.id, str(e))

                    if turn_manager.should_abort():
                        bout.status = "error"
                        break

            # Complete the bout
            if bout.status == "running":
                bout.status = "complete"

            bout.total_turns = turn_manager.turn_number
            bout.token_cost = meter.total_cost
            bout.completed_at = datetime.now(timezone.utc)
            self.db.commit()

            # Emit completion event
            if self.events.on_bout_complete:
                self.events.on_bout_complete(bout.id, meter.total_cost)

        except Exception as e:
            bout.status = "error"
            bout.completed_at = datetime.now(timezone.utc)
            self.db.commit()
            if self.events.on_error:
                self.events.on_error(bout.id, str(e))
            raise

        return bout
