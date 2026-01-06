import type { Database } from "bun:sqlite";

export const LouvainGate = {
	/**
	 * Checks if an edge between source and target should be allowed based on Local Modularity.
	 * Rule: If target is a "Super Node" (> threshold edges) AND source shares NO neighbors with it,
	 * the edge is rejected (triadic closure required for super nodes).
	 *
	 * @param db The SQLite database instance
	 * @param source The source node ID
	 * @param target The target node ID
	 * @param threshold The degree threshold to consider a node a "Super Node" (default 50)
	 * @returns boolean - true if edge is allowed, false if rejected
	 */
	check(
		db: Database,
		source: string,
		target: string,
		threshold = 50,
	): { allowed: boolean; reason?: string } {
		// 1. Check if target is a Super Node
		const isSuper = this.isSuperNode(db, target, threshold);

		if (isSuper) {
			// 2. Check for Triadic Closure (Shared Neighbor)
			const shares = this.sharesNeighbor(db, source, target);
			if (!shares) {
				return {
					allowed: false,
					reason: `Rejected edge ${source} -> ${target} due to low modularity (Target is SuperNode with ${threshold}+ edges and 0 shared neighbors).`,
				};
			}
		}

		return { allowed: true };
	},

	isSuperNode(db: Database, id: string, threshold: number): boolean {
		const result = db
			.query("SELECT COUNT(*) as c FROM edges WHERE target = ? OR source = ?")
			.get(id, id) as { c: number };
		return result.c > threshold;
	},

	sharesNeighbor(db: Database, a: string, b: string): boolean {
		// Check for any common neighbor 'n' such that a-n and b-n exist
		const result = db
			.query(
				`
            SELECT 1 as exists_flag FROM edges e1 
            JOIN edges e2 ON (
                (e1.target = e2.target) OR 
                (e1.source = e2.source) OR 
                (e1.target = e2.source) OR 
                (e1.source = e2.target)
            )
            WHERE 
                (e1.source = ? OR e1.target = ?) AND
                (e2.source = ? OR e2.target = ?)
            LIMIT 1
            `,
			)
			.get(a, a, b, b) as { exists_flag: number } | null;

		return !!result;
	},
};
