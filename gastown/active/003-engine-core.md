# 003 — Engine Core

| Field        | Value          |
|--------------|----------------|
| **ID**       | 003            |
| **Assignee** | Architect      |
| **Priority** | CRITICAL       |
| **Status**   | Active         |
| **Deps**     | None           |

## Description

Build the core conversation engine — the runtime that orchestrates multi-bot conversations. This is the heart of The Pit: it takes a preset configuration (bot personalities, scenario prompt, constraints) and runs a multi-turn conversation between N bots.

The engine must be:
- **Provider-agnostic**: Support multiple LLM backends (OpenAI, Anthropic, etc.)
- **BYOK-ready**: Accept user-supplied API keys from day one
- **Dumb orchestrator, smart constraints**: The orchestrator is a simple turn manager. Intelligence lives in the system prompts and constraints, not in complex routing logic.
- **Sandcastle architecture**: Built to be torn down and rebuilt. No premature abstractions.

### Core Loop

```
1. Load preset config (bots, scenario, constraints)
2. Generate opening prompt / scenario seed
3. For each turn:
   a. Select next speaker (round-robin or weighted)
   b. Build context (conversation history + bot personality + constraints)
   c. Call LLM API with bot's system prompt
   d. Append response to conversation
   e. Check termination conditions (max turns, natural ending)
4. Return complete conversation
```

## Acceptance Criteria

- [ ] Engine accepts a preset config and produces a multi-bot conversation
- [ ] Supports configurable number of bots (4-6)
- [ ] Supports configurable turn count
- [ ] Provider-agnostic: works with at least OpenAI and Anthropic APIs
- [ ] BYOK: accepts user-provided API keys
- [ ] Each bot maintains distinct personality throughout conversation
- [ ] Output is structured JSON (speaker, message, metadata per turn)
- [ ] Handles API errors gracefully (rate limits, timeouts, key issues)
- [ ] Conversation feels natural — bots reference and respond to each other
- [ ] Runs locally for development/testing
