/**
 * Scratchpad Protocol
 *
 * Intercepts large tool outputs and caches them to disk, returning a reference
 * instead of the full content. This reduces context window usage for verbose
 * tool responses while preserving access to the full data.
 *
 * Storage: .amalfa/cache/scratchpad/{hash}.json
 * Reference format: "📁 Output cached: {path} ({size})"
 *
 * NFB-01: Configuration is now sourced from AmalfaSettings.scratchpad (SSOT).
 * No internal defaults - all values come from the Zod schema.
 */

import { createHash } from "node:crypto";
import {
	existsSync,
	readdirSync,
	readFileSync,
	statSync,
	unlinkSync,
} from "node:fs";
import { join } from "node:path";
import { AMALFA_DIRS, initAmalfaDirs } from "@src/config/defaults";
import type { ScratchpadConfig } from "@src/config/schema";
import { getLogger } from "./Logger";

const log = getLogger("Scratchpad");

/** Scratchpad entry metadata */
export interface ScratchpadEntry {
	/** Unique hash identifier */
	id: string;
	/** Original tool name that produced the output */
	tool: string;
	/** When the entry was created */
	timestamp: string;
	/** Size of the content in bytes */
	sizeBytes: number;
	/** Content type hint */
	contentType: "json" | "text" | "markdown";
	/** Summary/preview of the content */
	preview: string;
	/** The full content */
	content: string;
}

/**
 * Scratchpad manages caching of large tool outputs.
 *
 * Usage:
 * ```ts
 * const config = loadSettings();
 * const scratchpad = new Scratchpad(config.scratchpad);
 * const result = scratchpad.maybeCache("search_documents", largeOutput);
 * // Returns either the original output (if small) or a reference (if large)
 * ```
 */
export class Scratchpad {
	private config: Required<ScratchpadConfig>;
	private dir: string;

	constructor(config: ScratchpadConfig) {
		// Ensure all config values are present (Zod guarantees this, but we make it explicit)
		this.config = {
			enabled: config.enabled ?? true,
			thresholdBytes: config.thresholdBytes ?? 4 * 1024,
			maxAgeMs: config.maxAgeMs ?? 24 * 60 * 60 * 1000,
			maxCacheSizeBytes: config.maxCacheSizeBytes ?? 50 * 1024 * 1024,
			includePreview: config.includePreview ?? true,
			previewLength: config.previewLength ?? 200,
		};
		this.dir = AMALFA_DIRS.scratchpad;
		initAmalfaDirs();
	}

	/**
	 * Generate a hash for content deduplication.
	 */
	private hash(content: string): string {
		return createHash("sha256").update(content).digest("hex").slice(0, 12);
	}

