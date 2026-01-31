import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { AMALFA_DIRS } from "../config/defaults";
import type {
	LangExtractSidecar,
	SidecarManifestEntry,
} from "../types/sidecar";
import { JsonlUtils } from "../utils/JsonlUtils";

export interface LexiconCandidate {
	term: string;
	frequency: number;
	sources: string[]; // UUIDs
	type: "entity" | "concept";
	status: "candidate";
}

export interface LexiconConfig {
	cacheDir: string;
	stopListPath: string;
	outputPath: string;
}

export class LexiconHarvester {
	private candidates = new Map<string, LexiconCandidate>();
	private stopList = new Set<string>();
	private manifest = new Map<string, string>(); // Hash -> Path

	constructor(private config: LexiconConfig) {}

	/**
	 * Load stop-list from file.
	 */
	private async loadStopList() {
		try {
			const file = Bun.file(this.config.stopListPath);
			if (await file.exists()) {
				const content = await file.json();
				if (Array.isArray(content)) {
					content.forEach((t: unknown) => {
						if (typeof t === "string") {
							this.stopList.add(this.normalize(t));
						}
					});
				}
			}
		} catch (_e) {
			console.warn(
				`⚠️  Could not load stop-list from ${this.config.stopListPath}`,
			);
		}
	}

	/**
	 * Load Sidecar Manifest
	 */
	private async loadManifest() {
		const manifestPath = join(AMALFA_DIRS.cache, "manifest.jsonl");
		try {
			if (await Bun.file(manifestPath).exists()) {
				await JsonlUtils.process<SidecarManifestEntry>(
					manifestPath,
					async (entry) => {
						if (entry.hash && entry.path) {
							this.manifest.set(entry.hash, entry.path);
						}
					},
				);
				console.log(`🗺️  Loaded ${this.manifest.size} source mappings.`);
			}
		} catch (_e) {
			console.warn("⚠️  Could not load manifest.jsonl");
		}
	}

	private normalize(term: string): string {
		return term.toLowerCase().trim();
	}

	/**
	 * Run the harvest process.
	 */
	public async harvest() {
		console.log("🌾 Starting Lexicon Harvest...");
		await this.loadStopList();
		await this.loadManifest();

		// Scan directory for .json files (Sidecars)
		const files = (await readdir(this.config.cacheDir)).filter(
			(f) => f.endsWith(".json") && !f.startsWith("."),
		);

		console.log(`📂 Scanning ${files.length} sidecars...`);

		let processed = 0;
		for (const file of files) {
			try {
				const path = join(this.config.cacheDir, file);
				const content = await Bun.file(path).json();
				this.processSidecar(content, file);
				processed++;
			} catch (_e) {
				// Skip bad files
			}
		}

		console.log(`✅ Processed ${processed} files.`);
		console.log(`📊 Found ${this.candidates.size} unique candidates.`);

		await this.writeCandidates();
	}

	private processSidecar(data: LangExtractSidecar, filename: string) {
		const hash = filename.replace(".json", "");
		const sourcePath = this.manifest.get(hash);
		// biome-ignore lint/suspicious/noExplicitAny: uuid not on interface yet
		const sourceId = (data as any).uuid || sourcePath || hash;

		const terms = [
			...(data.entities || []).map((e) => ({
				t: e.name || (typeof e === "string" ? e : String(e)),
				type: "entity",
			})),
			...(data.concepts || []).map((c) => ({
				t: c.name || (typeof c === "string" ? c : String(c)),
				type: "concept",
			})),
		];

		for (const { t, type } of terms) {
			if (!t || typeof t !== "string") continue;

			const normalized = this.normalize(t);
			if (this.stopList.has(normalized)) continue;

			const existing = this.candidates.get(normalized);
			if (existing) {
				existing.frequency++;
				if (!existing.sources.includes(sourceId)) {
					existing.sources.push(sourceId);
				}
			} else {
				this.candidates.set(normalized, {
					term: normalized,
					frequency: 1,
					sources: [sourceId],
					type: type as "entity" | "concept",
					status: "candidate",
				});
			}
		}
	}

	private async writeCandidates() {
		console.log(`💾 Writing candidates to ${this.config.outputPath}...`);

		// Clear output file first
		await Bun.write(this.config.outputPath, "");

		// Convert Map to Array, Sort by Frequency DESC
		const sorted = Array.from(this.candidates.values()).sort(
			(a, b) => b.frequency - a.frequency,
		);

		// Stream write to JSONL
		for (const candidate of sorted) {
			JsonlUtils.append(this.config.outputPath, candidate);
		}

		console.log("✅ Harvest Complete.");
	}
}
