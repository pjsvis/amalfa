-- Add source column for indexed file path lookups
ALTER TABLE `nodes` ADD `source` text;

-- Index for fast source-based lookups (replaces meta LIKE queries)
CREATE INDEX IF NOT EXISTS `nodes_source_idx` ON `nodes` (`source`);

-- Backfill source column from existing meta JSON
UPDATE `nodes` SET `source` = json_extract(`meta`, '$.source') WHERE `meta` IS NOT NULL;
