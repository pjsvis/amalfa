import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { AMALFA_DIRS } from "@src/config/defaults";

export interface DatabaseSnapshot {
	timestamp: string;
	nodes: number;
	edges: number;
	embeddings: number;
	dbSizeMB: number;
	version?: string;
}

export interface StatsHistory {
	snapshots: DatabaseSnapshot[];
	created: string;
	lastUpdated: string;
}

/**
 * Tracks database statistics over time for health monitoring
 * and pre-publish validation gates
 */
export class StatsTracker {
	private statsFile: string;

	constructor() {
		this.statsFile = join(AMALFA_DIRS.base, "stats-history.json");
	}

	/**
	 * Load historical stats from disk
	 */
	private loadHistory(): StatsHistory {
		if (!existsSync(this.statsFile)) {
			return {
				snapshots: [],
				created: new Date().toISOString(),
				lastUpdated: new Date().toISOString(),
			};
		}

		try {
			const content = Bun.file(this.statsFile).text();
			return JSON.parse(content as unknown as string) as StatsHistory;
		} catch {
			// If file is corrupted, start fresh
			return {
				snapshots: [],
				created: new Date().toISOString(),
				lastUpdated: new Date().toISOString(),
			};
		}
	}

	/**
	 * Save historical stats to disk
	 */
	private async saveHistory(history: StatsHistory): Promise<void> {
		// Ensure .amalfa directory exists
		if (!existsSync(AMALFA_DIRS.base)) {
			mkdirSync(AMALFA_DIRS.base, { recursive: true });
		}

		await Bun.write(this.statsFile, JSON.stringify(history, null, 2));
	}

	/**
	 * Record a new database snapshot
	 */
	async recordSnapshot(snapshot: DatabaseSnapshot): Promise<void> {
		const history = this.loadHistory();

		// Add timestamp if not provided
		if (!snapshot.timestamp) {
			snapshot.timestamp = new Date().toISOString();
		}

		history.snapshots.push(snapshot);
		history.lastUpdated = snapshot.timestamp;

		// Keep only last 100 snapshots to avoid unbounded growth
		if (history.snapshots.length > 100) {
			history.snapshots = history.snapshots.slice(-100);
		}

		await this.saveHistory(history);
	}

	/**
	 * Get the most recent snapshot
	 */
	getLatestSnapshot(): DatabaseSnapshot | null {
		const history = this.loadHistory();
		return history.snapshots.length > 0
			? (history.snapshots[history.snapshots.length - 1] ?? null)
			: null;
	}

	/**
	 * Get all snapshots
	 */
	getAllSnapshots(): DatabaseSnapshot[] {
		const history = this.loadHistory();
		return history.snapshots;
	}

	/**
	 * Validate current database state against history
	 * Returns validation result with any warnings or errors
	 */
	validate(current: DatabaseSnapshot): {
		valid: boolean;
		warnings: string[];
		errors: string[];
	} {
		const warnings: string[] = [];
		const errors: string[] = [];

		// Critical: Database must have content
		if (current.nodes === 0) {
			errors.push("Database has 0 nodes - database is empty");
		}

		if (current.embeddings === 0) {
			errors.push("Database has 0 embeddings - vector search will not work");
		}

		// Get previous snapshot for comparison
		const latest = this.getLatestSnapshot() ?? null;
		if (latest) {
			// Warning: Significant regression in metrics
			if (current.nodes < latest.nodes * 0.8) {
				warnings.push(
					`Node count decreased significantly: ${latest.nodes} → ${current.nodes} (-${Math.round(((latest.nodes - current.nodes) / latest.nodes) * 100)}%)`,
				);
			}

			if (current.edges < latest.edges * 0.8) {
				warnings.push(
					`Edge count decreased significantly: ${latest.edges} → ${current.edges} (-${Math.round(((latest.edges - current.edges) / latest.edges) * 100)}%)`,
				);
			}

			// Info: Metrics should generally increase over time
			if (current.nodes === latest.nodes && current.edges === latest.edges) {
				warnings.push(
					"No growth in nodes or edges since last snapshot - is documentation being updated?",
				);
			}
		}

		// Edge density check: edges should be proportional to nodes
		const edgeDensity = current.nodes > 0 ? current.edges / current.nodes : 0;
		if (edgeDensity < 0.1) {
			warnings.push(
				`Low edge density: ${edgeDensity.toFixed(2)} edges per node - documents may be poorly linked`,
			);
		}

		// Embedding coverage check
		if (current.embeddings < current.nodes * 0.9) {
			warnings.push(
				`Only ${Math.round((current.embeddings / current.nodes) * 100)}% of nodes have embeddings - some nodes may not be searchable`,
			);
		}

		return {
			valid: errors.length === 0,
			warnings,
			errors,
		};
	}

	/**
	 * Get stats file path for external access
	 */
	getStatsFilePath(): string {
		return this.statsFile;
	}

	/**
	 * Display a summary of historical trends
	 */
	getSummary(): string {
		const history = this.loadHistory();
		if (history.snapshots.length === 0) {
			return "No historical data available";
		}

		const latest = history.snapshots[history.snapshots.length - 1] ?? null;
		const oldest = history.snapshots[0] ?? null;

		if (!latest || !oldest) {
			return "Insufficient data for growth summary";
		}

		const nodeGrowth = latest.nodes - oldest.nodes;
		const edgeGrowth = latest.edges - oldest.edges;

		const summary = [
			"📈 Database Growth Summary",
			`   First snapshot: ${new Date(oldest.timestamp).toLocaleString()}`,
			`   Latest snapshot: ${new Date(latest.timestamp).toLocaleString()}`,
			`   Total snapshots: ${history.snapshots.length}`,
			"",
			"📊 Current State:",
			`   Nodes: ${latest.nodes} (${nodeGrowth >= 0 ? "+" : ""}${nodeGrowth} from first)`,
			`   Edges: ${latest.edges} (${edgeGrowth >= 0 ? "+" : ""}${edgeGrowth} from first)`,
			`   Embeddings: ${latest.embeddings}`,
			`   Database size: ${latest.dbSizeMB.toFixed(2)} MB`,
		];

		return summary.join("\n");
	}
}
