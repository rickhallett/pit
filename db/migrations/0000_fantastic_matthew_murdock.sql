CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`auth_provider_id` text,
	`auth_provider` text,
	`display_name` text,
	`email` text,
	`avatar_url` text,
	`is_anonymous` integer DEFAULT true NOT NULL,
	`anon_session_id` text,
	`tier` text DEFAULT 'free' NOT NULL,
	`acquisition_source` text DEFAULT 'organic' NOT NULL,
	`acquisition_detail` text,
	`referrer_bout_id` text,
	`utm_source` text,
	`utm_medium` text,
	`utm_campaign` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`last_seen_at` text
);
--> statement-breakpoint
CREATE INDEX `users_auth_provider_idx` ON `users` (`auth_provider`,`auth_provider_id`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_anon_session_idx` ON `users` (`anon_session_id`);--> statement-breakpoint
CREATE INDEX `users_acquisition_source_idx` ON `users` (`acquisition_source`);--> statement-breakpoint
CREATE TABLE `bout_agents` (
	`id` text PRIMARY KEY NOT NULL,
	`bout_id` text NOT NULL,
	`agent_name` text NOT NULL,
	`agent_role` text,
	`turn_order` integer NOT NULL,
	`is_initiator` integer DEFAULT false NOT NULL,
	`model_provider` text NOT NULL,
	`model_id` text NOT NULL,
	`persona_config` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`bout_id`) REFERENCES `bouts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `bout_agents_bout_id_idx` ON `bout_agents` (`bout_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `bout_agents_bout_turn_idx` ON `bout_agents` (`bout_id`,`turn_order`);--> statement-breakpoint
CREATE TABLE `bouts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`preset_id` text NOT NULL,
	`share_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`topic` text NOT NULL,
	`max_messages` integer DEFAULT 20 NOT NULL,
	`current_round` integer DEFAULT 0 NOT NULL,
	`metadata` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`preset_id`) REFERENCES `presets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bouts_share_id_unique` ON `bouts` (`share_id`);--> statement-breakpoint
CREATE INDEX `bouts_user_id_idx` ON `bouts` (`user_id`);--> statement-breakpoint
CREATE INDEX `bouts_preset_id_idx` ON `bouts` (`preset_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `bouts_share_id_idx` ON `bouts` (`share_id`);--> statement-breakpoint
CREATE INDEX `bouts_status_idx` ON `bouts` (`status`);--> statement-breakpoint
CREATE INDEX `bouts_created_at_idx` ON `bouts` (`created_at`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`bout_id` text NOT NULL,
	`bout_agent_id` text NOT NULL,
	`content` text NOT NULL,
	`turn_number` integer NOT NULL,
	`round_number` integer NOT NULL,
	`input_tokens` integer,
	`output_tokens` integer,
	`duration_ms` integer,
	`is_error` integer DEFAULT false NOT NULL,
	`error_message` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`bout_id`) REFERENCES `bouts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`bout_agent_id`) REFERENCES `bout_agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `messages_bout_id_idx` ON `messages` (`bout_id`);--> statement-breakpoint
CREATE INDEX `messages_bout_agent_idx` ON `messages` (`bout_agent_id`);--> statement-breakpoint
CREATE INDEX `messages_bout_turn_idx` ON `messages` (`bout_id`,`turn_number`);--> statement-breakpoint
CREATE TABLE `presets` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`agent_count` integer NOT NULL,
	`turn_type` text NOT NULL,
	`agent_roles` text,
	`free_tier_access` integer DEFAULT false NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` text PRIMARY KEY NOT NULL,
	`bout_id` text NOT NULL,
	`vote_type` text NOT NULL,
	`winner_agent_id` text,
	`ranking` text,
	`survivors` text,
	`user_id` text,
	`ip_hash` text,
	`rationale` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`bout_id`) REFERENCES `bouts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`winner_agent_id`) REFERENCES `bout_agents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `votes_bout_id_idx` ON `votes` (`bout_id`);--> statement-breakpoint
CREATE INDEX `votes_bout_created_idx` ON `votes` (`bout_id`,`created_at`);