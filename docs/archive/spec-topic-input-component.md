# Component Spec: Topic Input

**Author:** Architect 📐  
**Date:** 2026-02-06  
**Status:** SUPERSEDED — implemented as modal instead  
**Parent:** `docs/scope-gloves-off-ux.md`

---

## Implementation Note

> **Design pivot:** The original spec proposed inline expansion in PresetCard.
> The actual implementation uses a modal (`TopicInputModal.tsx`) because:
> - Cleaner separation of concerns
> - Better focus management for accessibility
> - Simpler state management (no card expansion logic)
> - Modal pattern is more familiar to users
>
> See `fe/components/TopicInputModal.tsx` for the actual implementation.

---

## Original Spec (Historical)

Add inline topic input to PresetCard for presets with `inputRequired: true`. No modals, no new routes — the card expands to show the input field.

**Key Discovery:** There's already a type system with parsing and validation in `fe/types/debate.ts` and `fe/lib/presets.ts`. We just need to use it.

| API (snake_case) | Frontend (camelCase) | Purpose |
|------------------|----------------------|---------|
| `requires_input` | `inputRequired` | Must provide topic |
| `input_optional` | `inputOptional` | Can provide topic |
| `input_label` | `inputHint` | Placeholder text |

---

## Component Changes

### 1. PresetCard.tsx

**New Props:**

```typescript
interface PresetCardProps {
  // Existing
  name: string;
  description: string;
  stance: string;
  index: number;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  
  // New — use proper type names from fe/types/debate.ts
  inputRequired?: boolean;
  inputHint?: string;
  onStartWithTopic?: (topic: string) => void;
}
```

**Behavior:**

- If `inputRequired` is false/undefined: clicking the card calls `onClick()` immediately (current behavior)
- If `inputRequired` is true: clicking expands the card to show input field
  - Input placeholder = `inputHint` or "Enter a topic..."
  - "Start Battle" button appears below input
  - Use `validateUserInput()` from `fe/lib/presets.ts` for validation
  - Pressing Enter in input field triggers start (if valid)
  - Clicking elsewhere collapses the card

**State:**

```typescript
const [expanded, setExpanded] = useState(false);
const [topic, setTopic] = useState('');

const handleClick = () => {
  if (inputRequired) {
    setExpanded(true);
  } else {
    onClick?.();
  }
};

const handleStart = () => {
  // Use existing validation from fe/lib/presets.ts
  const validation = validateUserInput(preset, topic);
  if (validation.isValid) {
    onStartWithTopic?.(topic.trim());
  }
};
```

**Expanded UI (appended to existing card content):**

```tsx
{expanded && inputRequired && (
  <div className="mt-6 space-y-4">
    <input
      type="text"
      value={topic}
      onChange={(e) => setTopic(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && handleStart()}
      placeholder={inputHint || "Enter a topic..."}
      className="w-full border-2 border-white/20 bg-black px-4 py-3 
                 text-white placeholder:text-zinc-600 
                 focus:border-accent focus:outline-none"
      autoFocus
    />
    <button
      onClick={handleStart}
      disabled={topic.trim().length < 3 || disabled}
      className="border-2 border-accent bg-accent px-6 py-2 
                 font-black uppercase tracking-tight text-black
                 transition-colors hover:bg-accent/80
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Start Battle
    </button>
  </div>
)}
```

---

### 2. page.tsx

**Changes to imports:**

```typescript
import { parsePreset, PresetConfig } from '@/types/debate';
import { validateUserInput } from '@/lib/presets';
```

**Transform API response → typed presets:**

```typescript
const [presets, setPresets] = useState<PresetConfig[]>([]);

// In loadPresets():
const data = await getPresets();
setPresets(data.presets.map(parsePreset));  // ← Transform here
```

**Changes to preset rendering:**

```typescript
{presets
  .filter(p => !p.launchDayHero)  // ← Use camelCase now
  .map((preset, index) => (
    <PresetCard
      key={preset.id}
      name={preset.name}
      description={preset.premise || preset.description}
      stance={preset.premise || preset.description}
      index={index}
      selected={selectedPreset === preset.id}
      disabled={creatingBout}
      // New props — use proper type names
      inputRequired={preset.inputRequired}
      inputHint={preset.inputHint}
      onClick={() => handleStartBout(preset.id)}
      onStartWithTopic={(topic) => handleStartBout(preset.id, topic)}
    />
  ))}
```

**Changes to handleStartBout:**

```typescript
const handleStartBout = async (presetId: string, topic?: string) => {
  try {
    setCreatingBout(true);
    setSelectedPreset(presetId);
    
    const response = await createBout(presetId, topic);  // ← Now passes topic
    
    router.push(`/bout/${response.bout_id}`);
  } catch (err) {
    // ... existing error handling
  } finally {
    setCreatingBout(false);
  }
};
```

---

## Edge Cases

| Case | Behavior |
|------|----------|
| Topic is whitespace only | Trimmed → treated as empty, button disabled |
| Topic < 3 chars | Button disabled (existing validation) |
| Topic > 500 chars | Button disabled, error shown (existing validation) |
| User clicks away while expanded | Card collapses, draft discarded (simpler UX) |
| Multiple presets clicked | Only one can be expanded at a time |
| Backend rejects topic | Show error in existing error UI |

**Note:** All validation handled by existing `validateUserInput()` in `fe/lib/presets.ts`.

---

## Visual Notes

- Expanded state adds ~120px height to card
- Input field spans full card width
- Button aligns left (matches card's text alignment)
- Use existing brutalist styling — no rounded corners, bold borders
- Accent color border on focus

---

## Testing

```typescript
describe('PresetCard with inputRequired', () => {
  it('shows input field when clicked', () => {
    render(<PresetCard inputRequired={true} inputHint="Enter topic" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByPlaceholderText('Enter topic')).toBeVisible();
  });
  
  it('disables start button when topic too short', () => {
    // ...
  });
  
  it('calls onStartWithTopic with trimmed topic', () => {
    // ...
  });
});
```

---

## Files to Create/Modify

| File | Change |
|------|--------|
| `fe/components/PresetCard.tsx` | Add expansion logic, input field, new props |
| `fe/app/page.tsx` | Pass new props, update handleStartBout signature |

---

## Not In Scope

- Topic length validation (max chars) — can add later if needed
- Topic persistence across page refresh
- Topic editing after bout starts
- Hero card (Darwin Special) topic input — separate ticket if needed

---

## Implementation Order

1. ~~Fix gloves-off.json field names~~ ✓ Done
2. Update PresetCard props + types
3. Add expansion state + input UI
4. Wire onStartWithTopic callback
5. Update page.tsx to pass new props
6. Update handleStartBout to accept topic
7. Manual test with Gloves Off preset
8. Add unit tests

---

## Estimate

| Task | Time |
|------|------|
| ~~Fix gloves-off.json field names~~ | ✓ Done |
| Update PresetCard props + expand state | 20 min |
| Add input field UI (copy WaitlistForm pattern) | 15 min |
| Wire topic through page.tsx → createBout | 10 min |
| Write tests for new behavior | 15 min |
| **Total** | **~60 min** |

*Revised after Critic's review. Original scope doc estimated 4hr before discovering existing infrastructure.*

---

## Prerequisite Fix (Completed)

The `gloves-off.json` preset had wrong field name (`requires_topic` instead of `requires_input`). Fixed before this spec:

```diff
- "requires_topic": true,
+ "requires_input": true,
+ "input_label": "Enter a topic for debate",
```

---

*Ready for review. No implementation until approved.*
