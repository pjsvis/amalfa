import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

console.log("Starting term extraction...");

// --- Path Resolution ---
import settings from "@/polyvis.settings.json";

// Reading from Resonance DB
const dbPath = join(process.cwd(), settings.paths.database.resonance);
const publicDir = join(process.cwd(), "public");
const outputPath = join(publicDir, "terms.json");

// --- Pre-flight Checks ---
if (!existsSync(dbPath)) {
	console.error(`❌ Error: Database not found at ${dbPath}`);
	console.error("Please run 'bun run scripts/build_db.ts' first.");
	process.exit(1);
}

// Ensure the 'public' directory exists before trying to write to it.
if (!existsSync(publicDir)) {
	console.log(`Creating 'public' directory at ${publicDir}...`);
	mkdirSync(publicDir, { recursive: true });
}

import { DatabaseFactory } from "@src/resonance/DatabaseFactory";

// --- Database Query ---
// Open the database in read-only mode, using Factory for safe concurrency config
const db = DatabaseFactory.connect(dbPath, { readonly: true });

// This query identifies the most "valuable" terms by counting how many
// connections (edges) they have. Terms that are more connected are likely
// more central to the knowledge graph and will yield richer results.
const query = `
  SELECT
    n.title
  FROM
    nodes n
  JOIN (
    -- First, for each node ID, count its number of DISTINCT neighbors
    SELECT
        id,
        COUNT(DISTINCT neighbor) as neighbor_count
    FROM (
        -- Create a unified list of all connections (id -> neighbor)
        SELECT source as id, target as neighbor FROM edges
        UNION
        SELECT target as id, source as neighbor FROM edges
    )
    GROUP BY id
  ) AS counts ON n.id = counts.id
  WHERE
    -- Only include nodes that have 2 or more distinct neighbors
    counts.neighbor_count >= 2
  ORDER BY
    counts.neighbor_count DESC, n.title ASC;
`;

try {
	// --- Data Extraction & Transformation ---
	console.log("Querying database for high-value terms...");
	const results = db.query(query).all() as { title: string }[];

	// We just want an array of the term labels.
	const terms = results.map((row) => row.title);

	if (terms.length === 0) {
		console.warn(
			"⚠️ Warning: Query returned no terms. The resulting file will be an empty array.",
		);
	}

	// --- File Output ---
	// Write the curated list of terms to a static JSON file.
	// This file can be easily fetched by the frontend.
	await Bun.write(outputPath, JSON.stringify(terms, null, 2));

	console.log(
		`✅ Successfully extracted and wrote ${terms.length} terms to ${outputPath}`,
	);
} catch (error) {
	console.error(`❌ An error occurred: ${error}`);
} finally {
	// --- Finalization ---
	db.close();
	console.log("Term extraction complete.");
}
