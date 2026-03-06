ALTER TABLE `edges` ADD `saliency_score` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `edges` ADD `last_access` text DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE `nodes` ADD `confidence_score` real DEFAULT 1;--> statement-breakpoint
ALTER TABLE `nodes` ADD `saliency_score` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `nodes` ADD `last_access` text DEFAULT (CURRENT_TIMESTAMP);