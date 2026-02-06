# The Pit — Share Snippet Templates

## Design Principles
- Renders clean across Discord, WhatsApp, Twitter/X, iMessage, Slack, Telegram
- No platform-specific formatting (no Discord embeds, no Slack blocks)
- Plain text that looks intentional
- Hook → Context → Link
- Under 280 chars for Twitter compatibility

---

## Default Share Template

🥊 THE PIT

{bot_a} vs {bot_b}
"{best_line_excerpt}..."

{bout_url}

Example:

🥊 THE PIT

Darwin vs Marx
"Natural selection doesn't care about your dialectic..."

thepit.ai/bout/x7k2m

---

## Preset-Specific Templates

### Roast Battle
🔥 ROAST BATTLE

{comic_a} vs {comic_b}
"{best_burn}..."

{bout_url}

### Darwin Special
🧬 DARWIN SPECIAL

{thesis_1} vs {thesis_2}
Only the fittest survives.

{bout_url}

### On The Couch
🛋️ ON THE COUCH

{patient} in therapy.
It did not go well.

{bout_url}

### Shark Pit
🦈 SHARK PIT

{pitcher} pitches {idea}.
{outcome}: {deal_or_pass}

{bout_url}

### Gloves Off
🥊 GLOVES OFF

{topic}
No moderation. No mercy.

{bout_url}

### Last Supper
🍷 LAST SUPPER

{guest_list_short}
One betrayal. No dessert.

{bout_url}

### First Contact
👽 FIRST CONTACT

Humanity meets something... else.
Understanding not guaranteed.

{bout_url}

### Writers Room
✍️ WRITERS ROOM

Breaking story for {show_premise}.
Egos included.

{bout_url}

### The Mansion
🌹 THE MANSION

{lead} looking for love.
{villain} looking for followers.

{bout_url}

### The Summit
🌍 THE SUMMIT

{crisis}
{leader_count} leaders. 0 solutions.

{bout_url}

### The Flatshare
🏠 THE FLATSHARE

{housemate_count} housemates.
1 thermostat.
0 clean dishes.

{bout_url}

---

## Highlight Quote Template (for mid-bout shares)

"{exact_quote}"

— {bot_name}, The Pit

{bout_url}

---

## Post-Bout Summary Share

{preset_emoji} {preset_name} COMPLETE

Winner: {winner} ({vote_percent}%)
Rounds: {message_count}

Best moment: "{highlight_quote}..."

{bout_url}

---

## Platform Rendering Notes

| Platform | Handling |
|----------|----------|
| Twitter/X | Under 280 chars. Link unfurls if OG tags set. |
| Discord | Plain text. No embed. Emoji renders. |
| WhatsApp | Emoji renders. Line breaks preserved. |
| iMessage | Clean render. Emoji native. |
| Slack | Plain text. Emoji shortcodes convert. |
| Telegram | Full render. Link preview if enabled. |

---

## Implementation Notes for Architect

- `best_line_excerpt` / `best_burn` / `highlight_quote`: Auto-select from highest-engagement message or allow user to pick
- Truncate quotes to 60 chars + "..." for Twitter safety
- All URLs should be short: `thepit.ai/bout/{id}` (6-char alphanumeric ID)
- Emoji at start improves click-through in notification previews
- "THE PIT" in caps is brand consistency
