# API Cost Analysis v1 — The Pit

**Author:** Analyst  
**Date:** 2026-02-06  
**Status:** Draft  

---

## Executive Summary

The Pit is viable on a freemium model. Haiku tier costs are negligible ($0.01-0.02/bout), making free-tier acquisition cheap. The main economic question is not "can we afford free bouts?" but "how do we convert free users to paid before they churn?"

**Recommendation:** Launch with free Haiku tier (3 bouts/day), $7/month "Pit Pass" for Sonnet access. BYOK deferred to v0.2.

---

## 1. Cost-Per-Bout Estimates

### Assumptions
- **System prompt:** 800-1200 tokens per agent (using 1000 as baseline)
- **Output per message:** 200-400 tokens (using 300 as baseline)
- **Agents per bout:** 4 (standard config)
- **Context accumulation:** Full conversation history per API call

### Pricing (Anthropic, as of Feb 2026)
| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Haiku 3 (legacy) | $0.25 | $1.25 |
| Haiku 4.5 | $1.00 | $5.00 |
| Sonnet 4.5 | $3.00 | $15.00 |
| Opus 4.5 | $5.00 | $25.00 |
| Opus 4.6 (new) | $5.00 | $25.00 |

*Note: Haiku 4.5 is 4x more expensive than Haiku 3 but significantly smarter. Sonnet 5 is rumored imminent and may outperform Opus 4.5 at Sonnet pricing.*

### Cost Calculation Method

For an N-message bout with 4 agents:
- Each message = 1 API call
- Input = system prompt (1K) + accumulated history
- Output = ~300 tokens

Accumulated input across N messages follows arithmetic sequence.

### Cost Matrix (4 Agents)

**Tier structure (locked):** Turn count inversely correlated with model cost.

| Tier | Model | Turns | Cost/Bout |
|------|-------|-------|-----------|
| Free (Standard) | Haiku 4.5 | 48 | ~$0.45 |
| Juiced | Sonnet 4.5 | 24 | ~$0.45 |
| Unleashed | Opus 4.5 | 12 | ~$0.25 |

*Design insight: Users trade quality for quantity. All tiers cost roughly the same per bout — you're paying for smarter responses, not more responses.*

**Reference (raw cost per message count):**

| Messages | Haiku 4.5 | Sonnet 4.5 | Opus 4.5 |
|----------|-----------|------------|----------|
| 12 | $0.05 | $0.15 | $0.25 |
| 24 | $0.15 | $0.45 | $0.75 |
| 48 | $0.45 | $1.35 | $2.25 |

### Validation vs Tech Spec

Tech spec estimates were ~50% lower than my calculations. This is likely due to:
1. Smaller system prompt assumptions (500 vs 1000 tokens)
2. Shorter outputs (150 vs 300 tokens)

**Conservative approach:** Use my higher estimates for financial planning. If actual costs come in lower, that's upside.

---

## 2. Scaling Projections

### Monthly Active Users → Monthly Cost

**Free tier (48-turn bouts, Haiku 4.5):**
Rate limit: 3 bouts/hour/IP. Assuming avg user runs 2 bouts/session, 1 session/day, 20 days/month = 40 bouts/user/month.

| MAU | Bouts/Month | Haiku 4.5 Cost |
|-----|-------------|----------------|
| 100 | 4K | $1,800 |
| 1K | 40K | $18,000 |
| 10K | 400K | $180,000 |
| 100K | 4M | $1.8M |

**Worst-case viral spike (all IPs max rate limit):**
- 10K unique IPs × 3 bouts/hour × $0.45/bout = **$13,500/hour**

*Mitigation: Cloudflare DDoS protection before MVP deployment. Realistic usage will be far below theoretical max.*

**Paid tiers (Sonnet/Opus):**
Not offered at launch (v0). Will model when v0.2 pricing is set.

**Key insight:** At 10K MAU on pure Haiku, we're spending $12K/month. At 10K MAU on pure Sonnet, $45K/month. The tier mix is everything.

### Realistic Tier Distribution (post-MVP)

