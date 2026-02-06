import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import type { UserTier, AcquisitionSource } from './enums';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // Auth provider fields (nullable for anonymous users)
  authProviderId: text('auth_provider_id'),
  authProvider: text('auth_provider'), // 'google', 'github', etc.
  
  // Profile
  displayName: text('display_name'),
  email: text('email'),
  avatarUrl: text('avatar_url'),
  
  // Anonymous user tracking
  isAnonymous: integer('is_anonymous', { mode: 'boolean' }).notNull().default(true),
  anonSessionId: text('anon_session_id'), // For anonymous user continuity
  
  // Access control
  tier: text('tier').$type<UserTier>().notNull().default('free'),
  
  // Attribution tracking
  acquisitionSource: text('acquisition_source').$type<AcquisitionSource>().notNull().default('organic'),
  acquisitionDetail: text('acquisition_detail'), // Granular: subreddit name, podcast name, etc.
  referrerBoutId: text('referrer_bout_id'), // If they landed from a shared bout link
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  
  // Timestamps (SQLite: stored as ISO strings, Drizzle handles conversion)
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
  lastSeenAt: text('last_seen_at'),
}, (table) => ({
  // Index for auth provider lookups (most common query path)
  authProviderIdx: index('users_auth_provider_idx')
    .on(table.authProvider, table.authProviderId),
  
  // Email lookup (login flow)
  emailIdx: index('users_email_idx').on(table.email),
  
  // Anonymous session lookup
  anonSessionIdx: index('users_anon_session_idx').on(table.anonSessionId),
  
  // Attribution analytics
  acquisitionIdx: index('users_acquisition_source_idx').on(table.acquisitionSource),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
