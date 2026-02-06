# 006 — API Cost Analysis

| Field        | Value          |
|--------------|----------------|
| **ID**       | 006            |
| **Assignee** | Analyst        |
| **Priority** | HIGH           |
| **Status**   | Active         |
| **Deps**     | None           |

## Description

Model the API costs for running The Pit at various scales. Critical for pricing decisions, tier design, and understanding when/if the freemium model is viable.

### Key Questions

1. What's the cheapest model that still produces entertaining output?
2. Can we mix models (cheap for some bots, expensive for leads)?
3. What's the optimal turn count (entertainment value vs cost)?
4. What free tier can we sustain at launch?

## Acceptance Criteria

- [x] Cost-per-conversation estimates for at least 3 model tiers (Haiku/Sonnet/Opus)
- [x] Cost comparison table: model x bot count x turn count
- [x] Monthly cost projections at 100, 1K, 10K, 100K active users
- [x] Recommended pricing tiers with margin analysis
- [x] BYOK vs platform-funded cost comparison
- [x] Recommendation on optimal model(s) for quality-to-cost ratio
- [x] Written summary with clear recommendation for launch pricing

## Deliverable

**Document:** `~/code/pit/docs/api-cost-analysis-v1.md`

**Key findings:**
- Haiku 3 vs 3.5 pricing is a 3x difference — decision needed
- Break-even requires tight free-tier limits (1 bout/day, not 3)
- Launch week budget: ~$500 for 40K+ free bouts
- Recommend Haiku 3 for free tier, $9/mo Pit Pass for Sonnet

**Status:** Complete pending Haiku version decision