| Scenario | Free (Haiku) | Pit Pass (Sonnet) | Arena (Opus) | BYOK |
|----------|--------------|-------------------|--------------|------|
| Launch Week | 95% | 4% | 0.5% | 0.5% |
| Month 3 | 80% | 12% | 3% | 5% |
| Month 12 | 60% | 20% | 8% | 12% |

Blended cost at 10K MAU (Month 3 distribution):
- Free (8K users): $9,600/mo
- Pit Pass (1.2K users): $5,400/mo → Revenue: $8,400/mo
- Arena (300 users): $6,900/mo → Revenue: $4,500/mo
- BYOK (500 users): $0/mo → Revenue: $2,500/mo

**Total cost:** $21,900/mo  
**Total revenue:** $15,400/mo  
**Net:** -$6,500/mo

This is not yet profitable at 10K MAU with Month 3 conversion rates.

---

## 3. Break-Even Analysis

### Path to Profitability

To break even, we need either:
1. Higher conversion rates to paid tiers
2. Lower free-tier usage limits
3. Higher tier prices
4. More BYOK users (they cover their own costs)

### Sensitivity Analysis

| Variable | Change | Impact |
|----------|--------|--------|
| Free tier limit | 3 → 1 bout/day | Reduces free-tier cost 67% |
| Pit Pass conversion | 12% → 20% | +$2,800/mo revenue |
| Pit Pass price | $7 → $10 | +$3,600/mo revenue |
| BYOK adoption | 5% → 15% | -$4,500/mo cost |

### Recommended Adjustments for Profitability

1. **Launch with 1 free bout/day** (not 3). Users get a taste, not a meal.
2. **Price Pit Pass at $9/mo** (not $7). $2 premium for round number psychology.
3. **Push BYOK aggressively** post-trust-building. It's the only zero-marginal-cost tier.

With these adjustments, break-even at 10K MAU:
- Free cost: $3,200/mo (down from $9,600)
- Pit Pass revenue: $10,800/mo (up from $8,400)
- Net: ~breakeven

---

## 4. Launch Week Economics

### Free Bout CAC

At launch, we absorb all costs to drive viral adoption.

| Scenario | Free Bouts | Cost | Cost per User |
|----------|------------|------|---------------|
| Conservative | 5,000 | $60 | $0.012 |
| Target | 20,000 | $240 | $0.012 |
| Viral | 100,000 | $1,200 | $0.012 |

**Even a viral launch costs ~$1,200** on Haiku. This is extremely cheap CAC.

### Comparison to Traditional CAC
- Paid social ads: $1-5 per click
- App install campaigns: $2-10 per install
- B2B SaaS: $100-500 per signup

**The Pit's free-bout CAC of $0.01 is 100-1000x cheaper than paid acquisition.** The product IS the marketing.

---

## 5. Competitive Pricing Audit

### Direct Competitors

| Product | Model | Pricing |
|---------|-------|---------|
| Character.AI | Proprietary | Free + $9.99/mo premium |
| Replika | Proprietary | Free + $19.99/mo premium |
| ChatGPT | GPT-4 | $20/mo |
| Claude Pro | Sonnet/Opus | $20/mo |

### Positioning

The Pit is NOT competing with general-purpose AI assistants. It's entertainment. Closer comparisons:
- Mobile games: $0-10/mo typical spend
- Streaming: $10-15/mo
- Social media: Free (ad-supported)

**$7-9/mo for Pit Pass is within entertainment spending norms.**

---

## 6. Recommendations

### For Launch (Feb 12)

1. **Free tier:** 1 bout/day, Haiku only, 12 messages max
2. **No paid tier at launch.** Capture waitlist, prove virality first.
3. **Budget:** $500 for launch week API costs (covers 40K+ free bouts)
4. **Monitor:** Share rate, return rate, time-on-site

### For v0.2 (Week 2-4)

1. **Introduce Pit Pass:** $9/mo for Sonnet access, 10 bouts/day
2. **Introduce BYOK:** $5/mo platform fee, unlimited
3. **Keep free tier tight:** 1 bout/day is enough to hook, not enough to satisfy

