/**
 * AMALFA Configuration Example
 * 
 * Copy this file to your project root as:
 * - amalfa.config.ts (TypeScript)
 * - amalfa.config.js (JavaScript)
 * - amalfa.config.json (JSON)
 */

export default {
	/**
	 * Source directory containing markdown files
	 * Relative to project root
	 * 
	 * Examples:
	 * - "./docs" - Standard documentation folder
	 * - "./notes" - Personal notes
	 * - "./content" - Content management
	 * - "." - Current directory (scans all .md files)
	 */
	source: "./docs",

	/**
	 * Database file location
	 * Relative to project root
	 * 
	 * The .amalfa directory is gitignored by default.
	 * The database can be regenerated from markdown at any time.
	 */
	database: ".amalfa/resonance.db",

	/**
	 * Embedding configuration
	 */
	embeddings: {
		/**
		 * Embedding model to use
		 * 
		 * Options:
		 * - "BAAI/bge-small-en-v1.5" (default) - Best balance (384 dims)
		 * - "sentence-transformers/all-MiniLM-L6-v2" - Faster (384 dims)
		 * - "BAAI/bge-base-en-v1.5" - More accurate (768 dims, slower)
		 * 
		 * Models are downloaded on first use to .resonance/cache/
		 */
		model: "BAAI/bge-small-en-v1.5",

		/**
		 * Vector dimensions
		 * Must match the model's output size
		 * 
		 * Common dimensions:
		 * - 384: Most small models
		 * - 768: Most base models
		 * - 1024: Large models
		 */
		dimensions: 384,
	},

	/**
	 * File watcher configuration
	 */
	watch: {
		/**
		 * Enable file watching
		 * Used by 'amalfa daemon' command
		 */
		enabled: true,

		/**
		 * Debounce delay in milliseconds
		 * 
		 * How long to wait after the last file change before
		 * triggering re-ingestion. This prevents excessive
		 * processing during rapid file edits.
		 * 
		 * Recommended:
		 * - 1000ms (1 second) - Default, good for most cases
		 * - 500ms - More responsive, slightly higher CPU
		 * - 2000ms - Less responsive, lower CPU
		 */
		debounce: 1000,
	},

	/**
	 * Patterns to exclude from ingestion
	 * 
	 * Files/directories matching these patterns are ignored.
	 * Patterns are checked with String.includes(), not glob.
	 * 
	 * Common exclusions:
	 * - "node_modules" - JavaScript dependencies
	 * - ".git" - Git internals
	 * - ".amalfa" - AMALFA data directory
	 * - "vendor" - PHP dependencies
	 * - "target" - Rust build artifacts
	 * - "dist" - Build output
	 */
	excludePatterns: ["node_modules", ".git", ".amalfa"],
};
