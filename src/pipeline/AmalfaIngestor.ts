/**
 * AMALFA Ingestor
 * Simplified ingestion pipeline for markdown files
 * No Persona/CDA complexity - just pure markdown → knowledge graph
 */

import { join } from "node:path";
import { Glob } from "bun";
import type { AmalfaConfig } from "@src/config/defaults";
import { EdgeWeaver } from "@src/core/EdgeWeaver";
import { ResonanceDB, type Node } from "@src/resonance/db";
import { Embedder } from "@src/resonance/services/embedder";
import { SimpleTokenizerService as TokenizerService } from "@src/resonance/services/simpleTokenizer";
import { getLogger } from "@src/utils/Logger";

export interface IngestionResult {
	success: boolean;
	stats: {
		files: number;
		nodes: number;
		edges: number;
		vectors: number;
		durationSec: number;
	};
}

export class AmalfaIngestor {
	private log = getLogger("AmalfaIngestor");

	constructor(
		private config: AmalfaConfig,
		private db: ResonanceDB,
	) {}

	/**
	 * Ingest all markdown files from source directory
	 */
	async ingest(): Promise<IngestionResult> {
		const startTime = performance.now();
		
		const sources = this.config.sources || ["./docs"];
		this.log.info(`📚 Starting ingestion from: ${sources.join(", ")}`);

		try {
			// Initialize embedder
			const embedder = Embedder.getInstance();
			await embedder.embed("init"); // Warm up

			const tokenizer = TokenizerService.getInstance();
			
			// Discover markdown files
			const files = await this.discoverFiles();
			this.log.info(`📁 Found ${files.length} markdown files`);

			if (files.length === 0) {
				this.log.warn("⚠️  No markdown files found");
				return {
					success: true,
					stats: {
						files: 0,
						nodes: 0,
						edges: 0,
						vectors: 0,
						durationSec: 0,
					},
				};
			}

			// Build lexicon from existing nodes (for EdgeWeaver)
			const lexicon = this.buildLexicon();
			const weaver = new EdgeWeaver(this.db, lexicon);

			// Process files in batches
			const BATCH_SIZE = 50;
			let processedCount = 0;

		for (let i = 0; i < files.length; i++) {
			const filePath = files[i];
			if (!filePath) continue;

			// Start batch transaction
			if (i % BATCH_SIZE === 0) {
				this.db.beginTransaction();
			}

			await this.processFile(filePath, embedder, weaver, tokenizer);
			processedCount++;

				// Progress indicator
				if (processedCount % 10 === 0 || processedCount === files.length) {
					const pct = Math.round((processedCount / files.length) * 100);
					console.log(`  ${pct}% (${processedCount}/${files.length})`);
				}

				// Commit batch
				if ((i + 1) % BATCH_SIZE === 0 || i === files.length - 1) {
					this.db.commit();
				}
			}

			// Force WAL checkpoint for persistence
			this.log.info("💾 Forcing WAL checkpoint...");
			this.db.getRawDb().run("PRAGMA wal_checkpoint(TRUNCATE);");

			const endTime = performance.now();
			const durationSec = (endTime - startTime) / 1000;

			const stats = this.db.getStats();
			this.log.info({
				files: processedCount,
				nodes: stats.nodes,
				edges: stats.edges,
				vectors: stats.vectors,
				durationSec: durationSec.toFixed(2),
			}, "✅ Ingestion complete");

			return {
				success: true,
				stats: {
					files: processedCount,
					nodes: stats.nodes,
					edges: stats.edges,
					vectors: stats.vectors,
					durationSec,
				},
			};
		} catch (e) {
			this.log.error({ err: e }, "❌ Ingestion failed");
			return {
				success: false,
				stats: {
					files: 0,
					nodes: 0,
					edges: 0,
					vectors: 0,
					durationSec: 0,
				},
			};
		}
	}

	/**
	 * Discover all markdown files from all source directories
	 */
	private async discoverFiles(): Promise<string[]> {
		const files: string[] = [];
		const glob = new Glob("**/*.md");
		const sources = this.config.sources || ["./docs"];

		// Scan each source directory
		for (const source of sources) {
			const sourcePath = join(process.cwd(), source);

			try {
				for (const file of glob.scanSync(sourcePath)) {
					// Filter out excluded patterns
					const shouldExclude = this.config.excludePatterns.some((pattern) =>
						file.includes(pattern),
					);

					if (!shouldExclude) {
						files.push(join(sourcePath, file));
					}
				}
			} catch (e) {
				this.log.warn({ source: sourcePath, err: e }, "⚠️  Failed to scan directory");
			}
		}

		return files;
	}

	/**
	 * Build lexicon from existing nodes (for edge weaving)
	 */
	private buildLexicon(): { id: string; title: string; aliases: string[] }[] {
		try {
			const nodes = this.db.getNodes({ excludeContent: true });
			return nodes.map((node) => ({
				id: node.id,
				title: node.label || node.id,
				aliases: [],
			}));
		} catch {
			return [];
		}
	}

	/**
	 * Process a single markdown file
	 */
	private async processFile(
		filePath: string,
		embedder: Embedder,
		weaver: EdgeWeaver,
		tokenizer: TokenizerService,
	): Promise<void> {
		try {
			const content = await Bun.file(filePath).text();

			// Parse frontmatter
			const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
			const frontmatter = fmMatch?.[1]
				? this.parseFrontmatter(fmMatch[1])
				: {};

			// Generate ID from filename
			const filename = filePath.split("/").pop() || "unknown";
			const id = filename
				.replace(".md", "")
				.toLowerCase()
				.replace(/[^a-z0-9-]/g, "-");

			// Skip if content unchanged (hash check)
			const hasher = new Bun.CryptoHasher("md5");
			hasher.update(content.trim());
			const currentHash = hasher.digest("hex");
			const storedHash = this.db.getNodeHash(id);

			if (storedHash === currentHash) {
				return; // No change
			}

			// Generate embedding
			let embedding: Float32Array | undefined;
			if (content.length > 50) {
				embedding = await embedder.embed(content);
			}

			// Extract semantic tokens
			const tokens = tokenizer.extract(content);

			// Insert node
			const node: Node = {
				id,
				type: "document",
				label: (frontmatter.title as string) || filename,
				content,
				domain: "knowledge",
				layer: "document",
				embedding,
				hash: currentHash,
				meta: {
					...frontmatter,
					source: filePath,
					semantic_tokens: tokens,
				},
			};

			this.db.insertNode(node);

			// Weave edges
			weaver.weave(id, content);
		} catch (e) {
			this.log.warn({ err: e, file: filePath }, "⚠️  Failed to process file");
		}
	}

	/**
	 * Parse YAML-like frontmatter
	 */
	private parseFrontmatter(text: string): Record<string, unknown> {
		const meta: Record<string, unknown> = {};
		text.split("\n").forEach((line) => {
			const [key, ...vals] = line.split(":");
			if (key && vals.length) {
				meta[key.trim()] = vals.join(":").trim();
			}
		});
		return meta;
	}
}
