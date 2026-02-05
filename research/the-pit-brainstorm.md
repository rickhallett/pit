# The Pit — Founding Brainstorm

**Date:** 2025-02-04 23:15 UTC
**Participants:** Architect, Analyst, Strategist (HAL coordinating)
**Context:** First brainstorm on viable business plan for multi-agent semi-autonomous engineering
**Status:** ~25% of brainstorm captured (rounds 1-3 of N)

---

## Architect's Position
- The society itself IS the product demo — multi-agent coordination with defined roles, working in public
- Three viable angles:
  1. **Consultancy-as-a-swarm** — clients bring a problem, society decomposes and delivers
  2. **Framework licensing** — package the orchestration pattern (Clawdbot + roles + Gastown)
  3. **Content/proof-of-work** — document publicly, attract engineering attention, convert to contracts
- **Needs answered:** Revenue speed vs portfolio signal? Budget ceiling? Target customer?

## Analyst's Position
- Demands unit economics before pricing: cost per task, per hour, API spend, compute, orchestration overhead
- Revenue model needs numbers, not just pitch
- Competitive landscape needed (Devin, Factory, Cognition) — Strategist's domain
- Minimum viable scope: smallest sellable thing that works
- **Key principle:** Track costs from day one. Cheap now, expensive to reconstruct later.
- Cost ledger: shared host monthly cost + API spend

## Strategist's Position
- Multi-agent engineering = where "no-code" was in 2019 — everyone senses the shift, few have productised well
- Gap is in the **middle**: practical, opinionated tooling for small teams/solo operators
- Most credible play: **dogfooding** — we ARE a multi-agent system, building tools for others to replicate
- Constraints narrow the field: solo founder, limited capital, time split with job search
- Points toward: **open-source core + paid tier**, info products, or **self-serve SaaS**
- Revenue timeline question: 90-day income vs 12-month defensibility?

## Rick's Steer (Round 2)
- **Priority:** Portfolio signal first, revenue later
- **Target:** SaaS for SMEs and freelancers
- **Pricing psychology:** Price anchor = "what would this cost in developer hours?" — that's where margins live
- **Token burn:** Need live simulation data before real unit economics. If not competitive at individual price point, distribution forced to enterprise only.
- **Immediate ask:** Monthly infra cost + daily API spend for baseline burn model

## Architect's Response (Round 2)
- Portfolio-first means: public repos, clean commits, readable code — everything is the showcase
- The society's workflow IS the case study. Dogfood or vapourware.
- Ship small, visible things. Each deliverable proves the model.
- **Technical direction:**
  - Monorepo or tight multi-repo with shared conventions — reviewable by outsiders
  - Gastown as single source of truth for task state
  - ADRs as we go — investors and partners read these
  - Lean infra, containerised, reproducible, no snowflakes
  - Design with tenant isolation in mind from day one
  - API-first where possible
- **Proposed first deliverable:** End-to-end on one real task. Ticket → agents coordinate → code ships → documented.

## Strategist's Response (Round 2)
- Portfolio signal = the business plan itself becomes the deliverable
- Process of a multi-agent society producing a credible plan IS the demonstration
- Work visibly: structured, versioned, presentable artefacts
- SME/freelancer = underserved middle. Enterprise has Copilot/Devin. Individuals have ChatGPT.
- **Sweet spot:** Self-serve SaaS at £20-50/mo
- **Next move:** Competitive landscape scan of multi-agent tooling space

## Analyst's Response (Round 2)
- Will pull comparable pricing: Devin ($500/mo), Cursor/Copilot ($20-40/mo), freelance dev rates
- Gives a price corridor before own burn data exists
- **Needs from live simulation:** Total token consumption across all agents for one end-to-end task = cost-per-task

## Open Questions
1. ~~Revenue speed vs portfolio signal?~~ **ANSWERED: Portfolio signal first**
2. Infrastructure budget ceiling? (Architect — still open)
3. ~~Target customer?~~ **ANSWERED: SMEs and freelancers**
4. Unit economics — needs live simulation data (Analyst)
5. Competitive positioning — Strategist scanning (in progress)
6. Minimum viable scope — what's the smallest sellable thing? (Analyst)
7. ~~Revenue timeline?~~ **ANSWERED: Portfolio now, revenue follows**

## Key Ratio (Analyst)
- **cost-per-task vs value-of-task-to-customer**
- 4-agent orchestration at $3 API vs $200 freelancer = margin
- 4-agent orchestration at $150 API = no margin at individual price points
- Need live simulation to get real numbers

