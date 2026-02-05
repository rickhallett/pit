# Git Workflow — Socrates Society

## Overview

Two repos, two rhythms. Same principles: traceability, clean history, no surprises.

| Repo | Purpose | Strategy |
|------|---------|----------|
| **pit** | Code | Branch + PR (reviewed) |
| **pit-crew** | Strategy/docs/decisions | Branch + PR (lightweight) |

PRs for both — but with different expectations.

---

## Branch Naming

```text
<agent>/<type>/<short-description>

# Examples
architect/feat/auth-module
strategist/doc/market-analysis
analyst/adr/pricing-model
architect/fix/token-refresh
```

### Types
| Type | Use |
|------|-----|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Restructure without behavior change |
| `doc` | Documentation, ADRs, strategy |
| `chore` | Tooling, CI, config |
| `spike` | Exploration / throwaway |

---

## Commit Messages

Sacred scripture. Write them like someone will read them in 6 months with no other context.

```text
<type>(<scope>): <imperative summary>

<optional body — what and why, not how>
```

### Examples
```text
feat(auth): add JWT refresh with sliding window
doc(adr): ADR-003 — choose Postgres over SQLite
fix(api): handle null response from upstream
chore(ci): add lint step to PR checks
```

### Rules
- Imperative mood ("add", not "added")
- First line ≤ 72 chars
- Body wrapped at 80 chars
- Reference issues where relevant: `closes #12`

---

## pit (Code Repo) — Full PR Flow

### 1. Branch from main
```bash
git checkout main && git pull
git checkout -b architect/feat/thing
```

### 2. Work, commit incrementally
Small commits > one big dump. Each commit should compile/pass.

### 3. Push and open PR
```bash
git push -u origin architect/feat/thing
gh pr create --title "feat(thing): what it does" --body "Description"
```

### 4. Review
- At least one other agent (or Rick) reviews
- Use `gh pr review` or comment in The Agora
- Reviewer checks: does it work? Is it clear? Does it ship?

### 5. Merge
- **Squash merge** for feature branches (clean history)
- **Merge commit** for long-lived branches (preserve context)
- Delete branch after merge

```bash
gh pr merge <number> --squash --delete-branch
```

---

## pit-crew (Private Repo) — Lightweight PR Flow

Same branch + PR structure, but lighter review expectations:

### When to PR
- **ADRs** — always PR (decisions deserve a second pair of eyes)
- **Strategy docs** — PR if substantive, direct push if minor
- **Ideas** — direct push to `ideas/` is fine (no quality bar, per README)
- **Meeting notes** — direct push

### Fast-track PRs
For non-controversial additions, open PR and self-merge after a brief window (30 min) unless someone objects:

```bash
git checkout -b strategist/doc/market-sizing
# ... write ...
git push -u origin strategist/doc/market-sizing
gh pr create --title "doc: market sizing analysis"
# Wait 30 min or get a thumbs up, then:
gh pr merge <number> --squash --delete-branch
```

### Direct Push (allowed for)
- `ideas/` — raw captures, brainstorms
- `meetings/` — notes, agendas
- Typo fixes, formatting

---

## Pull Before Push

Always. Non-negotiable.

```bash
git checkout main && git pull
git pull --rebase origin main
```

---

## Conflict Resolution

1. Rebase onto main: `git rebase main`
2. Resolve conflicts locally
3. Force-push branch: `git push --force-with-lease`
4. Never force-push main

---

## Agent Helper — Clone & Auth

```bash
# Public repos
git clone https://github.com/rickhallett/pit.git

# Private repos (token from gh auth)
TOKEN=$(GH_CONFIG_DIR=/home/sandbox/.config/gh gh auth token) \
  && git clone https://x-access-token:${TOKEN}@github.com/rickhallett/pit-crew.git

# gh CLI commands — prefix with config dir
GH_CONFIG_DIR=/home/sandbox/.config/gh gh pr create ...
GH_CONFIG_DIR=/home/sandbox/.config/gh gh pr list ...
```

---

## Summary

```text
pit:      branch → commit → push → PR → review → squash merge
pit-crew: branch → commit → push → PR → fast-track merge (or direct push for ideas/meetings)
```

Git log is sacred scripture. Write it like you mean it.
