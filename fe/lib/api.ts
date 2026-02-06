/**
 * API Client for The Pit backend
 */

// Types for API responses
export interface PresetAgent {
  id?: string;
  name: string;
  role?: string;
  avatar?: string;
  color?: string;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  category: string;
  agent_count: number;
  featured: boolean;
  sort_order: number;
  requires_input: boolean;
  input_label?: string;
  turn_pattern?: string;
  max_turns?: { standard: number; juiced: number; unleashed: number };
  launch_day_hero?: boolean;
  agents?: PresetAgent[];
  // Legacy compatibility
  premise?: string;
  tone?: string;
  user_input?: boolean;
}

export interface PresetsResponse {
  presets: Preset[];
  categories: string[];
}

export interface BoutResponse {
  bout_id: string;
  status: string;
  stream_url: string;
  agents: PresetAgent[];
}

export interface BoutMessage {
  id: string;
  agent_name: string;
  content: string;
  turn_number: number;
  timestamp: string;
}

export interface BoutDetail {
  id: string;
  status: string;
  preset_id: string;
  topic?: string;
  messages: BoutMessage[];
  created_at: string;
  completed_at?: string;
}

export interface SSEEvent {
  type: 'turn_start' | 'turn_end' | 'bout_complete' | 'error' | 'token';
  data: any;
}

// API Configuration
const getBaseUrl = (): string => {
  // Check for environment variable first
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // Default to localhost in development
  return 'http://localhost:5000';
};

// Error handling wrapper
class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Fetch wrapper with error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${getBaseUrl()}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || errorData.error || 'API request failed',
        response.status,
        errorData.code
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or parsing error
    throw new ApiError(
      error instanceof Error ? error.message : 'Network request failed'
    );
  }
}

// API Methods

/**
 * Fetch all available presets
 */
export async function getPresets(): Promise<PresetsResponse> {
  return await apiFetch<PresetsResponse>('/api/presets');
}

/**
 * Get presets filtered by category
 */
export async function getPresetsByCategory(category: string): Promise<Preset[]> {
  const response = await getPresets();
  return response.presets.filter(p => p.category === category);
}

/**
 * Get featured presets
 */
export async function getFeaturedPresets(): Promise<Preset[]> {
  const response = await getPresets();
  return response.presets.filter(p => p.featured);
}

/**
 * Fetch a specific preset by ID
 */
export async function getPreset(presetId: string): Promise<Preset> {
  return await apiFetch<Preset>(`/api/presets/${presetId}`);
}

/**
 * Create a new bout
 */
export async function createBout(
  presetId: string,
  topic?: string,
  modelTier: string = 'standard'
): Promise<BoutResponse> {
  return await apiFetch<BoutResponse>('/api/bout', {
    method: 'POST',
    body: JSON.stringify({
      preset_id: presetId,
      topic,
      model_tier: modelTier,
    }),
  });
}

/**
 * Get bout details and transcript
 */
export async function getBout(boutId: string): Promise<BoutDetail> {
  return await apiFetch<BoutDetail>(`/api/bout/${boutId}`);
}

/**
 * Connect to bout SSE stream
 * Returns an EventSource for streaming bout events
 */
export function connectBoutStream(boutId: string): EventSource {
  const url = `${getBaseUrl()}/api/bout/${boutId}/stream`;
  return new EventSource(url);
}

/**
 * Get share text for a completed bout
 */
export async function getBoutShare(boutId: string): Promise<{
  text: string;
  permalink: string;
}> {
  return await apiFetch(`/api/bout/${boutId}/share`);
}

// Export error class for error handling
export { ApiError };
