import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import type { BoutStatus, TurnType, VoteType } from './enums';
import { users } from './users';

/**
 * Presets — format definitions for bout types
 * Populated via seed, not user-created (MVP)
 */
export const presets = sqliteTable('presets', {
  id: text('id').primaryKey(), // 'roast_battle', 'shark_pit', etc.
  
  name: text('name').notNull(),
  description: text('description'),
  
  // Agent configuration
  agentCount: integer('agent_count').notNull(), // 2, 3, or 4
  turnType: text('turn_type').$type<TurnType>().notNull(),
  
  // Default agent roles (stored as JSON string, parsed in app)
  // Shape: { slots: [{ name, role, isInitiator }] }
  agentRoles: text('agent_roles', { mode: 'json' }).$type<{
    slots: Array<{
      name: string;
      role: string;
      isInitiator: boolean;
    }>;
  }>(),
  
  // Access control
  freeTierAccess: integer('free_tier_access', { mode: 'boolean' }).notNull().default(false),
  
  // Ordering for UI
  displayOrder: integer('display_order').notNull().default(0),
  
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

/**
 * Core bout table — multi-agent arena
 */
export const bouts = sqliteTable('bouts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // Ownership
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  
  // Format
  presetId: text('preset_id').notNull().references(() => presets.id),
  
  // Sharing
  shareId: text('share_id').unique(),
  
  // Lifecycle
  status: text('status').$type<BoutStatus>().notNull().default('pending'),
  
  // The prompt/topic that started it
  topic: text('topic').notNull(),
  
  // Round/message limits
  maxMessages: integer('max_messages').notNull().default(20),
  currentRound: integer('current_round').notNull().default(0),
  
  // Metadata (stored as JSON)
  metadata: text('metadata', { mode: 'json' }).$type<{
    clientVersion?: string;
    userAgent?: string;
    tags?: string[];
  }>(),
  
  // Timestamps
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
  completedAt: text('completed_at'),
}, (table) => ({
  userIdIdx: index('bouts_user_id_idx').on(table.userId),
  presetIdIdx: index('bouts_preset_id_idx').on(table.presetId),
  shareIdIdx: uniqueIndex('bouts_share_id_idx').on(table.shareId),
  statusIdx: index('bouts_status_idx').on(table.status),
  createdAtIdx: index('bouts_created_at_idx').on(table.createdAt),
}));

/**
 * Bout agents — junction table linking agents to bouts
 * Defines the roster and turn order for each bout
 */
export const boutAgents = sqliteTable('bout_agents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  boutId: text('bout_id').notNull().references(() => bouts.id, { onDelete: 'cascade' }),
  
  // Agent identity
  agentName: text('agent_name').notNull(),
  agentRole: text('agent_role'), // System prompt for this agent
  
  // Turn mechanics
  turnOrder: integer('turn_order').notNull(), // 0-indexed position in rotation
  isInitiator: integer('is_initiator', { mode: 'boolean' }).notNull().default(false),
  
  // Model assignment (hidden from user until reveal)
  modelProvider: text('model_provider').notNull(),
  modelId: text('model_id').notNull(),
  
  // Per-agent overrides (stored as JSON)
  personaConfig: text('persona_config', { mode: 'json' }).$type<{
    temperature?: number;
    maxTokens?: number;
    style?: string;
  }>(),
  
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (table) => ({
  boutIdIdx: index('bout_agents_bout_id_idx').on(table.boutId),
  boutTurnIdx: uniqueIndex('bout_agents_bout_turn_idx').on(table.boutId, table.turnOrder),
}));

/**
 * Messages — individual agent responses in a bout
 */
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  boutId: text('bout_id').notNull().references(() => bouts.id, { onDelete: 'cascade' }),
  boutAgentId: text('bout_agent_id').notNull().references(() => boutAgents.id, { onDelete: 'cascade' }),
  
  // Message content
  content: text('content').notNull(),
  
  // Sequence tracking
  turnNumber: integer('turn_number').notNull(), // Global turn within bout
  roundNumber: integer('round_number').notNull(), // Which round (for round_robin)
  
  // Token metrics
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  durationMs: integer('duration_ms'),
  
  // Error tracking
  isError: integer('is_error', { mode: 'boolean' }).notNull().default(false),
  errorMessage: text('error_message'),
  
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (table) => ({
  boutIdIdx: index('messages_bout_id_idx').on(table.boutId),
  boutAgentIdx: index('messages_bout_agent_idx').on(table.boutAgentId),
  boutTurnIdx: index('messages_bout_turn_idx').on(table.boutId, table.turnNumber),
}));

/**
 * Votes — user judgments on bout outcomes
 * Supports winner, ranking, and survival vote types
 */
export const votes = sqliteTable('votes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  boutId: text('bout_id').notNull().references(() => bouts.id, { onDelete: 'cascade' }),
  
  voteType: text('vote_type').$type<VoteType>().notNull(),
  
  // For 'winner' type
  winnerAgentId: text('winner_agent_id').references(() => boutAgents.id),
  
  // For 'ranking' type — ordered array of agent IDs (stored as JSON)
  ranking: text('ranking', { mode: 'json' }).$type<string[]>(),
  
  // For 'survival' type — array of surviving agent IDs (stored as JSON)
  survivors: text('survivors', { mode: 'json' }).$type<string[]>(),
  
  // Voter tracking
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  ipHash: text('ip_hash'), // Anonymous tracking
  
  // Optional rationale
  rationale: text('rationale'),
  
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (table) => ({
  boutIdIdx: index('votes_bout_id_idx').on(table.boutId),
  boutCreatedIdx: index('votes_bout_created_idx').on(table.boutId, table.createdAt),
}));

// ============================================================================
// Relations
// ============================================================================

export const presetsRelations = relations(presets, ({ many }) => ({
  bouts: many(bouts),
}));

export const boutsRelations = relations(bouts, ({ one, many }) => ({
  user: one(users, {
    fields: [bouts.userId],
    references: [users.id],
  }),
  preset: one(presets, {
    fields: [bouts.presetId],
    references: [presets.id],
  }),
  agents: many(boutAgents),
  messages: many(messages),
  votes: many(votes),
}));

export const boutAgentsRelations = relations(boutAgents, ({ one, many }) => ({
  bout: one(bouts, {
    fields: [boutAgents.boutId],
    references: [bouts.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  bout: one(bouts, {
    fields: [messages.boutId],
    references: [bouts.id],
  }),
  agent: one(boutAgents, {
    fields: [messages.boutAgentId],
    references: [boutAgents.id],
  }),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  bout: one(bouts, {
    fields: [votes.boutId],
    references: [bouts.id],
  }),
  winnerAgent: one(boutAgents, {
    fields: [votes.winnerAgentId],
    references: [boutAgents.id],
  }),
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// Types
// ============================================================================

export type Preset = typeof presets.$inferSelect;
export type NewPreset = typeof presets.$inferInsert;
export type Bout = typeof bouts.$inferSelect;
export type NewBout = typeof bouts.$inferInsert;
export type BoutAgent = typeof boutAgents.$inferSelect;
export type NewBoutAgent = typeof boutAgents.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
