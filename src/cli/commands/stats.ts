import { readdirSync, statSync, statSync as statSyncFs } from "node:fs";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadConfig } from "@src/config/defaults";
import { ResonanceDB } from "@src/resonance/db";
import { StatsTracker } from "@src/utils/StatsTracker";
import { checkDatabase, getDbPath } from "../utils";

export async function cmdStats(args: string[]) {
	// Check database exists
	if (!(await checkDatabase())) {
		process.exit(1);
	}

	// Import database wrapper
	const dbPath = await getDbPath();

	const db = new ResonanceDB(dbPath);
	const config = await loadConfig();
	const sources = config.sources || ["./docs"];

	try {
		const stats = db.getStats();
		const dbStats = statSync(dbPath);
		const fileSizeMB = (dbStats.size / 1024 / 1024).toFixed(2);

		// Check for stale files
		let newerFiles = 0;
		let newestFileDate = new Date(0);

		function scan(dir: string) {
			if (!existsSync(dir)) return;
			const entries = readdirSync(dir, { withFileTypes: true });
			for (const entry of entries) {
				const fullPath = join(dir, entry.name);
				if (entry.name.startsWith(".")) continue;

				if (entry.isDirectory()) {
					scan(fullPath);
				} else if (entry.name.endsWith(".md")) {
					const mtime = statSyncFs(fullPath).mtime;
					if (mtime > dbStats.mtime) {
						newerFiles++;
					}
					if (mtime > newestFileDate) {
						newestFileDate = mtime;
					}
				}
			}
		}

		for (const source of sources) {
			scan(join(process.cwd(), source));
		}

		const isStale = newerFiles > 0;
		const statusIcon = isStale ? "⚠️  STALE" : "✅ FRESH";

		let orphanSection = "";
		if (args.includes("--orphans")) {
			const orphanSql = `
                SELECT n.id, n.type
                FROM nodes n
                LEFT JOIN edges e1 ON n.id = e1.source
                LEFT JOIN edges e2 ON n.id = e2.target
                WHERE e1.source IS NULL AND e2.target IS NULL
                  AND n.type != 'root' -- Exclude root
                  AND n.type != 'domain' -- Exclude domain markers
            `;
			const orphans = db.getRawDb().query(orphanSql).all() as {
				id: string;
				type: string;
			}[];

			if (orphans.length > 0) {
				const orphanRate = ((orphans.length / stats.nodes) * 100).toFixed(1);
				orphanSection = `\nOrphans:    ${orphans.length} (${orphanRate}%) - Run 'amalfa ember scan' to fix`;
			} else {
				orphanSection = "\nOrphans:    0 (Graph is fully connected)";
			}
		}

		console.log(`
📊 AMALFA Database Statistics

Database: ${dbPath}
Status:   ${statusIcon}
Size:     ${fileSizeMB} MB

Nodes:      ${stats.nodes.toLocaleString()}
Edges:      ${stats.edges.toLocaleString()}
Embeddings: ${stats.vectors.toLocaleString()} (384-dim)${orphanSection}

Sources:       ${sources.join(", ")}
DB Modified:   ${new Date(dbStats.mtime).toISOString()}
Latest File:   ${newestFileDate.toISOString()}
Stale Files:   ${newerFiles}

${isStale ? "⚠️  ACTION REQUIRED: Run 'amalfa init' or start 'amalfa daemon' to update!" : "🔍 System is up to date."}
`);
	} catch (error) {
		console.error("❌ Failed to read database statistics:", error);
		process.exit(1);
	} finally {
		db.close();
	}
}
