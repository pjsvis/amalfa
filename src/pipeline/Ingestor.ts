import type { Database } from "bun:sqlite";
import { join } from "node:path";
import { EdgeWeaver } from "@src/core/EdgeWeaver";
import { LouvainGate } from "@src/core/LouvainGate";
import { DatabaseFactory } from "@src/resonance/DatabaseFactory";
// Types
import type { Node } from "@src/resonance/db";
import { ResonanceDB } from "@src/resonance/db";
import { Embedder } from "@src/resonance/services/embedder";
import { TokenizerService } from "@src/resonance/services/tokenizer";
import { getLogger } from "@src/utils/Logger";
import { PipelineValidator } from "@src/utils/validator";
import { Glob } from "bun";
import settings from "@/polyvis.settings.json";

export interface IngestorOptions {
	file?: string;
	files?: string[];
	dir?: string;
	dbPath?: string;
}

interface LexiconItem {
	id: string;
	title: string;
	aliases: string[];
}

interface IngestionStats {
	nodes: number;
	edges: number;
	vectors: number;
	semantic_tokens: number;
	db_size_bytes: number;
}

interface RawLexiconItem {
	id: string;
	label: string;
	aliases?: string[];
	description?: string;
	category?: string;
	tags?: string[];
	title?: string; // Sometimes source JSON uses title
}

export class Ingestor {
	private db: ResonanceDB;
	private embedder: Embedder;
	private tokenizer: TokenizerService;
	private dbPath: string;
	private log = getLogger("Ingestor");

	constructor(dbPath?: string) {
		this.dbPath = dbPath
			? join(process.cwd(), dbPath)
			: join(process.cwd(), settings.paths.database.resonance);

		this.db = new ResonanceDB(this.dbPath);
		this.embedder = Embedder.getInstance();
		this.tokenizer = TokenizerService.getInstance();
	}

	public getEmbedder(): Embedder {
		return this.embedder;
	}

	/**
	 * UNIFIED PIPELINE RUNNER
	 * Runs both Persona and Experience pipelines.
	 */
	async run(options: IngestorOptions = {}) {
		const sqliteDb = await this.init(options);

		// Phase 1: Persona
		const lexiconItems = await this.runPersona();

		// Phase 2: Experience
		await this.runExperience(options, lexiconItems, sqliteDb);

		this.cleanup(sqliteDb);
		return true; // Simplified success check
	}

	/**
	 * PHASE 1: PERSONA
	 * Ingests Core Ontology (Lexicon) and Directives (CDA).
	 */
	async runPersona(): Promise<LexiconItem[]> {
		this.log.info("🧩 [Phase 1] Starting Persona Ingestion...");

		this.db.beginTransaction();
		try {
			// 1. Lexicon
			const lexicon = await this.bootstrapLexicon();

			// 2. CDA
			await this.ingestCDA();

			this.db.commit();
			this.log.info("✅ [Phase 1] Persona Ingestion Complete.");
			return lexicon;
		} catch (e) {
			this.db.rollback();
			this.log.error(
				{ err: e },
				"❌ [Phase 1] Persona Ingestion Failed, rolled back.",
			);
			throw e;
		}
	}

	/**
	 * PHASE 2: EXPERIENCE
	 * Ingests Documents, Playbooks, and Debriefs.
	 */
	async runExperience(
		options: IngestorOptions,
		lexicon: LexiconItem[] = [],
		sqliteDb: Database,
	) {
		this.log.info("📚 [Phase 2] Starting Experience Ingestion...");

		// REMOVED: Global Transaction (prevents 100% data loss on 99% crash)
		try {
			// If lexicon is empty (e.g. running independently), try loading from DB
			if (lexicon.length === 0) {
				lexicon = await this.loadLexiconFromDB();
			}

			const weaver = new EdgeWeaver(this.db, lexicon);
			const filesToProcess = this.getFilesToProcess(options);

			// Process
			const startTime = performance.now();
			let totalChars = 0;
			let processedCount = 0;
			const BATCH_SIZE = 50;

			for (const [i, fileEntry] of filesToProcess.entries()) {
				// Start Batch Transaction
				if (i % BATCH_SIZE === 0) {
					this.db.beginTransaction();
				}

				const charsProccessed = await this.processFile(
					fileEntry,
					this.db,
					this.embedder,
					weaver,
					this.tokenizer,
				);
				totalChars += charsProccessed;
				processedCount++;

				// Commit Batch Transaction
				if ((i + 1) % BATCH_SIZE === 0 || i === filesToProcess.length - 1) {
					this.db.commit();
				}
			}

			const endTime = performance.now();
			const durationSec = (endTime - startTime) / 1000;
			const charsPerSec = totalChars / durationSec;
			const dbStats = this.db.getStats();

			this.logStats(
				processedCount,
				totalChars,
				durationSec,
				charsPerSec,
				dbStats,
			);

			// Weaving (Protected by its own transaction)
			this.db.beginTransaction();
			try {
				await this.runWeavers();
				this.db.commit();
			} catch (e) {
				this.db.rollback();
				this.log.error({ err: e }, "❌ Weaving failed, partial rollback");
				// Continue, as ingestion is primary
			}

			// Validation (On native SQLite connection for speed/independence)
			// Run AFTER commit so validator sees committed data
			const validator = new PipelineValidator();
			validator.captureBaseline(sqliteDb);

			// Only run validation if we processed files
			if (processedCount > 0) {
				const report = validator.validate(sqliteDb);
				validator.printReport(report);
			}

			// ------------------------------------------------------------------
			// 🛡️ IRON-CLAD PERSISTENCE PROTOCOL
			// ------------------------------------------------------------------

			// 1. Force WAL Checkpoint
			this.log.info("💾 Persistence: Forcing WAL Checkpoint...");
			this.db.getRawDb().run("PRAGMA wal_checkpoint(TRUNCATE);");

			// 2. Pinch Check (Verification)
			const finalSize = Bun.file(this.dbPath).size; // .size is sync on BunFile
			if (finalSize === 0) {
				throw new Error(
					"CRITICAL: Pinch Check Failed. Database file is 0 bytes.",
				);
			}
			this.log.info(
				{ dbSizeMB: (finalSize / 1024 / 1024).toFixed(2) },
				"✅ Persistence Verified",
			);

			this.log.info("✅ [Phase 2] Experience Ingestion Complete.");
		} catch (e) {
			// No global rollback available (intentional)
			this.log.error({ err: e }, "❌ [Phase 2] Experience Ingestion Failed.");
			throw e;
		}
	}