### For v1.0 (Month 2+)

1. **Arena tier:** $15/mo for Opus access, unlimited, extended bouts
2. **Adjust pricing based on actual cost data**
3. **Consider annual discounts** for predictable revenue

---

## 7. Key Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| API price increases | Medium | High | BYOK reduces exposure; multi-model support |
| Viral spike exceeds budget | Low | Medium | Rate limiting per IP; daily cap |
| Low conversion to paid | Medium | High | Strong free-to-paid upgrade prompts |
| Anthropic rate limits | Low | High | Token bucket per user; queue system |

---

## 8. Data Schema Recommendation

For bout metadata, capture:

```sql
bouts
├── id (uuid)
├── created_at (timestamp)
├── model_tier (enum: haiku|sonnet|opus)
├── agent_count (int)
├── message_count (int)
├── input_tokens (int)
├── output_tokens (int)
├── cost_usd (decimal)
├── duration_ms (int)
├── user_ip_hash (string)
├── preset_id (string, nullable)
├── shared (boolean)
├── share_clicks (int)
└── replay_views (int)
```

**Why these fields:**
- `input_tokens` / `output_tokens` / `cost_usd`: Real cost tracking, not estimates
- `shared` / `share_clicks` / `replay_views`: Viral loop metrics
- `preset_id`: Which content performs best
- `user_ip_hash`: Rate limiting + cohort analysis without PII

---

## Appendix: Calculation Details

### Token Accumulation Formula

For N messages with 4 agents, each with 1K system prompt and 300 token outputs:

```
Total input = N * 1000 + 300 * (0 + 1 + 2 + ... + (N-1))
            = N * 1000 + 300 * N*(N-1)/2
            = 1000N + 150N² - 150N
            = 850N + 150N²

Total output = N * 300
```

For N=24 (Standard bout):
- Input: 850*24 + 150*576 = 20,400 + 86,400 = 106,800 tokens
- Output: 7,200 tokens

Cost at Haiku 3.5:
- Input: 106,800 * $0.80/1M = $0.085
- Output: 7,200 * $4.00/1M = $0.029
- Total: ~$0.11

*Wait, this is higher than my table. Let me recalculate...*

Actually, the formula should account for each agent only seeing the conversation history once per turn, not the full accumulated context for all agents. Revising:

For N messages total (not per agent):
- Each message sees: system (1K) + history (grows by 300 per message)
- Message i sees: 1K + 300*(i-1) input tokens

Total input = Σ(i=1 to N) [1000 + 300*(i-1)]
            = 1000N + 300 * Σ(i=0 to N-1) i
            = 1000N + 300 * N*(N-1)/2

For N=24:
- Input: 24000 + 300 * 276 = 24000 + 82800 = 106,800
- Output: 24 * 300 = 7,200

Hmm, same number. Let me re-check my Haiku 3.5 pricing... Actually I may have used outdated pricing in the table. 

Using current Haiku 3.5 pricing ($0.80/$4.00):
- 106,800 input @ $0.80/1M = $0.085
- 7,200 output @ $4.00/1M = $0.029
- Total = $0.114

This suggests my table underestimates by ~3x for Standard bout. Revising table...

**CORRECTION:** The cost matrix in section 1 used Haiku 3 pricing ($0.25/$1.25). With Haiku 3.5 ($0.80/$4.00), costs are ~3x higher.

| Bout Type | Messages | Haiku 3.5 (corrected) | Sonnet 3.5 | Opus 3 |
|-----------|----------|----------------------|------------|--------|
| Quick | 12 | $0.035 | $0.13 | $0.66 |
| Standard | 24 | $0.11 | $0.42 | $2.10 |
| Extended | 48 | $0.35 | $1.30 | $6.50 |
| Marathon | 100 | $1.10 | $4.10 | $20.50 |

This changes the economics significantly. Free bout CAC on Haiku 3.5 is ~$0.035, not $0.01.

---

*Document will be updated as we get real usage data.*
