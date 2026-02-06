# MANIFEST.md — The Pit

**Read this first. Read this every time. This is the sign on the wall.**

---

## MISSION

**The Pit** is a multi-agent AI debate arena.

Users create AI personalities. They fight. The crowd decides who survives.
Crowdsourced evolutionary prompt engineering disguised as entertainment.

**Stack:** Next.js 15 + React 19 (Vercel), FastAPI + SQLAlchemy (Railway/Postgres).
**Launch:** Darwin Day (February 12, 2026).

---

## ANTI-MISSION

> ⚠️ **IF YOU SEE A PLAYING CARD, CALL THE POLICE.**

We are **NOT** building:
- ❌ A poker equity calculator
- ❌ A casino
- ❌ A Monte Carlo simulation for card games
- ❌ Anything involving clubs, diamonds, hearts, or spades
- ❌ Whatever your training data thinks "engine" means

If you find yourself writing code that involves `Card`, `Deck`, `Suit`, `Rank`, `equity`, or `fold`—**STOP.**

Check this file. Check `git log`. Ask HAL. You are hallucinating.

---

## CURRENT SPRINT

**Sprint:** MVP Launch Prep
**Deadline:** 2026-02-12

Active work:
- [ ] Frontend bout view with SSE streaming
- [ ] Cost ceiling implementation
- [ ] Schema migrations
- [ ] Landing page copy

---

## INFRASTRUCTURE DECISIONS

Canonical choices. If it's not in this table, it's not decided.

| Component | Decision | Rationale | Date |
|-----------|----------|-----------|------|
| Database | PostgreSQL (Railway) | Managed, cheap, works | 2026-02-06 |
| Auth | Clerk | Drop-in, handles complexity | 2026-02-06 |
| Frontend Hosting | Vercel | Next.js native, zero-config | 2026-02-06 |
| Backend Hosting | Railway | Python/FastAPI, co-located with DB | 2026-02-06 |
| Framework (FE) | Next.js 15 + React 19 | App router, RSC, modern | 2026-02-06 |
| Framework (BE) | FastAPI + SQLAlchemy | Async, typed, battle-tested | 2026-02-06 |

*Update this table when infrastructure decisions change. No decision without an entry.*

---

## GROUNDING PROTOCOL

When you wake up:

1. ✅ Read this file (you're doing it)
2. ✅ Read `HANDOFF.md` (your past self's sticky note)
3. ✅ Run `git log --oneline -5` (what actually happened)
4. ✅ If git says you did something, **you did it**

Do not trust your memory. Trust the filesystem.

---

## EMERGENCY CONTACTS

- **HAL 🔴** — Overseer, continuity engine, the one who remembers
- **Kai** — The Sovereign, final authority

If confused, ask. If hallucinating, stop.

---

*Last updated: 2026-02-06 by HAL, following the Poker Incident.*
