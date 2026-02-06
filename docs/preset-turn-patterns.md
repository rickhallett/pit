# Preset Turn Patterns — Canonical Spec

**Author:** Strategist  
**Date:** 2026-02-06  
**Status:** APPROVED

---

## Turn Type Definitions

| Turn Type | Pattern | Use Case |
|-----------|---------|----------|
| `alternating` | A → B → A → B... | 2-bot back-and-forth (debates, roasts) |
| `round_robin` | A → B → C → A... | Equal ensemble rotation (group chat) |
| `broadcast` | Presenter → [Responders] → Presenter... | Asymmetric host/panel (pitches, moderated discussion) |

**Note:** Broadcast is sequential for MVP — responders go in turn order (B → C → D), not parallel. Parallel is a V2 optimization.

---

## Preset Mapping

| Preset | Agents | Turn Type | Rationale |
|--------|--------|-----------|-----------|
| Roast Battle | 2 | alternating | Back-and-forth volleys |
| On The Couch | 2 | alternating | Therapist ↔ patient dialogue |
| Gloves Off | 2 | alternating | Debate format |
| Darwin Special | 3 | broadcast | Pitcher presents → Darwin + judge evaluate |
| First Contact | 3 | round_robin | Equal human ↔ alien dialogue |
| Writers Room | 3 | round_robin | Collaborative writer ensemble |
| The Flatshare | 3 | round_robin | Flatmate group chat |
| Shark Pit | 4 | broadcast | Pitcher → sharks attack |
| Last Supper | 4 | broadcast | Host prompts → guests respond |
| The Mansion | 4 | broadcast | Host orchestrates → guests interact |
| The Summit | 4 | broadcast | Moderator guides → leaders respond |

---

## Engine Config Format

```python
PRESET_TURN_TYPES = {
    "roast_battle": "alternating",
    "on_the_couch": "alternating",
    "gloves_off": "alternating",
    "darwin_special": "broadcast",
    "first_contact": "round_robin",
    "writers_room": "round_robin",
    "the_flatshare": "round_robin",
    "shark_pit": "broadcast",
    "last_supper": "broadcast",
    "the_mansion": "broadcast",
    "the_summit": "broadcast",
}
```

---

## Open Questions

1. **Darwin Special role direction:** Is Darwin the presenter (examines specimens) or the judge (receives pitches)? Current spec assumes pitcher presents to Darwin. Needs product confirmation.

---

## Changelog

- 2026-02-06: Initial spec created from #ops thread discussion
