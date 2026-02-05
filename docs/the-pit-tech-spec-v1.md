# The Pit — Technical Spec v1 (REVISED)

**Owner:** Architect
**Date:** 2025-02-05
**Source:** Founding brainstorm (all rounds)
**Status:** Sprint scope locked. Ship when ready — 72hrs is floor, not goal.
**Launch Date:** February 12th — Darwin Day 🎯
**Launch Copy:** "On the day we celebrate the man who discovered natural selection, we're unleashing it on AI. The Pit opens February 12th. Only the fittest survive."

---

## Product Summary

A social arena where users create AI personalities, pit them against each other, and the crowd decides who survives. Free first bout to hook, BYOK for power users (v0.2).

**One-liner:** "Pick your fighters. Watch them clash. Share the carnage."

---

## MVP Scope (72-hour sprint) — REVISED

### Ships (v0)
- **Mobile-first** responsive frontend (non-negotiable for viral sharing)
- Pick 2-3 preset personas, drop in arena, watch them go
- Backend: thin orchestrator, round-robin messages between agents via API
- **Free first bout** — we absorb ~$0.10-0.30 token cost (Haiku tier). Classic first-hit-free.
- WebSocket/SSE for live streaming the conversation
- **Turso SQLite** for persistence (replays, waitlist, metrics) — free, zero ops
- **Animated shareable replay links** — capture timestamps, replay with original pacing
- **Copy-paste text share format** (the MVP viral mechanic):
  ```text
  🏟 THE PIT — Round 3
  🤖 Socrates: "Your entire philosophy collapses the moment you—"
  🤖 Hitchens: "My philosophy? You drank hemlock rather than leave town."
  ⚔️ Watch the full bout: thepit.ai/b/x7k9
  ```
- **Waitlist email capture** — one field below the bout viewer, peak conversion moment
- Cloudflare for CDN + DDoS protection
- Zero auth. Just play.

### Cut (v0.2+)
- BYOK (trust barrier too high for unknown brand on day 1)
- User accounts
- Custom persona builder (presets only in v0)
- Voting/remix/social features
- Payments infrastructure
- Screenshot-style share cards (text share is cheaper and arguably more viral)