	// --- Lifecycle Helpers ---

	public async init(_options: IngestorOptions) {
		this.log.info("🌉 <THE BRIDGE> Ingestion Protocol Initiated...");
		// Ensure Embedder Init
		await this.embedder.embed("init");
		// Use Factory for safe validation connection
		// Note: Validation is read-heavy but might need to see WAL updates
		return DatabaseFactory.connect(this.dbPath);
	}

	public cleanup(sqliteDb: Database) {
		sqliteDb.close();
		this.db.close();
	}

	private async loadLexiconFromDB(): Promise<LexiconItem[]> {
		this.log.info("🧠 Loading Lexicon from Database...");
		const rawLexicon = this.db.getLexicon();
		const lexicon: LexiconItem[] = rawLexicon.map((item: RawLexiconItem) => ({
			id: item.id,
			title: item.label,
			aliases: item.aliases || [],
		}));
		this.tokenizer.loadLexicon(lexicon);
		return lexicon;
	}

	private async bootstrapLexicon(): Promise<LexiconItem[]> {
		let lexicon: LexiconItem[] = [];
		try {
			const legacyPath = join(
				process.cwd(),
				settings.paths.sources.persona.lexicon,
			);
			if (legacyPath) {
				const file = Bun.file(legacyPath);
				if (await file.exists()) {
					const json = await file.json();
					if (json) {
						const items = Array.isArray(json) ? json : json.concepts;
						lexicon = (items as RawLexiconItem[]).map((c) => ({
							id: c.id,
							title: c.title || c.label,
							aliases: c.aliases || [],
						}));

						// Bootstrap Nodes
						for (const item of items) {
							this.db.insertNode({
								id: item.id,
								type: "concept",
								label: item.title || item.label,
								content: item.description || item.title || item.label,
								domain: "persona",
								layer: "ontology",
								meta: {
									category: item.category,
									tags: item.tags,
								},
							} as Node);
						}
						this.log.info({ count: lexicon.length }, "📚 Bootstrapped Lexicon");
						this.tokenizer.loadLexicon(lexicon);
					}
				}
			}
		} catch (e) {
			this.log.warn({ err: e }, "⚠️  Lexicon bootstrap failed");
		}
		return lexicon;
	}

	private async ingestCDA() {
		try {
			const enrichedCdaPath = join(
				process.cwd(),
				".resonance",
				"artifacts",
				"cda-enriched.json",
			);
			const cdaFile = Bun.file(enrichedCdaPath);

			if (await cdaFile.exists()) {
				const enrichedCda = await cdaFile.json();
				let directiveCount = 0;

				for (const entry of enrichedCda.entries) {
					this.db.insertNode({
						id: entry.id,
						type: "directive",
						label: entry.title,
						content: entry.definition,
						domain: "persona",
						layer: "directive",
						meta: {
							section: entry.section,
							tags: entry.explicit_tags,
						},
					} as Node);
					directiveCount++;

					for (const rel of entry.validated_relationships) {
						const check = LouvainGate.check(
							this.db.getRawDb(),
							entry.id,
							rel.target,
						);
						if (check.allowed) {
							this.db.insertEdge(entry.id, rel.target, rel.type);
						} else {
							// console.log(`[LouvainGate] ${check.reason}`);
						}
					}
				}
				this.log.info({ count: directiveCount }, "📋 Ingested CDA");
			} else {
				this.log.warn("⚠️  No enriched CDA found.");
			}
		} catch (e) {
			this.log.warn({ err: e }, "⚠️  CDA ingestion failed");
		}
	}

