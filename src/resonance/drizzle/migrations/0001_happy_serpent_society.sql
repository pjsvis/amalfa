CREATE TABLE `history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`old_value` text,
	`new_value` text,
	`timestamp` text DEFAULT (CURRENT_TIMESTAMP)
);