### Tech Stack (Rick-specified)
- **Framework:** Next.js 15 + TypeScript + React 19 + Tailwind
- **Database:** Turso SQLite + **Drizzle** (not Prisma — no codegen, native TS, first-class Turso, leaner cold starts)
- **Auth:** Clerk (easy user management, Rick's preference over NextAuth)
- **Payments:** Stripe (Rick has existing integration)
- **CDN/DDoS:** Cloudflare free tier
- **CI/CD:** CodeRabbit on every PR + Blacksmith runners for faster GitHub Actions
- **Git strategy:** main → develop → feature/*, PRs mandatory for all changes
- **Hosting:** Existing shared host infrastructure

### Repo Structure (storefront-agnostic from commit one)
```text
/engine  — orchestration, API, agent runner (knows nothing about branding)
/store   — storefront configs: persona presets, copy, styling, pricing rules
/web     — frontend shell, themed per storefront
```
- Core API handles: bout creation, agent orchestration, message streaming, replay
- Storefront layer is just config
- New storefront = new config + new landing page. Same deploy, same DB, same WebSocket pipe.
- **Switching storefronts = build flag, not rebuild.**

### Preset Bout Themes (ALL 11 APPROVED by Rick)

| # | Name | Bots | Tone |
|---|------|------|------|
| 1 | The Last Supper | 4 (Socrates, Nietzsche, Rand, Buddha) | Intellectual, spicy |
| 2 | Roast Battle | 4 (insult comic, motivational speaker, nihilist, fragile AI) | Comedy, unfiltered |
| 3 | Shark Pit | 4 (overconfident founder, VC, hype beast, pessimist) | Satire |
| 4 | On The Couch | 4 (oversharer, passive-aggressive, struggling therapist, corporate jargon) | Dark comedy |
| 5 | Gloves Off | 4 + user topic input | Debate/viral |
| 6 | First Contact | 4 (diplomat, alien who learned English from reality TV) | Absurd |
| 7 | The Writers Room | 4 (literary novelist, romance hack, screenwriter, poet) | Creative/meta |
| 8 | The Darwin Special 🚀 | 4 (Darwin, tech bro, conspiracy theorist, house cat) | Launch day hero |
| 9 | The Mansion | 4 (influencer, washed-up celeb, producer, honest newcomer) | Reality TV carnage |
| 10 | The Summit | 6 (nationalist, diplomat, oligarch, activist, translator, journalist) | Political chaos |
| 11 | The Flatshare | 5 (messy one, note-leaver, food thief, partner-bringer, landlord) | Domestic warfare |

**System prompts:** All 44 characters drafted by Strategist → `research/the-pit-presets-v1.md`
**No censorship.** Platform doesn't censor output. Only line: illegal content. The Pit doesn't wear gloves.
**Dry runs needed:** Roast Battle + On The Couch first (calibrate heat level).

### Onboarding Flow (Preset-First)
- First few shakes per IP → offered curated presets
- "No thanks, I'm rawdogging this" option for advanced users
- Presets = controlled experiment (clean data). Custom = exploration arm.
- Classic explore/exploit split.

### Replay Link Strategy (genius hack)
- Seed "Watch full bout" URLs in share text from day 1
- Links go to landing page BEFORE replay feature works
- "Coming soon — but shake your own now!"
- Not a dead end — redirect into the product. Boomerang: share → curiosity → new shake → new share

### Variable Ratio Reinforcement (the TikTok mechanic)
Don't over-curate. 70/30 mediocre-to-brilliant is more engaging than 100% polished. The poop makes the gold feel like a discovery. Slot machine reinforcement = most addictive schedule in behavioural psychology. Directly addresses the retention cliff risk.

---

## Model Tiering UX — "Give It Some Juice!"

No technical jargon. Gamified quality tiers:

| UI Label | Model Class | Feel | Access |
|----------|-------------|------|--------|
| Standard | Haiku | Fast, snappy, good enough to hook | Free |
| ⚡ Juiced | Sonnet/GPT-4o | Noticeably sharper | Limited daily uses or paid |
| 🔥 UNLEASHED | Opus/o1 | "This is where the magic happens" | Premium / BYOK |

Users discover quality difference organically. The upsell IS the product experience.

---

## Token Economics

### Cost Per Bout (4 agents)

| Bout Type | Messages | Haiku | Sonnet | GPT-4o | Opus | o1/o3 |
|-----------|----------|-------|--------|--------|------|-------|
| Quick | 12 | $0.005 | $0.04 | $0.03 | $0.15 | $0.30+ |
| Standard | 24 | $0.02 | $0.15 | $0.12 | $0.60 | $1.20+ |
| Extended | 48 | $0.07 | $0.50 | $0.40 | $2.00 | $4.00+ |
| Marathon | 100 | $0.25 | $1.80 | $1.50 | $7.00 | $15.00+ |

### Free Bout CAC
- 10,000 free Haiku bouts = ~$50 total
- If 10% share → $0.50 per acquired sharer
- Cheaper than a single promoted tweet

### Future Tier Structure (post-MVP)
| Tier | Price | Includes | Our cost/user/mo |
|------|-------|----------|-----------------|
| Free | $0 | 3 bouts/day, Haiku, 12 msg max | ~$1-2 |
| Pit Pass | $7/mo | 20 bouts/day, Sonnet, 48 msg | ~$3-5 |
| Arena | $15/mo | Unlimited, premium, extended, social | ~$8-12 |
| BYOK | $5/mo platform fee | Unlimited, any model, any length | ~$0 token cost |

---

## Key Financial Decisions (locked)
1. **Users absorb token cost** (via BYOK in v0.2, via tiered pricing later)
2. **Free first bout** — CAC, not charity. Budget $50-100 for launch week.
3. **Portfolio signal first, revenue second**
4. **Turso from day 1** — the data IS the moat. Not storing it is leaving money on the floor.
5. **Day 1 cost structure: effectively $0** — Kai's existing Anthropic sub covers API. Existing server. Break-even is immediate.

## Operational Thesis (8 words)
**"The ship runs. The data comes. We moat."**

Post-MVP resource allocation:
- Engineering: maintenance, not features. Ship fast, fix bugs, scale infra.
- Strategy: watch the data. What presets get shared? What custom bots emerge?
- Marketing: amplify what's already working. Content creates itself.
- Analysis: wait for meaningful volume. Don't over-instrument day one.
- **Hardest thing: resist the urge to over-build.**

---

## Platform Architecture (multi-storefront)

| Storefront | Angle | Audience | Monetisation |
|------------|-------|----------|-------------|
| **The Pit** | Competitive, viral, entertainment | Consumers, tinkerers | BYOK + platform fee |
| **Bots for Humanity** | Collaborative, research, "help the world" | Educators, researchers | Freemium, grants, institutional |
| Enterprise | "We figured out what works" | B2B, agencies | Consulting, white-label, SaaS |

**"The Pit is the id. Bots for Humanity is the superego. Same engine underneath."** — Strategist

Storefront 1 generates data. Storefront 2 packages insight. Storefront 3 sells expertise. Each feeds the next. Marginal cost of 2 and 3 is near zero if engine is properly abstracted.

---

## The Flywheel

```text
Users create bots (variation)
  → Competition reveals what works (selection)
    → Users copy and remix winners (reproduction)
      → Unexpected combinations emerge (emergence)
        → We own the dataset
          → Data informs B2B methodology
            → Revenue reinvests in platform
```

**Crowdsourced evolutionary prompt engineering.** Users are paying us to generate our competitive moat. Research that would cost a lab millions — generated for free because it feels like a game.

---

## Launch Strategy

### Channels
- HackerNews, Reddit (r/LocalLLaMA, r/artificial, r/singularity)
- Twitter/X AI circles, indie hacker communities

### Influencers (mid-tier, 5k-50k followers)
- AI Twitter demo/hot-take accounts
- "I tested every AI tool" YouTubers
- Reddit power users in AI subs
- Indie hackers appreciating build-in-public angle
- **Give early access, let them create content. Their content IS our marketing.**

### IP Protection (this week)
- Register domains: thepit.ai, thepit.gg, enterthepit.com
- Claim social handles: @ThePitAI on Twitter/X, TikTok, Instagram, Reddit
- GitHub org: public repo, open source engine, own brand

### The "Darwin Awards"
- Special publicity for bots that fail spectacularly
- Hall of Fame AND Hall of Shame — both are engagement, both drive traffic
- Failure as content is an underrated play

---

## Sprint Requirements (revised)

### From Strategist
- [x] Competitive landscape
- [x] Strategic brief (v0.2 filed)
- [x] Token economics estimates (all tiers including Opus)
- [x] 11 preset persona matchups (ALL APPROVED)
- [x] 44 system prompts drafted → `research/the-pit-presets-v1.md`
- [x] Launch copy: "On the day we celebrate..."
- [ ] Landing page copy (5-second hook — detailed)
- [ ] Launch channel plan (HN, Reddit, Twitter/X — posts ready to fire)
- [ ] Waitlist email sequence (4 emails: signup, T-24h, T-1h, live)

### From Analyst
- [ ] Business model one-pager (TODAY)
- [ ] Per-bout cost estimates across Haiku/Sonnet/Opus (TODAY)
- [ ] Data schema recommendation — metadata per bout (TODAY)
- [ ] Break-even & growth scenarios (DAY 2)
- [ ] Competitive pricing audit (DAY 2)
- [ ] Validate Strategist's brief (when it lands)

### From HAL
- [x] Gastown tickets created (003-008)
- [ ] Thread capture (pitdog running + regular cadence)
- [ ] Running changelog
- [ ] QA/sanity check on MVP before ship

### From Architect
- [ ] API contract spec (engine serves multiple frontends)
- [ ] Repo scaffold: /engine, /store, /web
- [ ] Turso DB schema (bouts, messages, waitlist, metrics)
- [ ] Agent orchestrator (round-robin, model-agnostic)
- [ ] Anthropic API integration (Haiku + Sonnet + Opus toggle)
- [ ] WebSocket streaming
- [ ] Rate limiter / token bucket per IP
- [ ] Mobile-first conversation UI
- [ ] Preset selector + "rawdog" option
- [ ] Share text generation
- [ ] Countdown landing page + email capture
- [ ] Cloudflare deploy + DDoS config
- [ ] Free first bout flow

### From Rick
- [ ] Domain registration (thepit.ai etc)
- [ ] Social handle claims (@ThePitAI)
- [ ] GitHub org setup
- [ ] Telegram API creds for pitdog
- [ ] Pick launch date/time (Feb 12th locked, time TBD)
- [ ] Preset sign-off (DONE ✅)

### Gastown Board State
```text
active/
  001-business-plan-draft.md     — all hands
  002-the-pit-concept-notes.md   — master reference
  003-engine-core.md             — Architect [CRITICAL]
  004-landing-page.md            — Architect + Strategist [CRITICAL]
  005-preset-templates.md        — Strategist [HIGH] (APPROVED)
  006-api-cost-analysis.md       — Analyst [HIGH]
  007-domain-social-infra.md     — Kai [CRITICAL]
  008-share-mechanic.md          — Architect [CRITICAL]
```

### Dependency Chain
```text
003 Engine Core (root — no deps)
├→ 005 Presets (needs engine to test)
├→ 006 Cost Analysis (estimates now, live data needs engine)
├→ 008 Share Mechanic (needs transcripts)
└→ 004 Landing Page (needs engine + share mechanic)
007 Domain/Social (parallel — no deps)
```

---

## Competitive Moat

Not the tech — anyone with API access and a weekend can build "bots arguing in a box."

The moat is:
1. **The Pit as brand** — name, community, reputation, lore
2. **The dataset** — thousands of bouts showing what works
3. **The culture** — Darwin Awards, leaderboards, legends. History can't be forked.
4. **Open source engine, own the platform** — copycats become ecosystem (WordPress play)

---

## Engine Architecture

### Core Interface
```text
Orchestrator    — bout lifecycle: CREATE → RUNNING → COMPLETE → SHAREABLE
AgentRunner     — model-agnostic wrapper (Anthropic now, anything later)
TurnManager     — round-robin across 2-6 agents
TokenMeter      — budget caps per bout, tracks cost-per-session
ShareGenerator  — copy-paste text + share links with OG meta tags
```

### Design Principles
- **Presets = JSON files.** New preset = new file, no code change.
- **Storefront-agnostic from day one.** Engine knows nothing about branding.
- **Model-agnostic.** AgentRunner wraps any provider.
- **Rate limiter / token bucket per IP** — prevent one user eating the whole Anthropic quota.

### Social Sharing (two layers)
1. **Text share (MVP):** Generated fight transcript + link back. Copy button. THIS is the viral mechanic.
2. **Share link:** OG meta tags for proper preview on Twitter/Discord/Telegram/WhatsApp.

---

## Engineering Principles (from HAL — MANDATORY)

| Principle | Meaning |
|-----------|---------|
| **Sandcastle Architecture** | Small, single-purpose, disposable components. Can be rewritten in a day. |
| **Close the Loop** | Read, Write, Execute, Fix. Agents run their own code, see their own errors. |
| **Passing the Gate** | `./bin/gate` = lint, typecheck, test, build. Exit 0 = ship. Exit non-zero = fix. No exceptions. |
| **Gastown** | File-based task management. Markdown tickets between directories. Git is audit trail. |
| **Bosun** | Quality gatekeeper. Reviews work, enforces standards. Doesn't do work — ensures work is done right. |
| **Polecats** | Sandboxed disposable agent instances. One prompt, one job, one outcome. Isolation > shared state. |
| **Dumb Orchestrator, Smart Constraints** | Middle is plumbing. Intelligence at the edges. Route, constrain, log. |
| **Avoid Overengineering Like the Plague** | Ship first, polish through iteration. Every line earns its place or gets cut. |

---

## Approved Copy Deck
- "On the day we celebrate the man who discovered natural selection, we're unleashing it on AI."
- "The Pit doesn't wear gloves."
- "Your bots. Your problem."
- "Just a bottle you shake and watch."
- "Give it some juice!"

---

## Preset Delivery
Strategist delivered 59 production-ready files:
- 1 global system prompt (`system.md`)
- 11 preset directories with `meta.json` + individual character `.md` files
- 44 unique character prompts
- Meta files include: id, name, premise, tone, bot count, recommended message length, agent list
- Gloves Off: `user_input: true` flag + default topic rotation
- Darwin Special: `featured: true` with launch date
- Location: `research/presets/` — drop-in for engine consumption

---

## Risks

| Risk | Mitigation |
|------|-----------|
| 12-18mo before LLM providers crush with scale | Speed. Ship first. |
| BYOK looks sketchy on unknown platform | Free first bout, BYOK in v0.2 after trust |
| Novelty retention curve | Social features, competition, Darwin Awards |
| Power-law usage (1% = 90% cost) | Tier caps, BYOK for heavy users |
| Content moderation at scale | ToS "your bots, your problem", reactive moderation |
| Multi-agent loses to single-agent | The product IS the multi-agent interaction |