	/**
	 * Detect content type from string.
	 */
	private detectContentType(content: string): "json" | "text" | "markdown" {
		const trimmed = content.trim();
		if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
			try {
				JSON.parse(trimmed);
				return "json";
			} catch {
				// Not valid JSON
			}
		}
		if (trimmed.includes("# ") || trimmed.includes("## ")) {
			return "markdown";
		}
		return "text";
	}

	/**
	 * Generate a preview of the content.
	 */
	private generatePreview(content: string, contentType: string): string {
		const maxLen = this.config.previewLength;
		let preview = content.slice(0, maxLen);

		if (contentType === "json") {
			try {
				const parsed = JSON.parse(content);
				if (Array.isArray(parsed)) {
					preview = `[Array with ${parsed.length} items]`;
				} else if (typeof parsed === "object" && parsed !== null) {
					const keys = Object.keys(parsed).slice(0, 5);
					preview = `{${keys.join(", ")}${keys.length < Object.keys(parsed).length ? "..." : ""}}`;
				}
			} catch {
				// Fall through to default preview
			}
		}

		if (content.length > maxLen) {
			preview = `${preview.replace(/\n/g, " ").trim()}...`;
		}

		return preview;
	}

	/**
	 * Format file size for human readability.
	 */
	private formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes}B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
		return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
	}

	/**
	 * Maybe cache the output if it exceeds the threshold.
	 *
	 * @param tool - Name of the tool that produced the output
	 * @param content - The output content to potentially cache
	 * @returns Original content if small, or a reference string if cached
	 */
	maybeCache(tool: string, content: string): string {
		const sizeBytes = Buffer.byteLength(content, "utf-8");

		// Below threshold - return as-is
		if (sizeBytes < this.config.thresholdBytes) {
			return content;
		}

		// Cache the content
		const id = this.hash(content);
		const contentType = this.detectContentType(content);
		const preview = this.generatePreview(content, contentType);

		const entry: ScratchpadEntry = {
			id,
			tool,
			timestamp: new Date().toISOString(),
			sizeBytes,
			contentType,
			preview,
			content,
		};

		const filePath = join(this.dir, `${id}.json`);

		// Check if already cached (deduplication)
		if (!existsSync(filePath)) {
			Bun.write(filePath, JSON.stringify(entry, null, 2));
			log.info({ id, tool, size: this.formatSize(sizeBytes) }, "Cached output");
		} else {
			log.debug({ id }, "Output already cached (dedup)");
		}

		// Build reference string
		let reference = `📁 Output cached: ${filePath} (${this.formatSize(sizeBytes)})`;

		if (this.config.includePreview) {
			reference += `\n\nPreview: ${preview}`;
		}

		reference += `\n\nTo read full content, use: Scratchpad.read("${id}")`;

		return reference;
	}

	/**
	 * Read a cached entry by ID.
	 */
	read(id: string): ScratchpadEntry | null {
		const filePath = join(this.dir, `${id}.json`);

		if (!existsSync(filePath)) {
			log.warn({ id }, "Scratchpad entry not found");
			return null;
		}

		try {
			const raw = readFileSync(filePath, "utf-8");
			return JSON.parse(raw) as ScratchpadEntry;
		} catch (e) {
			log.error({ id, err: e }, "Failed to read scratchpad entry");
			return null;
		}
	}

	/**
	 * Read just the content of a cached entry.
	 */
	readContent(id: string): string | null {
		const entry = this.read(id);
		return entry?.content ?? null;
	}

	/**
	 * List all cached entries (metadata only, no content).
	 */
	list(): Omit<ScratchpadEntry, "content">[] {
		if (!existsSync(this.dir)) {
			return [];
		}

		const files = readdirSync(this.dir).filter((f) => f.endsWith(".json"));
		const entries: Omit<ScratchpadEntry, "content">[] = [];

		for (const file of files) {
			try {
				const filePath = join(this.dir, file);
				const raw = readFileSync(filePath, "utf-8");
				const entry = JSON.parse(raw) as ScratchpadEntry;
				const { content: _, ...metadata } = entry;
				entries.push(metadata);
			} catch {
				// Skip corrupted entries
			}
		}

		return entries.sort(
			(a, b) =>
				new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
		);
	}

	/**
	 * Delete a cached entry.
	 */
	delete(id: string): boolean {
		const filePath = join(this.dir, `${id}.json`);

		if (!existsSync(filePath)) {
			return false;
		}

		try {
			unlinkSync(filePath);
			log.info({ id }, "Deleted scratchpad entry");
			return true;
		} catch (e) {
			log.error({ id, err: e }, "Failed to delete scratchpad entry");
			return false;
		}
	}

	/**
	 * Prune old entries based on age and total cache size.
	 */
	prune(): { deleted: number; freedBytes: number } {
		if (!existsSync(this.dir)) {
			return { deleted: 0, freedBytes: 0 };
		}

		const files = readdirSync(this.dir).filter((f) => f.endsWith(".json"));
		const now = Date.now();
		let deleted = 0;
		let freedBytes = 0;

		// First pass: delete entries older than maxAge
		for (const file of files) {
			const filePath = join(this.dir, file);
			try {
				const stat = statSync(filePath);
				const age = now - stat.mtimeMs;

				if (age > this.config.maxAgeMs) {
					freedBytes += stat.size;
					unlinkSync(filePath);
					deleted++;
				}
			} catch {
				// Skip files we can't stat
			}
		}

		// Second pass: if still over size limit, delete oldest entries
		const remainingFiles = readdirSync(this.dir).filter((f) =>
			f.endsWith(".json"),
		);
		let totalSize = 0;
		const fileStats: { path: string; mtime: number; size: number }[] = [];

		for (const file of remainingFiles) {
			const filePath = join(this.dir, file);
			try {
				const stat = statSync(filePath);
				totalSize += stat.size;
				fileStats.push({
					path: filePath,
					mtime: stat.mtimeMs,
					size: stat.size,
				});
			} catch {
				// Skip
			}
		}

		if (totalSize > this.config.maxCacheSizeBytes) {
			// Sort by oldest first
			fileStats.sort((a, b) => a.mtime - b.mtime);

			for (const file of fileStats) {
				if (totalSize <= this.config.maxCacheSizeBytes) {
					break;
				}

				try {
					unlinkSync(file.path);
					totalSize -= file.size;
					freedBytes += file.size;
					deleted++;
				} catch {
					// Skip
				}
			}
		}

		if (deleted > 0) {
			log.info(
				{ deleted, freed: this.formatSize(freedBytes) },
				"Pruned scratchpad cache",
			);
		}

		return { deleted, freedBytes };
	}

	/**
	 * Clear all cached entries.
	 */
	clear(): number {
		if (!existsSync(this.dir)) {
			return 0;
		}

		const files = readdirSync(this.dir).filter((f) => f.endsWith(".json"));
		let deleted = 0;

		for (const file of files) {
			try {
				unlinkSync(join(this.dir, file));
				deleted++;
			} catch {
				// Skip
			}
		}

		log.info({ deleted }, "Cleared scratchpad cache");
		return deleted;
	}

	/**
	 * Get cache statistics.
	 */
	stats(): {
		entries: number;
		totalSizeBytes: number;
		oldestTimestamp: string | null;
		newestTimestamp: string | null;
	} {
		const entries = this.list();

		if (entries.length === 0) {
			return {
				entries: 0,
				totalSizeBytes: 0,
				oldestTimestamp: null,
				newestTimestamp: null,
			};
		}

		const totalSizeBytes = entries.reduce((sum, e) => sum + e.sizeBytes, 0);
		const timestamps = entries.map((e) => e.timestamp).sort();

		return {
			entries: entries.length,
			totalSizeBytes,
			oldestTimestamp: timestamps[0] ?? null,
			newestTimestamp: timestamps[timestamps.length - 1] ?? null,
		};
	}
}

// Singleton instance for convenience (requires config to be passed)
let _instance: Scratchpad | null = null;

/**
 * Get the shared Scratchpad instance.
 * NFB-01: Requires config.scratchpad from loadSettings() - no internal defaults.
 */
export function getScratchpad(config: ScratchpadConfig): Scratchpad {
	if (!_instance) {
		_instance = new Scratchpad(config);
	}
	return _instance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetScratchpad(): void {
	_instance = null;
}
