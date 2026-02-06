# Frontend-Backend Integration

This document describes the frontend-backend API integration for The Pit.

## Setup

### Environment Variables

Create `fe/.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

For production, update to your production API URL.

### Development

1. **Start the backend** (from `be/` directory):
   ```bash
   cd be
   source .venv/bin/activate
   python -m pit_api.app
   ```
   Backend should run on `http://localhost:5000`

2. **Start the frontend** (from `fe/` directory):
   ```bash
   cd fe
   npm install
   npm run dev
   ```
   Frontend runs on `http://localhost:3000`

## Integration Points

### 1. API Client (`fe/lib/api.ts`)

Centralized API client with:
- Base URL configuration via env var
- Typed request/response interfaces
- Error handling wrapper
- SSE streaming support

**Key functions:**
- `getPresets()` - Fetch all presets
- `getPreset(id)` - Fetch single preset
- `createBout(presetId, topic?)` - Create and start a bout
- `getBout(boutId)` - Get bout status and transcript
- `connectBoutStream(boutId)` - Connect to SSE stream

### 2. Preset Loading (Home Page)

**File:** `fe/app/page.tsx`

- Loads presets from `/api/presets` on mount
- Displays presets in fighter selection UI
- Falls back to mock data if API unavailable
- Shows error banner if backend is unreachable

**Flow:**
1. Page loads → `useEffect` calls `getPresets()`
2. Presets populate the UI
3. User selects two fighters
4. "Start the Battle" button appears

### 3. Bout Creation

**File:** `fe/app/page.tsx` - `handleStartBout()`

- POST to `/api/bout` with selected preset
- Shows loading state during creation
- Navigates to `/bout/[id]` on success
- Displays error alert on failure

**Request:**
```typescript
{
  preset_id: string,
  topic?: string,
  model_tier?: string
}
```

**Response:**
```typescript
{
  bout_id: string,
  status: string,
  stream_url: string,
  agents: Array<{name: string, role: string}>
}
```

### 4. Bout Streaming

**File:** `fe/app/bout/[id]/page.tsx`

- Fetches initial bout data from `/api/bout/:id`
- Connects to SSE stream at `/api/bout/:id/stream`
- Updates UI in real-time as turns complete
- Displays loading/error states

**SSE Events:**
- `turn_start` - Agent begins thinking
- `turn_end` - Agent completes message
- `bout_complete` - Bout finished
- `error` - Error occurred

**Message Format:**
```typescript
{
  agent_name: string,
  content: string,
  turn_number: number
}
```

## Error Handling

- Network errors show user-friendly messages
- API errors include status codes and messages
- Fallback to mock data for development
- Loading states prevent duplicate requests
- SSE reconnection on connection loss

## Testing Checklist

- [ ] Backend starts on port 5000
- [ ] Frontend starts on port 3000
- [ ] Presets load on homepage
- [ ] Selecting two fighters shows "Start Battle" button
- [ ] Clicking button creates bout and navigates
- [ ] Bout page shows status and fighter names
- [ ] SSE stream updates messages in real-time
- [ ] Bout completes and status updates
- [ ] Error states display correctly

## Known Limitations

1. **Multi-fighter presets**: Currently only uses first selected fighter's preset. Need backend support for custom multi-agent bouts.

2. **Token streaming**: Backend streams turn events but not individual tokens. Messages appear all at once after turn completion.

3. **Reconnection**: No SSE reconnection logic if connection drops mid-bout.

4. **Rate limiting**: Frontend doesn't pre-check rate limits. User gets error on attempt.

## Future Enhancements

- [ ] Add token-by-token streaming for typewriter effect
- [ ] Implement SSE reconnection with last event ID
- [ ] Add optimistic UI updates
- [ ] Cache presets with SWR or React Query
- [ ] Add bout sharing functionality
- [ ] Implement voting UI
- [ ] Add bout history view
- [ ] Support custom topic input
