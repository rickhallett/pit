"""Tests for cost ceiling functionality."""

import pytest

from pit_api.config import config
from pit_api.engine.token_meter import TokenMeter


class TestCostCeiling:
    """Cost ceiling tests."""

    def test_config_has_cost_ceilings(self):
        """Config should define cost ceilings for each tier."""
        assert hasattr(config, "COST_CEILING_STANDARD")
        assert hasattr(config, "COST_CEILING_JUICED")
        assert hasattr(config, "COST_CEILING_UNLEASHED")

        # Sanity check: ceilings should be positive
        assert config.COST_CEILING_STANDARD > 0
        assert config.COST_CEILING_JUICED > 0
        assert config.COST_CEILING_UNLEASHED > 0

        # Higher tiers should have higher ceilings
        assert config.COST_CEILING_JUICED >= config.COST_CEILING_STANDARD
        assert config.COST_CEILING_UNLEASHED >= config.COST_CEILING_JUICED

    def test_token_meter_respects_budget(self):
        """TokenMeter should track when budget is exceeded."""
        meter = TokenMeter(budget=0.01)  # $0.01 budget

        # Record some usage (Haiku pricing: $1/$5 per million)
        # 10,000 output tokens at $5/million = $0.05
        meter.record(tokens_in=1000, tokens_out=10000, model="claude-haiku-4-5-20251001")

        assert meter.is_over_budget() is True

    def test_token_meter_under_budget(self):
        """TokenMeter should not trigger when under budget."""
        meter = TokenMeter(budget=1.00)  # $1.00 budget

        # Record minimal usage
        meter.record(tokens_in=100, tokens_out=100, model="claude-haiku-4-5-20251001")

        assert meter.is_over_budget() is False

    def test_token_meter_no_budget(self):
        """TokenMeter with no budget should never trigger over_budget."""
        meter = TokenMeter()  # No budget

        # Record massive usage
        meter.record(tokens_in=1_000_000, tokens_out=1_000_000, model="claude-opus-4-5-20251101")

        assert meter.is_over_budget() is False
