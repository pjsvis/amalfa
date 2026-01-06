/**
 * Run Louvain Community Detection and persist to ResonanceDB.
 *
 * 1. Python computes communities -> community_partition.json
 * 2. TypeScript loads partition into ResonanceDB (centralized access)
 *
 * Usage:
 *   bun run scripts/run-community-detection.ts
 *   bun run scripts/run-community-detection.ts --resolution 0.5
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";

const VENV_PYTHON = join(process.cwd(), "ingest", ".venv", "bin", "python");
const SCRIPT = join(process.cwd(), "ingest", "calc_communities.py");
const PARTITION_FILE = join(
	process.cwd(),
	"ingest",
	"community_partition.json",
);

async function main() {
	const resolution = process.argv.includes("--resolution")
		? process.argv[process.argv.indexOf("--resolution") + 1]
		: "1.0";

	console.log("🧠 Running Louvain Community Detection\n");

	// Step 1: Run Python to compute communities
	try {
		const result =
			await $`${VENV_PYTHON} ${SCRIPT} --resolution ${resolution}`.quiet();
		console.log(result.stdout.toString());

		if (result.exitCode !== 0) {
			console.error(result.stderr.toString());
			process.exit(1);
		}
	} catch (error) {
		console.error("❌ Community detection failed:", error);
		process.exit(1);
	}

	// Step 2: Load partition JSON
	if (!existsSync(PARTITION_FILE)) {
		console.error("❌ Partition file not found:", PARTITION_FILE);
		process.exit(1);
	}

	interface PartitionData {
		partition: Record<string, number>;
		stats: {
			total_nodes: number;
			misc_nodes: number;
			misc_ratio: number;
			connectivity_health: number;
			num_communities: number;
			num_components: number;
			main_components: number;
		};
	}

	const data = (await Bun.file(PARTITION_FILE).json()) as PartitionData;
	const partition = data.partition;
	const stats = data.stats;

	console.log(
		`\n📥 Loaded partition with ${Object.keys(partition).length} nodes`,
	);
	console.log(`   Communities: ${stats.num_communities}`);
	console.log(
		`   Misc nodes: ${stats.misc_nodes} (${(stats.misc_ratio * 100).toFixed(1)}%)`,
	);
	console.log(
		`   Connectivity Health: ${stats.connectivity_health.toFixed(1)}%`,
	);

	// Step 3: Persist to ResonanceDB using centralized access
	console.log("💾 Persisting to ResonanceDB...");

	const { ResonanceDB } = await import("@src/resonance/db");
	const db = ResonanceDB.init();

	// Force checkpoint to clear any locks from Python
	db.checkpoint();

	let updateCount = 0;
	let skipCount = 0;

	// Use prepared statement for efficiency
	const updateStmt = db
		.getRawDb()
		.prepare("UPDATE nodes SET meta = $meta WHERE id = $id");

	try {
		for (const [nodeId, communityId] of Object.entries(partition)) {
			// Get current meta
			const rows = db
				.getRawDb()
				.query("SELECT meta FROM nodes WHERE id = ?")
				.all(nodeId) as Array<{ meta: string | null }>;

			if (rows.length > 0 && rows[0]) {
				const meta = rows[0].meta ? JSON.parse(rows[0].meta) : {};
				meta.community = communityId;

				updateStmt.run({ $meta: JSON.stringify(meta), $id: nodeId });
				updateCount++;
			} else {
				skipCount++;
			}
		}
		db.checkpoint();
	} catch (error) {
		console.error("❌ Error during persistence:", error);
	}

	console.log(`   ✅ Updated ${updateCount} nodes with community IDs`);
	if (skipCount > 0) {
		console.log(
			`   ⚠️ Skipped ${skipCount} edge-only nodes (not in nodes table)`,
		);
	}

	// Step 4: Verify
	console.log("\n🔍 Verifying...");

	const nodesWithCommunity = db
		.getRawDb()
		.query(`
		SELECT COUNT(*) as count FROM nodes 
		WHERE meta LIKE '%"community":%'
	`)
		.get() as { count: number };

	const communityCount = db
		.getRawDb()
		.query(`
		SELECT COUNT(DISTINCT json_extract(meta, '$.community')) as count
		FROM nodes
		WHERE meta LIKE '%"community":%'
	`)
		.get() as { count: number };

	console.log(`   Nodes with community: ${nodesWithCommunity.count}`);
	console.log(`   Distinct communities: ${communityCount.count}`);

	db.close();
	console.log("\n✅ Done!");
}

main();
