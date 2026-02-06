"""TokenMeter — tracks token usage and costs per bout."""

from dataclasses import dataclass

from pit_api.config import config

# Pricing per million tokens (input/output)
MODEL_PRICING = {
    config.MODEL_STANDARD: (1.00, 5.00),  # Haiku 4.5
    config.MODEL_JUICED: (3.00, 15.00),  # Sonnet 4.5
    config.MODEL_UNLEASHED: (5.00, 25.00),  # Opus 4.5
}


@dataclass
class UsageRecord:
    """Record of token usage for a single turn."""

    tokens_in: int
    tokens_out: int
    model: str


class TokenMeter:
    """Tracks cumulative token usage and cost for a bout."""

    def __init__(self, budget: float | None = None):
        """
        Initialize the meter.

        Args:
            budget: Optional maximum cost in dollars. None = unlimited.
        """
        self.budget = budget
        self.records: list[UsageRecord] = []

    @property
    def total_tokens_in(self) -> int:
        """Total input tokens across all turns."""
        return sum(r.tokens_in for r in self.records)

    @property
    def total_tokens_out(self) -> int:
        """Total output tokens across all turns."""
        return sum(r.tokens_out for r in self.records)

    @property
    def total_cost(self) -> float:
        """Total cost in dollars."""
        cost = 0.0
        for record in self.records:
            pricing = MODEL_PRICING.get(record.model, (1.00, 5.00))
            cost += (record.tokens_in / 1_000_000) * pricing[0]
            cost += (record.tokens_out / 1_000_000) * pricing[1]
        return cost

    def record(self, tokens_in: int, tokens_out: int, model: str) -> None:
        """Record usage from a turn."""
        self.records.append(UsageRecord(tokens_in, tokens_out, model))

    def is_over_budget(self) -> bool:
        """Check if we've exceeded the budget."""
        if self.budget is None:
            return False
        return self.total_cost >= self.budget

    def remaining_budget(self) -> float | None:
        """Get remaining budget, or None if unlimited."""
        if self.budget is None:
            return None
        return max(0, self.budget - self.total_cost)