	private getFilesToProcess(
		options: IngestorOptions,
	): { path: string; type: string }[] {
		const files: { path: string; type: string }[] = [];

		// 1. Specific single file
		if (options.file) {
			files.push({ path: String(options.file), type: "document" });
		}
		// 2. Specific list of files (Batch)
		else if (options.files && options.files.length > 0) {
			for (const f of options.files) {
				files.push({ path: String(f), type: "document" });
			}
		}
		// 3. Full Directory Scan
		else {
			const sources = options.dir
				? [{ path: String(options.dir), name: "Document" }]
				: settings.paths.sources.experience;

			for (const source of sources) {
				const glob = new Glob("**/*.md");
				for (const file of glob.scanSync(source.path)) {
					files.push({
						path: join(process.cwd(), source.path, file),
						type: source.name.toLowerCase(), // Use name from settings as generic type base
					});
				}
			}
		}
		return files;
	}

	private async runWeavers() {
		try {
			const { TimelineWeaver } = await import("@src/core/TimelineWeaver");
			TimelineWeaver.weave(this.db);
		} catch (e) {
			this.log.warn({ err: e }, "⚠️ Timeline Weaver failed");
		}

		try {
			const { SemanticWeaver } = await import("@src/core/SemanticWeaver");
			SemanticWeaver.weave(this.db);
		} catch (e) {
			this.log.warn({ err: e }, "⚠️ Semantic Weaver failed");
		}
	}

	private logStats(
		count: number,
		chars: number,
		duration: number,
		throughput: number,
		stats: IngestionStats,
	) {
		this.log.info(
			{
				processed: {
					files: count,
					chars: chars,
					sizeKB: (chars / 1024).toFixed(2),
					durationSec: duration.toFixed(2),
					throughput: throughput.toFixed(2),
				},
				db: {
					nodes: stats.nodes,
					vectors: stats.vectors,
					edges: stats.edges,
					semantic_tokens: stats.semantic_tokens,
					sizeMB: (stats.db_size_bytes / 1024 / 1024).toFixed(2),
				},
			},
			"🏁 Ingestion Complete",
		);
	}

	// --- Processing Logic ---

	private async processFile(
		fileEntry: { path: string; type: string },
		db: ResonanceDB,
		embedder: Embedder,
		weaver: EdgeWeaver,
		tokenizer: TokenizerService,
	): Promise<number> {
		const filePath = fileEntry.path;
		const type = fileEntry.type;
		const content = await Bun.file(filePath).text();
		const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
		const frontmatter = fmMatch?.[1] ? this.parseFrontmatter(fmMatch[1]) : {};
		let totalBoxChars = 0;

		const boxRegex =
			/<!-- locus:([a-zA-Z0-9-]+) -->\n([\s\S]*?)(?=<!-- locus:|$)/g;
		let match: RegExpExecArray | null;
		let foundBoxes = false;

		while (true) {
			match = boxRegex.exec(content);
			if (!match) break;
			if (!match[1] || !match[2]) continue;

			foundBoxes = true;
			const locusId = match[1];
			const boxContent = match[2].trim();

			await this.processBox(
				locusId,
				boxContent,
				type,
				frontmatter,
				filePath,
				db,
				embedder,
				weaver,
				tokenizer,
			);
			totalBoxChars += boxContent.length;
		}

		if (!foundBoxes) {
			const filename = filePath.split("/").pop() || "unknown";
			const id = filename
				.replace(".md", "")
				.toLowerCase()
				.replace(/[^a-z0-9-]/g, "-");

			if (content.length > 10) {
				await this.processBox(
					id,
					content,
					type,
					frontmatter,
					filePath,
					db,
					embedder,
					weaver,
					tokenizer,
				);
				return content.length;
			}
			return 0;
		}
		return totalBoxChars;
	}

	private async processBox(
		id: string,
		content: string,
		type: string,
		meta: Record<string, unknown>,
		sourcePath: string,
		db: ResonanceDB,
		embedder: Embedder,
		weaver: EdgeWeaver,
		tokenizer: TokenizerService,
	) {
		const tokens = tokenizer.extract(content);
		// MD5 hash for content change detection
		const hasher = new Bun.CryptoHasher("md5");
		hasher.update(content.trim());
		const currentHash = hasher.digest("hex");
		const storedHash = db.getNodeHash(id);

		if (storedHash === currentHash) return;

		this.log.debug(
			{ id, length: content.length },
			"⚡️ Ingesting changed content",
		);

		// Removed hardcoded narrative allowlist.
		// Logic: If it's mounted, we process & embed it.
		let embedding: Float32Array | undefined;
		if (content.length > 50) {
			embedding = (await embedder.embed(content)) || undefined;
		}

		const node = {
			id: id,
			type: type,
			label: (meta.title as string) || sourcePath.split("/").pop(),
			content: content,
			domain: "experience",
			layer: "note",
			embedding: embedding,
			hash: currentHash,
			meta: { ...meta, source: sourcePath, semantic_tokens: tokens },
		};

		db.insertNode(node);
		weaver.weave(id, content);
	}

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
