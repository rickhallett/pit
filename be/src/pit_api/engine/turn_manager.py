"""TurnManager — handles round-robin turn order and conversation state."""

from dataclasses import dataclass, field
from typing import Iterator

from .agent_runner import AgentConfig


@dataclass
class TurnState:
    """Current state of a bout's turns."""

    agents: list[AgentConfig]
    current_index: int = 0
    turn_number: int = 0
    conversation: list[dict] = field(default_factory=list)
    consecutive_failures: int = 0

    MAX_CONSECUTIVE_FAILURES = 3


class TurnManager:
    """Manages turn order and conversation state for a bout."""

    def __init__(self, agents: list[AgentConfig]):
        """Initialize with the list of agents in the bout."""
        self.state = TurnState(agents=agents)

    @property
    def current_agent(self) -> AgentConfig:
        """Get the agent whose turn it is."""
        return self.state.agents[self.state.current_index]

    @property
    def turn_number(self) -> int:
        """Get the current turn number."""
        return self.state.turn_number

    @property
    def conversation(self) -> list[dict]:
        """Get the full conversation history."""
        return self.state.conversation

    def should_abort(self) -> bool:
        """Check if the bout should be aborted due to failures."""
        return self.state.consecutive_failures >= TurnState.MAX_CONSECUTIVE_FAILURES

    def advance_turn(self, content: str) -> None:
        """
        Record a successful turn and advance to next agent.

        Args:
            content: The message content from the current agent
        """
        # Add message to conversation (Anthropic format alternates user/assistant)
        # For multi-agent, we simulate by having each agent see others' messages as "user"
        self.state.conversation.append(
            {
                "role": "user" if self.state.turn_number % 2 == 0 else "assistant",
                "content": f"[{self.current_agent.name}]: {content}",
            }
        )

        # Reset failure counter
        self.state.consecutive_failures = 0

        # Advance
        self.state.turn_number += 1
        self.state.current_index = (self.state.current_index + 1) % len(self.state.agents)

    def record_failure(self) -> None:
        """Record a failed turn (API error, timeout, etc.)."""
        self.state.consecutive_failures += 1
        # Skip to next agent without recording message
        self.state.current_index = (self.state.current_index + 1) % len(self.state.agents)

    def turns(self, max_turns: int) -> Iterator[tuple[int, AgentConfig]]:
        """
        Generator that yields (turn_number, agent) for each turn.

        Stops after max_turns or if abort condition is met.
        """
        while self.state.turn_number < max_turns:
            if self.should_abort():
                break
            yield self.state.turn_number, self.current_agent
