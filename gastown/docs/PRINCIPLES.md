# Engineering Principles

These are the principles that govern how we build The Pit. They're not aspirational — they're operational. If you're making a design decision and it conflicts with these, the principles win.

---

## Sandcastle Architecture

**Build to be torn down.** Small, independent modules. Clear interfaces. No sunk-cost thinking — if it's wrong, delete it and start over. First drafts are learning exercises, not production code.

## Close the Loop

**Every action produces a visible result.** No silent failures. No fire-and-forget. Every API call has error handling. Every user action has a visible response. If something breaks, the user knows what and why.

## Passing the Gate

**Work moves through defined stages with clear criteria.** Nothing ships without review. Nothing moves from active/ to done/ without meeting acceptance criteria. The gate is the quality bar — respect it. `./bin/gate`: lint, typecheck, test, build. Exit 0 = ship.

## Gastown

**File-based task management. No tools, no overhead.** Tasks are markdown files. Status is a directory. Move the file to change the status. Everything is visible, grep-able, version-controllable, and requires zero infrastructure.

## Bosun

**One person steers at a time.** The Bosun is whoever is driving a particular piece of work. They make the tactical decisions within scope. Escalate to Kai for scope changes, not for implementation details. Trust the person doing the work.

## Polecats

**Autonomous agents that do one job well.** A Polecat gets a clear brief, does its thing, and reports back. Focused, sandboxed, disposable. If something's out of scope, flag it and move on.

## Dumb Orchestrator, Smart Constraints

**Keep the orchestration logic simple. Put the intelligence in the prompts and constraints.** The engine is a dumb loop: pick a speaker, build context, call API, append result, repeat. All intelligence lives in system prompts and constraint configs, not in code logic. Adding a new preset = writing new prompts, not new code.

## Avoid Overengineering

**Don't build what you don't need yet.** Every feature has a cost. If you're building "because we might need it later," stop. Ship the simplest version, then iterate based on real usage. YAGNI is a principle, not a suggestion.
