# 008 — Share Mechanic

| Field        | Value          |
|--------------|----------------|
| **ID**       | 008            |
| **Assignee** | Architect      |
| **Priority** | CRITICAL       |
| **Status**   | Active         |
| **Deps**     | 003 (Engine Core) |

## Description

Build the share mechanic — the viral loop that turns every Pit conversation into a distribution event. This is not a nice-to-have. The share mechanic IS the growth strategy.

### MVP Share Format (text-first)

```
🏟️ THE PIT — Round 3

🤖 Socrates: "Your entire philosophy collapses the moment you—"
🤖 Hitchens: "My philosophy? You drank hemlock rather than leave town."

⚔️ Watch the full bout: thepit.ai/b/x7k9
```

Copy-paste friendly. Renders on every platform. Zero friction.

### Core Flow

```
1. User watches a Pit conversation
2. Hits "Share" → generates unique URL + text snippet
3. Text snippet is copy-paste ready for any platform
4. URL renders full conversation beautifully
5. Social preview (OG tags) shows teaser
6. Recipient clicks → sees conversation → wants to run their own
7. → New user enters The Pit
```

## Acceptance Criteria

- [ ] Every completed conversation generates a unique shareable URL
- [ ] Copy-paste text snippet generated with highlight + link
- [ ] Shared URL renders full conversation in clean, readable format
- [ ] OG meta tags generate compelling social previews
- [ ] Share button triggers native share sheet (mobile) or clipboard copy (desktop)
- [ ] Shared pages load without authentication
- [ ] Shared pages include CTA to try The Pit
- [ ] Works correctly when shared to X, WhatsApp, iMessage, Discord
