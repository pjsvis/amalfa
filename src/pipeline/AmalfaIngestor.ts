/**
 * AMALFA Ingestor
 * Simplified ingestion pipeline for markdown files
 * No Persona/CDA complexity - just pure markdown → knowledge graph
 */

import { join } from "node:path";
import type { AmalfaConfig } from "@src/config/defaults";
import { EdgeWeaver } from "@src/core/EdgeWeaver";
import type { Node, ResonanceDB } from "@src/resonance/db";
import { Embedder } from "@src/resonance/services/embedder";
import { SimpleTokenizerService as TokenizerService } from "@src/resonance/services/simpleTokenizer";
import { getLogger } from "@src/utils/Logger";
import { Glob } from "bun";
import matter from "gray-matter";

export interface IngestionResult {
	success: boolean;
	stats: {
		files: number;
		nodes: number;
		edges: number;
		vectors: number;
		durationSec: number;
		louvainStats?: { checked: number; rejected: number };
	};
}

export class AmalfaIngestor {
	private log = getLogger("AmalfaIngestor");

	constructor(
		private config: AmalfaConfig,
		private db: ResonanceDB,
	) {}

	/**
	 * Ingest specific files (incremental mode)
	 * Used by file watcher to process only changed files
	 */
	async ingestFiles(filePaths: string[]): Promise<IngestionResult> {
		const startTime = performance.now();

		if (filePaths.length === 0) {
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

		this.log.info(
			`🔄 Incremental ingestion: ${filePaths.length} file${filePaths.length > 1 ? "s" : ""}`,
		);

		try {
			// Initialize services
			const embedder = Embedder.getInstance();
			const tokenizer = TokenizerService.getInstance();

			// Pass 1: Process changed files (no edge weaving yet)
			this.db.beginTransaction();
			for (const filePath of filePaths) {
				await this.processFile(filePath, embedder, null, tokenizer);
			}
			this.db.commit();

			// Pass 2: Rebuild edges for affected nodes
			const lexicon = this.buildLexicon();
			const weaver = new EdgeWeaver(this.db, lexicon, this.config);

			this.db.beginTransaction();
			for (const filePath of filePaths) {
				try {
					const content = await Bun.file(filePath).text();
					const id = this.extractIdFromPath(filePath);
					weaver.weave(id, content);
				} catch (e) {
					this.log.warn({ file: filePath, err: e }, "⚠️  Failed to weave edges");
				}
			}
			this.db.commit();

			// Force WAL checkpoint
			this.db.getRawDb().run("PRAGMA wal_checkpoint(TRUNCATE);");

			const endTime = performance.now();
			const durationSec = (endTime - startTime) / 1000;

			const stats = this.db.getStats();
			this.log.info(
				{
					files: filePaths.length,
					nodes: stats.nodes,
					edges: stats.edges,
					vectors: stats.vectors,
					durationSec: durationSec.toFixed(2),
				},
				"✅ Incremental ingestion complete",
			);

			return {
				success: true,
				stats: {
					files: filePaths.length,
					nodes: stats.nodes,
					edges: stats.edges,
					vectors: stats.vectors,
					durationSec,
				},
			};
		} catch (e) {
			this.log.error({ err: e }, "❌ Incremental ingestion failed");
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

			// TWO-PASS INGESTION:
			// Pass 1: Create all nodes (without edges)
			// Pass 2: Create edges (now that all nodes exist in lexicon)

			// Reduced from 50 to 10 to minimize lock duration and prevent SQLITE_BUSY errors
			// when daemons/MCP server are running concurrently
			const BATCH_SIZE = 10;
			let processedCount = 0;

			// PASS 1: Nodes only
			for (let i = 0; i < files.length; i++) {
				const filePath = files[i];
				if (!filePath) continue;

				// Start batch transaction
				if (i % BATCH_SIZE === 0) {
					this.db.beginTransaction();
				}

				await this.processFile(filePath, embedder, null, tokenizer); // null = skip edge weaving
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

			// PASS 2: Edges (now lexicon is populated)
			const lexicon = this.buildLexicon();
			const weaver = new EdgeWeaver(this.db, lexicon, this.config);

			console.log("\n🔗 Creating edges...");
			this.db.beginTransaction();
			for (const filePath of files) {
				if (!filePath) continue;
				const content = await Bun.file(filePath).text();
				const id = this.extractIdFromPath(filePath);
				weaver.weave(id, content);
			}
			this.db.commit();

			const louvainStats = weaver.getStats();
			if (louvainStats.rejected > 0) {
				this.log.info(
					louvainStats,
					"🛡️ LouvainGate stats: Edges filtered to prevent super-node collapse",
				);
			}

			// Force WAL checkpoint for persistence
			this.log.info("💾 Forcing WAL checkpoint...");
			this.db.getRawDb().run("PRAGMA wal_checkpoint(TRUNCATE);");

			// OH-104: The Pinch Check (verify physical commit)
			const dbPath = this.db.getRawDb().filename;
			const dbFile = Bun.file(dbPath);
			if (!(await dbFile.exists())) {
				throw new Error(
					"OH-104 VIOLATION: Database file missing after checkpoint",
				);
			}
			const finalSize = dbFile.size;
			if (finalSize === 0) {
				throw new Error(
					"OH-104 VIOLATION: Database file is empty after checkpoint",
				);
			}
			this.log.info(`✅ Pinch Check: db=${(finalSize / 1024).toFixed(1)}KB`);

			const endTime = performance.now();
			const durationSec = (endTime - startTime) / 1000;

			const stats = this.db.getStats();
			this.log.info(
				{
					files: processedCount,
					nodes: stats.nodes,
					edges: stats.edges,
					vectors: stats.vectors,
					durationSec: durationSec.toFixed(2),
				},
				"✅ Ingestion complete",
			);

			return {
				success: true,
				stats: {
					files: processedCount,
					nodes: stats.nodes,
					edges: stats.edges,
					vectors: stats.vectors,
					durationSec,
					louvainStats,
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
		const glob = new Glob("**/*.{md,ts,js}");
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
				this.log.warn(
					{ source: sourcePath, err: e },
					"⚠️  Failed to scan directory",
				);
			}
		}

		return files;
	}

	/**
	 * Extract node ID from file path
	 */
	private extractIdFromPath(filePath: string): string {
		const filename = filePath.split("/").pop() || "unknown";
		return filename
			.replace(/\.(md|ts|js)$/, "")
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, "-");
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
		weaver: EdgeWeaver | null,
		tokenizer: TokenizerService,
	): Promise<void> {
		try {
			const rawContent = await Bun.file(filePath).text();

			// Parse frontmatter with gray-matter
			const parsed = matter(rawContent);
			const frontmatter = parsed.data || {};
			const content = parsed.content;

			// Generate ID from filename
			const filename = filePath.split("/").pop() || "unknown";
			const id = filename
				.replace(/\.(md|ts|js)$/, "")
				.toLowerCase()
				.replace(/[^a-z0-9-]/g, "-");

			// Skip if content unchanged (hash check)
			const hasher = new Bun.CryptoHasher("md5");
			hasher.update(rawContent.trim());
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

			// Insert node
			const node: Node = {
				id,
				type: "document",
				label: (frontmatter.title as string) || filename,
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

			// Weave edges (only if weaver provided - skipped in pass 1)
			if (weaver) {
				weaver.weave(id, content);
			}
		} catch (e) {
			this.log.warn({ err: e, file: filePath }, "⚠️  Failed to process file");
		}
	}
}
