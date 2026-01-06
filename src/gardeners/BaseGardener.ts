import type { ResonanceDB } from "@src/resonance/db";
import { getLogger, type Logger } from "@src/utils/Logger";

export interface Candidate {
	nodeId: string;
	filePath: string;
	content: string;
	type: string;
}

export abstract class BaseGardener {
	protected db: ResonanceDB;
	protected log: Logger;

	constructor(db: ResonanceDB) {
		this.db = db;
		// We use a generic name initially, subclasses can override or we rely on 'name' property later
		// Actually, we can't access 'this.name' safely in constructor if it's a property.
		// Let's use "Gardener" as the component.
		this.log = getLogger("Gardener");
	}

	abstract name: string;

	/**
	 * Finds candidates that need attention.
	 */
	abstract scan(limit: number): Promise<Candidate[]>;

	/**
	 * Applies changes to a single candidate.
	 */
	abstract cultivate(candidate: Candidate): Promise<void>;

	/**
	 * Main loop.
	 */
	public async run(limit: number = 10) {
		this.log.info({ gardener: this.name }, "🌿 Gardener starting...");
		const candidates = await this.scan(limit);
		this.log.info(
			{ gardener: this.name, count: candidates.length },
			"Found candidates",
		);

		for (const candidate of candidates) {
			this.log.debug(
				{ gardener: this.name, nodeId: candidate.nodeId },
				"Processing candidate",
			);
			await this.cultivate(candidate);
		}
		this.log.info({ gardener: this.name }, "✅ Gardener finished");
	}
}
