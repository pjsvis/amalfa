CREATE TABLE `edges` (
	`source` text NOT NULL,
	`target` text NOT NULL,
	`type` text NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE TABLE `nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`title` text,
	`content` text,
	`domain` text DEFAULT 'knowledge',
	`layer` text DEFAULT 'experience',
	`order_index` integer DEFAULT 0,
	`metadata` text,
	`external_refs` text,
	`embedding` blob
);
