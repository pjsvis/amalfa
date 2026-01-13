import type { GraphGardener } from "@src/core/GraphGardener";

export interface HydratableResult {
	id: string;
	score?: number;
	[key: string]: unknown;
}

export interface HydratedResult extends HydratableResult {
	content: string;
}

export class ContentHydrator {
	constructor(private gardener: GraphGardener) {}

	async hydrate(result: HydratableResult): Promise<HydratedResult> {
		const content = await this.gardener.getContent(result.id);
		return {
			...result,
			content: content || `[Content unavailable for ${result.id}]`,
		};
	}

	async hydrateMany(results: HydratableResult[]): Promise<HydratedResult[]> {
		return Promise.all(results.map((r) => this.hydrate(r)));
	}

	async hydrateTop(
		results: HydratableResult[],
		limit: number,
	): Promise<Array<HydratedResult | HydratableResult>> {
		const topK = results.slice(0, limit);
		const rest = results.slice(limit);

		const hydrated = await this.hydrateMany(topK);
		return [...hydrated, ...rest];
	}
}
