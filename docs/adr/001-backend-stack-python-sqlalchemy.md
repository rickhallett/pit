# ADR-001: Backend Stack — Python/SQLAlchemy over TypeScript/Drizzle

**Status:** Accepted  
**Date:** 2026-02-06  
**Author:** Architect (documented), Kai (implemented)

## Context

The initial tech spec (`docs/the-pit-tech-spec-v1.md`) specified:
- **ORM:** Drizzle (explicitly "not Prisma")
- **Database:** Turso (SQLite at the edge)
- **Language:** TypeScript (full-stack consistency with Next.js frontend)

During implementation, the backend was built using:
- **ORM:** SQLAlchemy 2.0
- **Database:** PostgreSQL
- **Language:** Python/Flask

This divergence was discovered during sprint planning (2026-02-06) when schema work revealed two incompatible stacks in documentation vs. code.

## Decision

**Python/SQLAlchemy is canonical.** The spec is superseded by what was actually built.

Git history shows 5 commits from Kai directly implementing the Python backend. This was an intentional implementation choice, not accidental drift.

## Rationale

*(To be confirmed by Kai — placeholder reasoning:)*

- Faster prototyping velocity in Python for backend logic
- SQLAlchemy 2.0's mature async support and Alembic migrations
- PostgreSQL's JSONB for flexible schema evolution
- Personal familiarity / preference during rapid build phase

## Consequences

**Positive:**
- Working backend exists (~1500 LOC, 20+ files)
- Battle-tested ORM with excellent migration tooling
- PostgreSQL scales well for expected load

**Negative:**
- No shared types between frontend (TS) and backend (Python)
- Deployment topology differs from edge-first Turso approach
- Tech spec now out of sync (requires update)

**Mitigation:**
- Consider OpenAPI/tRPC for type-safe API contracts if frontend integration becomes painful
- Update tech spec to reflect reality
- Document this decision (this ADR)

## Related

- `docs/the-pit-tech-spec-v1.md` — original spec (now superseded for backend stack)
- `be/` — Python backend implementation
- `be/alembic/versions/` — migration history
