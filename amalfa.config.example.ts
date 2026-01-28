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
	 * Source directories containing markdown files
	 * Relative to project root
	 *
	 * Examples:
	 * - ["./docs"] - Single directory
	 * - ["./docs", "./notes"] - Multiple directories
	 * - ["./docs", "../shared/notes"] - Across repositories
	 * - ["."] - Current directory (scans all .md files)
	 *
	 * Legacy: Single 'source' string still supported for backward compatibility
	 */
	sources: ["./docs"],

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

		/**
		 * Show desktop notifications
		 *
		 * When enabled, the daemon sends native OS notifications
		 * when the knowledge graph is updated.
		 *
		 * Default: true
		 * Set to false for silent operation
		 */
		notifications: true,
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

	/**
	 * LangExtract knowledge graph extraction configuration
	 *
	 * LangExtract uses LLMs to extract entities and relationships from code.
	 * Supports multiple providers: gemini, ollama (local), ollama_cloud (remote), openrouter.
	 */
	langExtract: {
		/**
		 * Provider to use for entity extraction
		 *
		 * Options:
		 * - "gemini" - Google Gemini API (default, requires GEMINI_API_KEY)
		 * - "ollama" - Local Ollama instance (requires Ollama installed)
		 * - "ollama_cloud" - Remote Ollama instance (cloud/hosted)
		 * - "openrouter" - OpenRouter API (requires OPENROUTER_API_KEY)
		 */
		provider: "ollama",

		/**
		 * Local Ollama configuration
		 *
		 * Requires Ollama to be installed and running:
		 * curl -fsSL https://ollama.ai/install.sh | sh
		 * ollama pull qwen2.5:1.5b
		 */
		ollama: {
			host: "http://localhost:11434",
			model: "qwen2.5:1.5b",
		},

		/**
		 * Cloud/Remote Ollama configuration
		 *
		 * Use this for GPU-accelerated instances or corporate proxies.
		 * Set host to your remote endpoint (e.g., https://your-gpu-server.com:11434).
		 */
		ollama_cloud: {
			host: "",
			model: "qwen2.5:7b",
			apiKey: "",
		},

		/**
		 * OpenRouter configuration
		 *
		 * Alternative cloud provider with many model options.
		 * Requires OPENROUTER_API_KEY environment variable.
		 */
		openrouter: {
			model: "qwen/qwen-2.5-72b-instruct",
		},
	},
};
