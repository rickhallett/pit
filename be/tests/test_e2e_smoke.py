"""End-to-end smoke tests for the bout flow.

These tests verify API behavior. Database-dependent tests require
PostgreSQL via Docker. Run: `docker compose up -d` before testing.
"""

import json
import os
from unittest.mock import MagicMock, patch

import pytest

from pit_api.app import create_app
from pit_api.engine.agent_runner import RunResult


@pytest.fixture
def app():
    """Create test application."""
    app = create_app()
    app.config["TESTING"] = True
    return app


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


def db_available():
    """Check if database is available."""
    try:
        from pit_api.models.base import SessionLocal
        session = SessionLocal()
        session.execute("SELECT 1")
        session.close()
        return True
    except Exception:
        return False


requires_db = pytest.mark.skipif(
    not db_available(),
    reason="PostgreSQL not available (run: docker compose up -d)"
)


class MockAgentRunner:
    """Mock AgentRunner that returns predictable responses."""

    def __init__(self, model: str = "test-model"):
        self.model = model
        self.call_count = 0

    def run(self, agent, conversation, max_tokens=500):
        """Return a mock response."""
        self.call_count += 1
        return RunResult(
            content=f"Mock response from {agent.name} (turn {self.call_count}): "
            f"I am {agent.role}. This is a test response.",
            tokens_in=100,
            tokens_out=50,
            model_used=self.model,
            latency_ms=50,
        )


class TestAPIEndpoints:
    """Tests for API endpoints that don't require database."""

    def test_health_endpoint(self, client):
        """Health check should return 200."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "healthy"

    def test_presets_endpoint(self, client):
        """Presets endpoint should return available debate formats."""
        response = client.get("/api/presets")
        assert response.status_code == 200
        data = response.get_json()
        assert "presets" in data
        assert len(data["presets"]) > 0
        
        # Check first preset has required fields
        preset = data["presets"][0]
        assert "id" in preset
        assert "name" in preset
        assert "agents" in preset

    def test_presets_have_valid_structure(self, client):
        """Each preset should have proper agent configuration."""
        response = client.get("/api/presets")
        data = response.get_json()
        
        for preset in data["presets"]:
            # Each preset must have at least 2 agents for a debate
            assert len(preset["agents"]) >= 2, f"Preset {preset['id']} needs 2+ agents"
            
            # List view shows name and avatar (role is in detail view)
            for agent in preset["agents"]:
                assert "name" in agent, f"Agent in {preset['id']} missing name"
                assert "avatar" in agent, f"Agent in {preset['id']} missing avatar"

    def test_preset_detail_has_full_agent_info(self, client):
        """Individual preset endpoint should return full agent details."""
        # First get list to find a preset ID
        response = client.get("/api/presets")
        data = response.get_json()
        assert len(data["presets"]) > 0
        
        preset_id = data["presets"][0]["id"]
        
        # Now get the detail
        response = client.get(f"/api/presets/{preset_id}")
        assert response.status_code == 200
        
        preset = response.get_json()
        assert "agents" in preset
        
        for agent in preset["agents"]:
            assert "name" in agent
            assert "role" in agent
            assert "id" in agent


class TestBoutValidation:
    """Tests for bout creation validation (no DB writes)."""

    def test_create_bout_requires_preset(self, client):
        """Creating a bout without preset_id should fail."""
        response = client.post(
            "/api/bout",
            json={},
            content_type="application/json",
        )
        assert response.status_code == 400
        data = response.get_json()
        assert "preset_id is required" in data["error"]

    def test_create_bout_rejects_invalid_preset(self, client):
        """Creating a bout with invalid preset should fail."""
        response = client.post(
            "/api/bout",
            json={"preset_id": "nonexistent-preset-12345"},
            content_type="application/json",
        )
        assert response.status_code == 400
        data = response.get_json()
        assert "Unknown preset" in data["error"]


@requires_db
class TestBoutFlow:
    """Database-dependent tests for bout creation and streaming."""

    def test_create_bout_success(self, client):
        """Creating a bout with valid preset should succeed."""
        with patch("pit_api.routes.bout.check_rate_limit", return_value=True):
            response = client.post(
                "/api/bout",
                json={"preset_id": "classic-duel"},
                content_type="application/json",
            )
            assert response.status_code == 201
            data = response.get_json()
            assert "bout_id" in data
            assert data["status"] == "pending"
            assert "stream_url" in data
            assert "agents" in data
            assert len(data["agents"]) == 2

    def test_rate_limiting(self, client):
        """Rate limiting should return 429."""
        with patch("pit_api.routes.bout.check_rate_limit", return_value=False):
            response = client.post(
                "/api/bout",
                json={"preset_id": "classic-duel"},
                content_type="application/json",
            )
            assert response.status_code == 429
            data = response.get_json()
            assert "Rate limit exceeded" in data["error"]

    def test_full_bout_flow(self, client):
        """Test the complete flow: create bout -> stream -> complete."""
        mock_runner = MockAgentRunner()
        
        with patch("pit_api.routes.bout.check_rate_limit", return_value=True):
            with patch("pit_api.engine.orchestrator.AgentRunner", return_value=mock_runner):
                # 1. Create bout
                response = client.post(
                    "/api/bout",
                    json={"preset_id": "classic-duel", "topic": "Test topic"},
                    content_type="application/json",
                )
                assert response.status_code == 201
                data = response.get_json()
                bout_id = data["bout_id"]
                stream_url = data["stream_url"]

                # 2. Connect to stream and consume events
                response = client.get(stream_url)
                assert response.status_code == 200
                assert response.content_type == "text/event-stream"

                # Parse SSE events from response data
                events = []
                event_type = None
                for line in response.data.decode().split("\n"):
                    if line.startswith("event:"):
                        event_type = line.replace("event:", "").strip()
                    elif line.startswith("data:") and event_type:
                        event_data = json.loads(line.replace("data:", "").strip())
                        events.append({"type": event_type, "data": event_data})

                # 3. Verify event sequence
                event_types = [e["type"] for e in events]

                # Should have turn_start/turn_end pairs and a bout_complete
                assert "turn_start" in event_types
                assert "turn_end" in event_types
                assert "bout_complete" in event_types

                # bout_complete should be last
                assert events[-1]["type"] == "bout_complete"

                # 4. Verify bout is complete
                response = client.get(f"/api/bout/{bout_id}")
                assert response.status_code == 200
                data = response.get_json()
                assert data["status"] == "complete"
                assert "messages" in data
                assert len(data["messages"]) > 0

                # 5. Verify mock was called (agents ran)
                assert mock_runner.call_count > 0
