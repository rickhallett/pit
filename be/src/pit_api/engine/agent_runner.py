"""AgentRunner — wraps Anthropic API for model-agnostic agent execution."""

from dataclasses import dataclass
from typing import Iterator

import anthropic

from pit_api.config import config


@dataclass
class AgentConfig:
    """Configuration for an agent in a bout."""

    name: str
    role: str
    system_prompt: str


@dataclass
class RunResult:
    """Result of a single agent turn."""

    content: str
    tokens_in: int
    tokens_out: int
    model_used: str
    latency_ms: int | None = None


class AgentRunner:
    """Runs a single agent turn via Anthropic API."""

    def __init__(self, model: str | None = None):
        """Initialize with optional model override."""
        self.client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
        self.model = model or config.MODEL_STANDARD

    def run(
        self,
        agent: AgentConfig,
        conversation: list[dict],
        max_tokens: int = 500,
    ) -> RunResult:
        """
        Run a single turn for an agent.

        Args:
            agent: The agent configuration (name, role, system prompt)
            conversation: List of previous messages in Anthropic format
            max_tokens: Maximum tokens for the response

        Returns:
            RunResult with the response content and token usage
        """
        import time

        start_time = time.time()

        response = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=agent.system_prompt,
            messages=conversation,
        )

        latency_ms = int((time.time() - start_time) * 1000)

        content = response.content[0].text if response.content else ""

        return RunResult(
            content=content,
            tokens_in=response.usage.input_tokens,
            tokens_out=response.usage.output_tokens,
            model_used=self.model,
            latency_ms=latency_ms,
        )

    def run_streaming(
        self,
        agent: AgentConfig,
        conversation: list[dict],
        max_tokens: int = 500,
    ) -> Iterator[str]:
        """
        Run a single turn with streaming output.

        Yields tokens as they arrive for real-time display.
        Note: This uses the synchronous Anthropic client. For async streaming,
        use AsyncAnthropic client instead.
        """
        with self.client.messages.stream(
            model=self.model,
            max_tokens=max_tokens,
            system=agent.system_prompt,
            messages=conversation,
        ) as stream:
            for text in stream.text_stream:
                yield text