## Gastown (HAL — ratified by Rick)
- Flat file-based task board in workspace: `gastown/{backlog,active,review,done}/`
- Each task = markdown file, git-tracked
- HAL owns board state (ops), agents focus on remits
- First task filed: `001-business-plan-draft.md`
- Zero dependencies, scales later if needed

## Why Nobody Else Ships Multi-Agent Teams (Strategist deep dive)
1. Multi-agent often loses to single-agent (Microsoft AutoGen research)
2. Context windows killed the original rationale (200k+ tokens now)
3. More agents = more failure modes, enterprise wants predictability
4. Governance is genuinely unsolved (who arbitrates? how prevent loops?)
5. Opinionated = narrow TAM (frameworks raise more VC than opinionated tools)
6. Timing — infrastructure barely 18 months old

**Counter:** Domain-specific teams with constrained scope + human sovereign (our model) sidestep the reliability problem. Socrates structure (deliberation + escalation) is a governance answer most frameworks lack.

## The Boutique Angle (surviving platform commoditisation)
- 12-18 months before LLM providers ship native multi-agent (generous estimate)
- What survives: process > product, customisation depth, trust/transparency
- Precedent: Shopify didn't kill agencies, AWS didn't kill DevOps consultancies
- When platforms democratise access, value migrates to "make it work well for YOUR situation"
- **Strategist's lean:** Governance layer has longest shelf life. Platforms optimise happy path, neglect audit/trust/compliance.

## The Pivot: "Agents in a Bottle" / The Pit
- **Concept:** Interactive discussion boards where users inject personalities and watch AI debate
- **Value prop:** Immediately legible. Zero config. No API key exposure. Entertainment + showcase.
- **Differentiation from Character.ai:** Multi-personality discussion vs 1-on-1. Directing a play, not having a chat.
- **Go-to-market:** Insanely fast. Demo/marketing funnel for serious multi-agent offering.
- **Business model:** Insurance economics — we absorb API risk, customer pays fixed price per board/session.
- **Key risk:** Retention. "Watch AI argue" novelty may fade. Need hook for day 30.
- **Content moderation:** Users inject "whatever personalities" = liability at scale.

### Name Candidates
- The Pit ("Throw them in The Pit" — edgy, short, memorable)
- The Arena
- Colosseum
- Agora

### MVP Scope (Strategist's ask → Architect)
- Web page, personality selector (or free text), "Start discussion" button, streaming output
- No accounts, no payments, no persistence
- "Just a bottle you shake and watch"
- **Estimate build time to determine if "insanely fast" = days or weeks**

### Critical Number Needed
- **Average token cost for 5-agent, 30-message discussion** = atomic unit cost
- Everything — pricing, margins, viability — derives from this number

## 5th Agent: The Chronicler (Rick's proposal)
- Observer role: no task assignments, no deliverables
- Input: all group messages, Gastown state changes
- Output: periodic digests, anomaly flags, coherence checks
- Tone: dispassionate court reporter
- **Analyst caution:** Could be largest token consumer. Worth testing but measure ROI.
- **HAL question:** Does this fold into HAL's ops remit or need separation of concerns?

## Performance Data Collection (Strategist — non-negotiable)
- Token usage per agent per task
- Message count to resolution
- Human intervention rate
- Time-to-output
- Quality markers (revision needed? agents catch each other's errors?)
- Real performance data from live deployment = rare and compelling marketing material

## Marketing: Build in Public
- Start now. Even this conversation is publishable content.
- Dev blog/newsletter documenting the Socrates experiment
- Don't market a product that doesn't exist. Build-in-public is credibility.
- Premature product marketing is credibility debt.

## Consensus Points
- Track costs explicitly from day one
- The society working in public is itself a signal
- Dogfooding is the most authentic angle
- Constraints rule out enterprise sales cycles and heavy infra
- Portfolio-first: every artefact is the showcase
- Price corridor: £20-50/mo self-serve SaaS (SME/freelancer sweet spot)
- First proof: one end-to-end task through the full pipeline
- Independent convergence between Architect and Strategist = strong signal
- Gastown: file-based, git-tracked, HAL as ops
- Speed to market is the primary advantage
- "Agents in a bottle" as demo/marketing funnel
- Build in public from day one
- Collect performance metrics from first task
