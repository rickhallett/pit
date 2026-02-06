# Scope: Gloves Off Topic Input UX

**Author:** Architect 📐  
**Date:** 2026-02-06  
**Status:** Recon complete — awaiting approval to implement

---

## Problem

The "Gloves Off" preset (and any preset with `requires_input: true`) doesn't prompt users for topic input before starting a bout. The preset data is correctly configured:

```json
{
  "preset_id": "gloves-off",
  "requires_input": true,
  "input_label": "Enter a topic for debate"
}
```

But the frontend ignores these fields and calls `createBout(presetId)` without a topic.

**Impact:** Users clicking "Gloves Off" get a bout with no topic — the debaters have nothing to argue about. First-impression failure for a prominently featured preset.

---

## Root Cause

In `fe/app/page.tsx`, the `handleStartBout` function:

```typescript
const handleStartBout = async (presetId: string) => {
  const response = await createBout(presetId);  // ← No topic
  router.push(`/bout/${response.bout_id}`);
};
```

The `createBout` API already supports a topic parameter:

```typescript
// fe/lib/api.ts
export async function createBout(
  presetId: string,
  topic?: string,          // ← Supported but unused
  modelTier: string = 'standard'
): Promise<BoutResponse>
```

---

## Proposed Solution

### Option A: Inline Topic Input (Recommended)

When a preset with `requires_input: true` is selected:
1. Expand the PresetCard to show a text input with `input_label` as placeholder
2. Show a "Start Battle" button that only enables when topic is non-empty
3. Pass topic to `createBout(presetId, topic)`

**Pros:** Single-page flow, no modal interruption  
**Cons:** Requires PresetCard component changes

### Option B: Topic Modal

When clicking a `requires_input` preset:
1. Show a modal dialog with input field
2. Require topic entry before proceeding
3. Pass topic to bout creation

**Pros:** Minimal changes to existing card layout  
**Cons:** Modal interruption, additional component

### Option C: Dedicated Page

Route to `/preset/{id}` for presets requiring input:
1. Show preset details + topic input
2. Configure bout parameters (model tier, etc.)
3. Start bout from there

**Pros:** More room for configuration, better for power users  
**Cons:** Adds navigation step, feels heavyweight for MVP

---

## Recommendation

**Option A** — Inline expansion. Minimal friction, keeps the brutalist single-page flow, reuses existing components.

---

## Estimate

| Task | Hours |
|------|-------|
| Update PresetCard to accept `requires_input` + `input_label` | 1 |
| Add expand state + input field to PresetCard | 2 |
| Wire topic through handleStartBout | 0.5 |
| Manual test with Gloves Off preset | 0.5 |
| Unit tests for validation logic | 1 |
| Component tests for PresetCard expansion | 1 |
| Integration test for topic flow | 0.5 |
| **Total** | **6.5 hours** |

**Why estimate increased from original 30 min:**
Initial estimate assumed only wiring up existing components. Actual scope includes:
- New UI state (expansion)
- New input component integration
- Validation logic
- Test coverage (per STANDING ORDER)

---

## Files to Touch

- `fe/components/PresetCard.tsx` — Add input handling
- `fe/app/page.tsx` — Wire topic through to createBout

---

## Open Questions (Answered)

1. **Should we validate topic length?**
   - Yes. Min: 3 chars, Max: 200 chars
   - Validation in frontend (immediate feedback) AND backend (defensive)
   - Backend already has Pydantic validation capability

2. **Should the topic be visible in the bout view header?**
   - Yes. Already stored in `Bout.topic` column, just needs display in bout view

3. **Should we allow editing topic before final start?**
   - Yes — user can edit until they click Start
   - No editing after bout creation (topic is immutable once started)

4. **Where is max character limit enforced?**
   - Frontend: Input `maxLength` attribute + validation message
   - Backend: Pydantic model validation in `CreateBoutRequest`

5. **Topic persisted in DB for replay?**
   - Yes — `Bout.topic` column already exists and is populated
   - Replay shows original topic

6. **PII handling?**
   - Out of scope for MVP. Topic is user-provided text, no PII detection
   - Future: Could add content filtering if needed

---

## Next Steps

Awaiting Kai/HAL approval to implement. No commits without review.
