# Gastown — Task Management Conventions

**Gastown** is the file-based task management system for The Pit. No Jira, no Trello — just markdown tickets in directories.

## Philosophy

Every task is a markdown file. Every status is a directory. Move the file, change the status. It's that simple.

## Directory Structure

```
gastown/
├── README.md          ← You are here
├── backlog/           ← Ideas, future work, not yet prioritised
├── active/            ← Currently being worked on
├── review/            ← Done but awaiting review/sign-off
├── done/              ← Completed and accepted
└── docs/              ← Principles, conventions, reference material
```

## Ticket Format

Every ticket is a markdown file named `NNN-slug.md`:

```markdown
# Title

| Field        | Value              |
|--------------|--------------------|
| **ID**       | NNN                |
| **Assignee** | Role or name       |
| **Priority** | CRITICAL / HIGH / MEDIUM / LOW |
| **Status**   | backlog / active / review / done |
| **Deps**     | Ticket IDs or none |

## Description

What needs doing and why.

## Acceptance Criteria

- [ ] Concrete, verifiable outcomes
```

## Workflow

1. **Create** a ticket in `backlog/`
2. **Move** to `active/` when work begins
3. **Move** to `review/` when implementation is complete
4. **Move** to `done/` when accepted

## Conventions

- **IDs are sequential**: `001`, `002`, `003`...
- **Slugs are kebab-case**: `003-engine-core.md`
- **One ticket, one concern**: Split compound work into separate tickets
- **Dependencies are explicit**: Reference by ticket ID
- **Priority drives order**: CRITICAL before HIGH before MEDIUM before LOW
- **Parallel work is marked**: Some tickets can run alongside others without blocking

## Roles

| Role          | Description                              |
|---------------|------------------------------------------|
| **HAL**       | Operations, coordination, quality gate   |
| **Architect** | Technical design and implementation      |
| **Strategist**| Content, positioning, creative direction |
| **Analyst**   | Research, cost modelling, data           |
| **Kai**       | Sovereign — final decisions, external ops|
