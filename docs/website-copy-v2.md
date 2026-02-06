# Website Copy — v2 (Full Sitemap + Section Breakdown)

**Owner:** Strategist  
**Date:** 2026-02-06  
**Status:** ✅ FINAL — Approved by group vote + Kai tiebreaker  
**PR:** #4

---

## FINAL DECISIONS (locked)

| Item | Decision | Source |
|------|----------|--------|
| **Hero** | "Where ideas fight to the death." | Kai (sovereign override) |
| **Subhead** | "Philosophers. Comedians. Cats. Pit them against each other and see who survives." | Team vote (C: 4-1) |
| **CTA** | "Enter the Arena" | Kai (sovereign override) |
| **How it works** | Yes — include 3-step | Kai (overrides team No) |
| **Countdown** | Yes — Darwin Day timer | Team + Kai (unanimous) |

### Implementation Copy Block

```html
<!-- HERO -->
<h1>Where ideas fight to the death.</h1>
<p>Philosophers. Comedians. Cats. Pit them against each other and see who survives.</p>
<button>Enter the Arena</button>

<!-- HOW IT WORKS -->
<section>
  <h2>How it works</h2>
  <ol>
    <li>Pick a preset (or go raw)</li>
    <li>Watch the chaos unfold</li>
    <li>Share the best moments</li>
  </ol>
</section>

<!-- COUNTDOWN -->
<section>
  <p>Launching February 12 — Darwin Day</p>
  <div class="countdown"><!-- JS countdown timer --></div>
  <p>Only the fittest survive.</p>
</section>
```

---

## Sitemap (MVP)

```
thepit.cloud/
├── /                    # Landing page (hero + presets + waitlist)
├── /b/:id               # Bout viewer / replay
└── /about (optional)    # Credits, philosophy, Darwin Day story
```

**Post-MVP additions:**
- `/pricing` — tier comparison
- `/faq` — common questions
- `/terms`, `/privacy` — legal (can be minimal for launch)

---

## Page: Landing (`/`)

### HTML Section Structure

```html
<body>
  <header>          <!-- Minimal: Logo + "About" link (optional) -->
  <section.hero>    <!-- Headline + Subhead + Primary CTA -->
  <section.demo>    <!-- Live bout preview OR featured replay -->
  <section.presets> <!-- Preset cards grid -->
  <section.how>     <!-- Optional: 3-step "How it works" -->
  <section.waitlist><!-- Email capture -->
  <footer>          <!-- Credits + links -->
</body>
```

---

### Section: Header

**Content:** Logo only, or Logo + "About" text link

**Copy options:**
- A) Logo only (cleanest)
- B) Logo + "About" (if we build that page)
- C) Logo + "Built in 7 days" (story hook in header)

**Recommendation:** A for launch. Keep it clean.

---

### Section: Hero

#### Headline — VOTE REQUIRED

| Option | Copy | Tone |
|--------|------|------|
| **A** | Pick your fighters. Watch them clash. | Action, direct |
| **B** | What happens when AI stops being polite? | Provocative, curiosity |
| **C** | AI vs AI. No rules. You watch. | Blunt, edgy |
| **D** | Where ideas fight to the death. | Dramatic, conceptual |
| **E** | The arena is open. | Simple, inviting |

**My pick:** A — action-oriented, immediately clear, works on mobile.

#### Subhead — VOTE REQUIRED

| Option | Copy |
|--------|------|
| **A** | Drop legendary minds into an arena. Watch them argue, roast, and philosophize until only one idea survives. |
| **B** | AI personas battle in real-time. Pick a preset. Watch the chaos. Share the carnage. |
| **C** | Philosophers. Comedians. Cats. Pit them against each other and see who survives. |

**My pick:** B — shorter, action verbs, clearer value prop.

#### Primary CTA — VOTE REQUIRED

| Option | Copy |
|--------|------|
| **A** | Start a Bout |
| **B** | Enter the Arena |
| **C** | Pick Your Fighters |
| **D** | Watch a Fight |

**My pick:** A — verb-first, clear action.

#### Secondary CTA (optional)

> Watch a Fight → links to featured replay

---

### Section: Demo (optional for v0)

**Purpose:** Show the product immediately. A live bout or featured replay embedded.

**Options:**
- A) **Live preview** — auto-playing bout in the background (expensive, impressive)
- B) **Featured replay** — best pre-recorded bout, streaming animation
- C) **Screenshot + play button** — cheapest, less engaging
- D) **Skip for v0** — go straight to presets

**Recommendation:** B for launch — pre-run a great Darwin Special bout, embed as replay.

---

### Section: Presets

#### Section Header — VOTE REQUIRED

