CREATE TABLE `edges` (
	`source` text NOT NULL,
	`target` text NOT NULL,
	`type` text NOT NULL,
	`confidence` real DEFAULT 1,
	`veracity` real DEFAULT 1,
	`context_source` text,
	PRIMARY KEY(`source`, `target`, `type`)
);
--> statement-breakpoint
CREATE INDEX `idx_edges_source` ON `edges` (`source`);--> statement-breakpoint
CREATE INDEX `idx_edges_target` ON `edges` (`target`);--> statement-breakpoint
CREATE TABLE `ember_state` (
	`file_path` text PRIMARY KEY NOT NULL,
	`last_analyzed` text,
	`sidecar_created` integer,
	`confidence` real
);
--> statement-breakpoint
CREATE TABLE `nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text,
	`title` text,
	`domain` text,
	`layer` text,
	`embedding` blob,
	`hash` text,
	`meta` text,
	`date` text
);
