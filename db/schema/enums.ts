/**
 * Enum definitions for The Pit
 * 
 * SQLite doesn't support native enums. We use TypeScript string literal unions
 * for type safety, with CHECK constraints added in migrations for DB-level enforcement.
 */

// Bout lifecycle status
export const boutStatusValues = ['pending', 'running', 'voting', 'complete'] as const;
export type BoutStatus = typeof boutStatusValues[number];

// Turn orchestration pattern
export const turnTypeValues = [
  'alternating',  // A → B → A → B (Roast Battle, Gloves Off)
  'broadcast',    // A → [B,C,D parallel] → A → ... (Shark Pit)
  'round_robin',  // A → B → C → D → A → ... (Flatshare, Writers Room)
] as const;
export type TurnType = typeof turnTypeValues[number];

// Vote type for multi-agent outcomes
export const voteTypeValues = ['winner', 'ranking', 'survival'] as const;
export type VoteType = typeof voteTypeValues[number];

// User tier for access control
export const userTierValues = ['free', 'premium'] as const;
export type UserTier = typeof userTierValues[number];

// Acquisition source for attribution tracking
export const acquisitionSourceValues = [
  'organic',      // Default - unknown/direct visit
  'hn',           // Hacker News
  'reddit',       // Reddit (all subs)
  'twitter',      // Twitter/X
  'producthunt',  // Product Hunt
  'email',        // Newsletter/waitlist blast
  'podcast',      // Podcast mention
  'referral',     // User referral (viral loop)
  'direct',       // Direct link share
  'other',        // Catch-all
] as const;
export type AcquisitionSource = typeof acquisitionSourceValues[number];