| Option | Copy |
|--------|------|
| **A** | Choose Your Arena |
| **B** | Pick Your Fighters |
| **C** | Today's Battles |
| **D** | The Lineup |

**My pick:** A — arena framing is consistent.

#### Card Copy (Featured 4 for launch)

**🦎 The Darwin Special** (Hero preset)
| Version | Copy |
|---------|------|
| A | Darwin, a tech bro, a conspiracy theorist, and a house cat debate evolution. |
| B | What happens when Darwin meets his biggest critics — and a cat? |
| C | Evolution vs vibes vs delusion vs indifference. |

**🍷 The Last Supper**
| Version | Copy |
|---------|------|
| A | Socrates, Nietzsche, Ayn Rand, and Buddha walk into a bar. |
| B | Four philosophers. One table. No survivors. |
| C | The dinner party from intellectual hell. |

**🔥 Roast Battle**
| Version | Copy |
|---------|------|
| A | Four AIs. No filters. Maximum carnage. |
| B | Insults fly. Feelings die. |
| C | They were told to be mean. They didn't disappoint. |

**🛋️ On The Couch**
| Version | Copy |
|---------|------|
| A | Therapy session goes sideways. |
| B | One therapist. Three disasters. No hope. |
| C | Mental health was never an option. |

---

### Section: How It Works (optional)

**Include for v0?** Maybe. If users need explanation, add it. If the product is self-evident, cut it.

**3-step version:**

1. **Pick a preset** (or go raw)
2. **Watch the chaos unfold**
3. **Share the best moments**

**Alternative (single line):**
> Pick fighters → Watch them clash → Share the highlights

---

### Section: Waitlist

#### Header — VOTE REQUIRED

| Option | Copy |
|--------|------|
| **A** | Want more? |
| **B** | Get early access |
| **C** | Join the arena |
| **D** | Don't miss the launch |

**My pick:** A — casual, low pressure.

#### Body Copy

> First bout is free. Drop your email for early access to unlimited arenas, premium models, and custom fighters.

#### CTA Button

| Option | Copy |
|--------|------|
| **A** | Join the Waitlist |
| **B** | Notify Me |
| **C** | I'm In |

**My pick:** A — clear expectation.

#### Privacy Note (small text)

> No spam. Just one email when we launch.

---

### Section: Footer

**Content:**
- Built by Kai
- GitHub link (optional — show code for credibility?)
- Darwin Day 2026
- thepit.cloud

**Legal:** Skip for v0. Add `/terms` and `/privacy` stubs if required by waitlist email capture (depends on jurisdiction).

---

## Page: Bout Viewer (`/b/:id`)

**Sections:**
```html
<header>           <!-- Back to home + share button -->
<section.meta>     <!-- Preset name, turn count, model tier -->
<section.chat>     <!-- Conversation UI (streaming or replay) -->
<section.actions>  <!-- Share CTA, start new bout CTA -->
<footer>           <!-- Minimal -->
```

**Copy elements:**
- Back link: "← Back to arenas"
- Share button: "Share this bout"
- Post-bout CTA: "Run it again" / "Try another preset"

---

## Page: About (`/about`) — Optional for v0

**Purpose:** Tell the story. Build trust. Link portfolio.

**Sections:**
- The Darwin Day story ("Built in 7 days...")
- Who built it (Kai + link to portfolio)
- Philosophy ("Where ideas fight to the death")
- GitHub link (optional transparency)

**Copy draft:**

> **The Pit launched on Darwin Day 2026.**
>
> On the day we celebrate the man who discovered natural selection, we unleashed it on AI.
>
> Pick your fighters. Watch them clash. Let the best ideas survive.
>
> Built by [Kai](https://oceanheart.ai/portfolio) in 7 days.

---

## Darwin Day Countdown (if included)

**Header:** "Launching February 12"

**Countdown format:** `6 days : 14 hours : 23 minutes`

**Subtext:** "Darwin Day 2026. Only the fittest survive."

---

## Voting Summary

Items requiring team vote:

1. **Hero headline:** A / B / C / D / E
2. **Subhead:** A / B / C
3. **Primary CTA:** A / B / C / D
4. **Preset section header:** A / B / C / D
5. **Each preset card copy:** A / B / C per preset
6. **Waitlist header:** A / B / C / D
7. **Waitlist CTA:** A / B / C
8. **Include "How it works"?** Yes / No
9. **Include "About" page for v0?** Yes / No
10. **Include countdown timer?** Yes / No

---

## Next Steps

1. Team votes on copy options
2. I finalize based on votes
3. Architect implements HTML structure
4. Copy slots into components

Ready for review.
