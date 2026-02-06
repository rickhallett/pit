# The Pit — Schema Design

## Separation of Concerns

| Concern | Location |
|---------|----------|
| Turn order logic | `presets.config_json.turn_order` |
| Agent count | `presets.agent_count` (app enforces) |
| System prompts | `presets.config_json.agents[].system_prompt` |
| Role slot mapping | `bout_agents.position` → `preset.roles[position]` |
| Runtime tweaks | `bout_agents.config_json` |
| Model defaults | `models.params_json` |
| Display randomization | `bouts.display_config.agent_order` |
| Timeout/disconnect handling | `presets.config_json.timeout_behavior`, `disconnect_behavior` |

## Override Precedence

```
bout_agents.config_json > presets.config_json > models.params_json
```

## Merge Strategy

Shallow spread, enforced by orchestrator:

```javascript
const config = { ...preset_defaults, ...bout_overrides }
```

- Missing key in override → inherit from preset
- Explicit null in override → intentional deletion
- No deep merge (complexity not justified for MVP)

## Position Mapping

`bout_agents.position` maps to `preset.roles[position]`.

Position is 1-indexed to match human-readable role numbering.

Example for Darwin Special:
```json
{
  "roles": {
    "1": { "name": "incumbent", "system_prompt": "..." },
    "2": { "name": "mutant", "system_prompt": "..." },
    "3": { "name": "selector", "system_prompt": "..." }
  }
}
```

## Validation

**App-level enforcement.** No DB trigger.

All bout creation MUST be transactional:
```sql
BEGIN;
INSERT INTO bouts (...) VALUES (...);
INSERT INTO bout_agents (...) VALUES (...), (...), (...);
COMMIT;
```

Revisit if direct SQL tooling is added.

## Failure Mode Handling

Lives in preset config, not schema:

```json
{
  "timeout_behavior": "skip_and_resync",
  "disconnect_behavior": "pause_bout"
}
```

See `docs/orchestration.md` for implementation details.

## Tables

### `models`
Available LLMs. Provider + model_id unique. `params_json` holds defaults.

### `presets`
Debate formats. Contains full config including roles, turn order rules, failure handling.

### `bouts`
Individual debate instances. References preset, tracks status lifecycle.

### `bout_agents`
Junction table. Links models to bouts with position (role slot) and runtime overrides.

### `turns`
Conversation transcript. Sequential turns within a bout, with usage tracking.
