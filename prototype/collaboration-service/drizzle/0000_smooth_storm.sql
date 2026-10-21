CREATE TABLE `capabilities` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`label` text NOT NULL,
	`role` text NOT NULL,
	`scopes_json` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`revoked_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `capabilities_token_hash_unique` ON `capabilities` (`token_hash`);--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`block_id` text NOT NULL,
	`body` text NOT NULL,
	`actor` text NOT NULL,
	`capability_id` text NOT NULL,
	`context_json` text NOT NULL,
	`created_at` text NOT NULL,
	`resolved_at` text,
	`resolved_by` text
);
--> statement-breakpoint
CREATE INDEX `comments_block_time` ON `comments` (`block_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `copy_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`values_json` text DEFAULT '{}' NOT NULL,
	`updated_at` text,
	`operation_id` text
);
--> statement-breakpoint
CREATE TABLE `copy_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`block_id` text NOT NULL,
	`revision` integer NOT NULL,
	`before_json` text NOT NULL,
	`after_json` text NOT NULL,
	`actor` text NOT NULL,
	`capability_id` text NOT NULL,
	`context_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `versions_block_revision` ON `copy_versions` (`block_id`,`revision`);