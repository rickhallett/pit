"""ShareGenerator — creates shareable text and links for completed bouts."""

from dataclasses import dataclass

from pit_api.models import Bout, Message


@dataclass
class ShareContent:
    """Generated share content for a bout."""

    text: str
    permalink: str


class ShareGenerator:
    """Generates shareable content from completed bouts."""

    BASE_URL = "https://thepit.cloud"

    def __init__(self, base_url: str | None = None):
        """Initialize with optional base URL override."""
        self.base_url = base_url or self.BASE_URL

    def generate(self, bout: Bout, messages: list[Message]) -> ShareContent:
        """
        Generate share content for a completed bout.

        Args:
            bout: The completed bout record
            messages: All messages from the bout

        Returns:
            ShareContent with formatted text and permalink
        """
        if bout.status != "complete":
            raise ValueError(f"Cannot share incomplete bout: {bout.status}")

        # Find the best exchange (two consecutive messages)
        best_exchange = self._find_best_exchange(messages)

        # Format the share text
        text = self._format_share_text(bout, best_exchange)
        permalink = f"{self.base_url}/b/{bout.id}"

        return ShareContent(text=text, permalink=permalink)

    def _find_best_exchange(self, messages: list[Message]) -> tuple[Message, Message] | None:
        """
        Find the most interesting exchange to feature.

        Heuristic: Score by message length and presence of direct address.
        """
        if len(messages) < 2:
            return None

        best_score = 0
        best_pair = (messages[0], messages[1])

        for i in range(len(messages) - 1):
            m1, m2 = messages[i], messages[i + 1]
            score = self._score_exchange(m1, m2)
            if score > best_score:
                best_score = score
                best_pair = (m1, m2)

        return best_pair

    def _score_exchange(self, m1: Message, m2: Message) -> int:
        """Score an exchange based on engagement potential."""
        score = 0

        # Length bonus (>100 chars each)
        if len(m1.content) > 100:
            score += 10
        if len(m2.content) > 100:
            score += 10

        # Direct address bonus (mentions other agent's name)
        if m2.agent_name.lower() in m1.content.lower():
            score += 20
        if m1.agent_name.lower() in m2.content.lower():
            score += 20

        # Question mark bonus (engagement)
        if "?" in m1.content:
            score += 5
        if "?" in m2.content:
            score += 5

        # Exclamation bonus (energy)
        if "!" in m1.content:
            score += 3
        if "!" in m2.content:
            score += 3

        return score

    def _format_share_text(self, bout: Bout, exchange: tuple[Message, Message] | None) -> str:
        """Format the share text."""
        if not exchange:
            return f"🏟 THE PIT\n⚔️ Watch the bout: {self.base_url}/b/{bout.id}"

        m1, m2 = exchange

        # Truncate long messages
        q1 = self._truncate(m1.content, 100)
        q2 = self._truncate(m2.content, 100)

        return (
            f"🏟 THE PIT — Round {m1.turn_number + 1}\n"
            f'🤖 {m1.agent_name}: "{q1}"\n'
            f'🤖 {m2.agent_name}: "{q2}"\n'
            f"⚔️ Watch the full bout: {self.base_url}/b/{bout.id}"
        )

    def _truncate(self, text: str, max_len: int) -> str:
        """Truncate text with ellipsis if needed."""
        text = text.replace("\n", " ").strip()
        if len(text) <= max_len:
            return text
        return text[: max_len - 3].rsplit(" ", 1)[0] + "..."
