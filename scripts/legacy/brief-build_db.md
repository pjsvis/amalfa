```markdown
2. Ingestor Logic (ETL)
File: scripts/build_db.ts

Step A: Database Migration Update the CREATE TABLE statement for nodes to include a new column.

Old: id TEXT PRIMARY KEY, label TEXT, type TEXT, definition TEXT

New: id TEXT PRIMARY KEY, label TEXT, type TEXT, definition TEXT, external_refs TEXT

Step B: Processing Logic

Read the new external_refs array from the source JSON.

Serialize the array using JSON.stringify().

Update the INSERT statement to bind this JSON string to the new column.

Fallback: If no refs exist, store an empty array [] or null.
```
