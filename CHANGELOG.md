# Changelog

All notable changes to AMALFA will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-01-06

### Added

#### Pre-Flight Validation System
- **PreFlightAnalyzer** class performs comprehensive file validation before ingestion
- Detects and blocks problematic files:
  - Large files (>10MB) that would cause memory issues or poor search quality
  - Symlinks with circular references (prevents infinite loops)
  - Empty files (0 bytes) and very small files (<50 bytes)
  - Overall corpus health warnings (10,000+ files or 1GB+ total size)
- Generates `.amalfa-pre-flight.log` with detailed recommendations for each issue
- References v1.1 auto-splitting feature for large files
- Provides actionable guidance for fixing issues

#### Enhanced CLI
- `amalfa init --force` flag to override warnings (errors still block)
- Pre-flight summary shows total/valid/skipped file counts before ingestion
- Clear error messages with severity levels (error/warning/info)
- Improved user experience with proactive issue detection

#### Multi-Source Directory Support
- Configuration now supports `sources: string[]` array instead of single `source`
- Scan and ingest from multiple directories in one database
- Backward compatible: single `source` string auto-migrates to `sources` array
- Example: `sources: ["./docs", "./notes", "./wiki"]`
- Daemon watches all configured source directories simultaneously

#### Test Documentation
- Comprehensive `TEST_PLAN.md` covering 8 test phases
- Edge case scenarios documented with expected behaviors
- Pre-release checklist for quality assurance

### Changed

#### Database Schema (v5 → v6)
- **Schema v6**: Stop storing content in `content` column (always NULL)
- Content now exclusively read from filesystem via `meta.source` path
- Frees significant disk space: ~5KB per node (350MB saved for 70K corpus)
- Single source of truth: filesystem, not database
- Prepares architecture for Graphology integration (hollow nodes)
- Backward compatible: column still exists but unused (removal planned for v1.1)

#### Corpus Size Limits
- Increased warning thresholds based on real-world testing:
  - File count warning: 1,000 → 10,000 files
  - Total size warning: 100MB → 1GB
- Reflects actual SQLite performance capabilities with WAL mode
- Based on validated testing with 70,000+ document corpus

### Fixed

#### Edge Case Protection
- **Emoji in filenames**: Confirmed UTF-8 support works correctly
- **Symlink handling**: Depth tracking prevents traversal issues
- **Circular references**: Detected and blocked before ingestion
- **Zero-byte files**: Skipped with info-level logging
- **Missing source directories**: Warning issued, doesn't crash

### Technical

#### Architecture Improvements
- Hollow node pattern fully implemented (no content in database)
- Two-phase ingestion: analysis → execution
- Graceful degradation for edge cases
- File system as canonical source of truth

#### Performance
- Database writes faster (no large text blobs)
- Reduced memory footprint during ingestion
- Faster migration runs (content column nullified, not rebuilt)

---

## [1.0.0] - 2026-01-06

### Added
- Initial release of AMALFA (A Memory Layer For Agents)
- Local-first knowledge graph engine for AI agents
- Transform markdown documents into searchable memory
- Model Context Protocol (MCP) integration for Claude Desktop

#### Core Features
- **Vector Search**: Semantic search using FastEmbed (all-MiniLM-L6-v2, 384-dim)
- **SQLite Database**: Hollow nodes with filesystem-backed content
- **MCP Server**: 5 tools for AI agents (search, read, explore, stats, discover)
- **CLI Interface**: `amalfa init`, `serve`, `stats`, `doctor`, `daemon`
- **File Watcher**: Daemon mode for real-time updates with debouncing
- **Hash-based Deduplication**: Prevents re-processing unchanged files

#### Architecture
- **FAFCAS Protocol**: Fast and Frugal Cosine Similarity for vector search
- **Hollow Nodes**: Content stored in filesystem, metadata in SQLite
- **WAL Mode**: Concurrent read access with write-ahead logging
- **Batch Transactions**: Efficient bulk ingestion (10 files/batch)

#### MCP Tools
1. `search_knowledge(query, limit)` - Semantic vector search
2. `get_node_content(id)` - Read full markdown content
3. `find_related(id, depth)` - Graph traversal
4. `get_graph_stats()` - Database statistics
5. `discover_topics(min_cluster_size)` - Topic clustering

#### Configuration
- `amalfa.config.{ts,js,json}` for customization
- Configurable embedding model, database path, source directory
- Watch debounce timing and other daemon settings

#### Performance
- ~13 files/second ingestion speed
- <10ms vector search queries
- ~8KB database size per document (with embeddings)
- Scales to 70,000+ documents tested

---

## Migration Guide

### Upgrading from v1.0.0 → v1.0.1

1. **Update package**:
   ```bash
   bun add -g amalfa@1.0.1
   ```

2. **Database migration** (automatic):
   - Schema v6 runs automatically on first `amalfa init` or `serve`
   - Content column nullified, ~350MB freed for 70K corpus
   - No user action required

3. **Configuration** (optional):
   - Update `amalfa.config` to use `sources` array for multiple directories:
     ```json
     {
       "sources": ["./docs", "./notes"]
     }
     ```
   - Single `source` string still works (auto-migrated)

4. **Pre-flight validation**:
   - First `amalfa init` will run validation
   - Review `.amalfa-pre-flight.log` for any warnings
   - Use `--force` to bypass warnings if needed

---

## Support

- **Documentation**: [GitHub README](https://github.com/pjsvis/amalfa)
- **Issues**: [GitHub Issues](https://github.com/pjsvis/amalfa/issues)
