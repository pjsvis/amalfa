# AMALFA End-to-End Test Plan

**Version:** 1.0.0  
**Last Updated:** 2026-01-06  
**Status:** Draft

## Overview

This document outlines comprehensive testing procedures for AMALFA (A Memory Layer For Agents), covering installation, configuration, ingestion, daemon operations, MCP integration, and edge cases.

## Test Environment

- **Runtime:** Bun v1.0+
- **OS:** macOS (primary), Linux (supported)
- **Test Data:** Sample markdown files, PolyVis documentation (~95 files)
- **MCP Client:** Claude Desktop

---

## Phase 1: Fresh Installation Test

**Objective:** Verify clean install from NPM works globally

### Steps

1. **Clean environment**
   ```bash
   bun remove -g amalfa  # Remove if exists
   ```

2. **Install from NPM**
   ```bash
   bun add -g amalfa
   amalfa --version
   ```
   - Expected: Version 1.0.0 displayed

3. **Verify commands available**
   ```bash
   amalfa help
   amalfa doctor  # Should show no database
   ```
   - Expected: Help text displays all commands
   - Expected: Doctor shows "Database not found" (clean state)

### Success Criteria
- [ ] Global installation completes without errors
- [ ] `amalfa` command available in PATH
- [ ] `--version` shows correct version
- [ ] `help` displays all commands
- [ ] `doctor` runs without crashing

---

## Phase 2: Single-Source Initialization

**Objective:** Test basic workflow with one source directory

### Steps

1. **Create test project**
   ```bash
   mkdir -p /tmp/amalfa-test-single
   cd /tmp/amalfa-test-single
   mkdir docs
   ```

2. **Add sample markdown files**
   ```bash
   echo "# Test Doc 1\nSome content about testing." > docs/test1.md
   echo "# Test Doc 2\nMore content about features." > docs/test2.md
   echo "# Test Doc 3\nFinal test document." > docs/test3.md
   ```

3. **Initialize (default config)**
   ```bash
   amalfa init
   ```
   - Expected: Progress indicators show 3/3 files
   - Expected: Success message with stats (3 files, 3 nodes)

4. **Verify database**
   ```bash
   amalfa stats
   amalfa doctor
   ```
   - Expected: Stats show 3 nodes, 3 embeddings
   - Expected: Doctor shows all checks pass

5. **Test MCP server**
   ```bash
   amalfa serve  # Press Ctrl+C to stop after startup
   ```
   - Expected: Server starts without errors
   - Expected: Shows database path

### Success Criteria
- [ ] Default `./docs` directory discovered
- [ ] 3 markdown files ingested
- [ ] Database created in `.amalfa/resonance.db`
- [ ] Stats command shows accurate counts
- [ ] Doctor reports healthy state
- [ ] MCP server starts successfully

---

## Phase 3: Multi-Source Configuration

**Objective:** Test multiple source directories

### Steps

1. **Create multi-source project**
   ```bash
   mkdir -p /tmp/amalfa-test-multi/{docs,notes,wiki}
   cd /tmp/amalfa-test-multi
   ```

2. **Create config file**
   ```bash
   cat > amalfa.config.json << 'EOF'
   {
     "sources": ["./docs", "./notes", "./wiki"],
     "database": ".amalfa/multi.db"
   }
   EOF
   ```

3. **Add files to each source**
   ```bash
   echo "# Documentation\nProject docs." > docs/doc1.md
   echo "# Personal Notes\nMy notes." > notes/note1.md
   echo "# Wiki Page\nWiki content." > wiki/wiki1.md
   ```

4. **Initialize**
   ```bash
   amalfa init
   ```
   - Expected: Shows "Sources: ./docs, ./notes, ./wiki"
   - Expected: Processes 3 files from different directories

5. **Verify all sources ingested**
   ```bash
   amalfa stats
   ls -la .amalfa/
   ```
   - Expected: 3 nodes from 3 different directories
   - Expected: Database file is `multi.db` (not default)

### Success Criteria
- [ ] Config file loaded correctly
- [ ] All 3 source directories scanned
- [ ] Files from each source ingested
- [ ] Custom database path honored
- [ ] Stats show correct counts

---

## Phase 4: Daemon & File Watching

**Objective:** Test real-time file watching

### Steps

1. **Start daemon**
   ```bash
   cd /tmp/amalfa-test-multi
   amalfa daemon start
   sleep 2
   amalfa daemon status
   ```
   - Expected: Daemon starts in background
   - Expected: PID file created (`.amalfa-daemon.pid`)
   - Expected: Status shows "running"

2. **Add new file**
   ```bash
   echo "# New Document" > docs/new.md
   sleep 5  # Wait for debounce + ingestion
   ```

3. **Verify update**
   ```bash
   amalfa stats  # Should show 4 nodes
   tail -20 .amalfa-daemon.log  # Check for update logs
   ```
   - Expected: Stats show 4 nodes
   - Expected: Log shows file change detected and processed

4. **Modify existing file**
   ```bash
   echo "\n## Updated Section" >> docs/doc1.md
   sleep 5
   tail -20 .amalfa-daemon.log
   ```
   - Expected: Log shows change detected
   - Expected: Database updated (hash changed)

5. **Delete file**
   ```bash
   rm docs/new.md
   sleep 5
   ```
   - Expected: Daemon handles deletion gracefully

6. **Stop daemon**
   ```bash
   amalfa daemon stop
   amalfa daemon status
   ```
   - Expected: Daemon stops cleanly
   - Expected: Status shows "stopped"
   - Expected: PID file removed

### Success Criteria
- [ ] Daemon starts and runs in background
- [ ] PID file created correctly
- [ ] File additions detected within 5 seconds
- [ ] File modifications detected
- [ ] File deletions don't crash daemon
- [ ] Daemon stops cleanly with no orphaned processes
- [ ] Log file contains expected events

---

## Phase 5: MCP Integration Test

**Objective:** Test MCP server with Claude Desktop

### Steps

1. **Configure Claude Desktop**
   - Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`
   ```json
   {
     "mcpServers": {
       "amalfa-test": {
         "command": "amalfa",
         "args": ["serve"],
         "cwd": "/tmp/amalfa-test-multi"
       }
     }
   }
   ```

2. **Restart Claude Desktop**
   - Quit and reopen Claude Desktop
   - Check MCP server status in settings

3. **Test each MCP tool**

   **Tool 1: search_knowledge**
   ```
   Prompt: "Search AMALFA for documents about 'wiki'"
   Expected: Returns wiki1.md with relevant score
   ```

   **Tool 2: get_node_content**
   ```
   Prompt: "Get the content of [node_id from previous search]"
   Expected: Returns full markdown content
   ```

   **Tool 3: find_related**
   ```
   Prompt: "Find documents related to [node_id]"
   Expected: Returns semantically similar nodes
   ```

   **Tool 4: get_graph_stats**
   ```
   Prompt: "What are the AMALFA database statistics?"
   Expected: Returns node/edge/embedding counts
   ```

   **Tool 5: discover_topics**
   ```
   Prompt: "What topics are in the AMALFA knowledge graph?"
   Expected: Returns clusters or topic keywords
   ```

4. **Verify responses match database content**
   - Cross-reference with `amalfa stats`
   - Verify search results are relevant

### Success Criteria
- [ ] Claude Desktop recognizes AMALFA server
- [ ] All 5 MCP tools respond without errors
- [ ] Search results are semantically relevant
- [ ] Node content retrieval works
- [ ] Related nodes make semantic sense
- [ ] Stats match CLI stats output
- [ ] No crashes or timeouts

---

## Phase 6: Real-World Project Test

**Objective:** Test with actual project documentation

### Steps

1. **Use PolyVis as test case**
   ```bash
   cd /tmp
   # Use existing PolyVis repo or create test copy
   mkdir polyvis-test && cd polyvis-test
   ```

2. **Create config**
   ```bash
   cat > amalfa.config.json << 'EOF'
   {
     "sources": ["../polyvis/docs", "../polyvis/playbooks"],
     "database": ".amalfa/polyvis.db"
   }
   EOF
   ```

3. **Initialize**
   ```bash
   time amalfa init
   ```
   - Expected: ~95 files processed
   - Expected: Completes in ~7 seconds
   - Expected: No errors or warnings

4. **Verify performance**
   ```bash
   amalfa stats
   ls -lh .amalfa/polyvis.db
   ```
   - Expected metrics:
     - Ingestion time: ~6-8 seconds (~13 files/sec)
     - Database size: ~800KB
     - Nodes: ~94
     - Embeddings: ~94

5. **Test search quality**
   - Use MCP to search for "CSS architecture"
   - Use MCP to search for "database schema"
   - Verify results are from correct playbooks/docs

### Success Criteria
- [ ] Large document set ingests successfully
- [ ] Performance meets expectations (>10 files/sec)
- [ ] Database size reasonable (~10KB per document)
- [ ] No memory issues or crashes
- [ ] Search results are high quality and relevant

---

## Phase 7: Edge Cases & Error Handling

**Objective:** Test error scenarios and boundary conditions

### Test Cases

#### 7.1: Missing Source Directory
```bash
cat > amalfa.config.json << 'EOF'
{"sources": ["./nonexistent"]}
EOF
amalfa init
```
- Expected: Warning message but doesn't crash
- Expected: "No valid source directories found" error

#### 7.2: Empty Source Directory
```bash
mkdir empty-dir
cat > amalfa.config.json << 'EOF'
{"sources": ["./empty-dir"]}
EOF
amalfa init
```
- Expected: Completes successfully with 0 nodes
- Expected: Database created but empty

#### 7.3: Invalid Markdown Files
```bash
echo "Not valid markdown {{{{ ]]]] ###" > broken.md
amalfa init
```
- Expected: Skips or handles gracefully
- Expected: Logs warning but continues

#### 7.4: Large File Test
```bash
# Create a 10MB markdown file
yes "# Test Section\nSome content here.\n" | head -n 100000 > large.md
amalfa init
```
- Expected: Processes without crashing
- Expected: May take longer but completes
- **TODO:** Implement file size limit (see below)

#### 7.5: Concurrent Access
```bash
amalfa daemon start
sleep 2
# While daemon is running
amalfa stats &
amalfa stats &
amalfa stats &
wait
```
- Expected: No database locking errors
- Expected: All commands complete successfully

#### 7.6: Rapid File Changes
```bash
amalfa daemon start
sleep 2
# Create 10 files rapidly
for i in {1..10}; do echo "# Doc $i" > "doc$i.md"; done
sleep 10
amalfa stats
```
- Expected: Debouncing batches changes
- Expected: All 10 files eventually ingested

#### 7.7: Special Characters in Filenames
```bash
touch "file with spaces.md"
touch "file-with-émoji-🎉.md"
amalfa init
```
- Expected: Handles gracefully
- Expected: Files ingested or skipped with warning

### Success Criteria
- [ ] Missing directories don't crash (warn only)
- [ ] Empty directories handled correctly
- [ ] Invalid markdown skipped gracefully
- [ ] Large files don't cause OOM
- [ ] No database locking under concurrent access
- [ ] Debouncing prevents rapid-fire updates
- [ ] Special characters in filenames handled

---

## Phase 8: Cleanup & Documentation

**Objective:** Verify cleanup and docs are correct

### Steps

1. **Check generated files**
   ```bash
   cd /tmp/amalfa-test-multi
   ls -la .amalfa/
   find . -name ".amalfa*"
   ```
   - Expected files:
     - `.amalfa/multi.db` (database)
     - `.amalfa/multi.db-shm` (shared memory)
     - `.amalfa/multi.db-wal` (write-ahead log)
     - `.amalfa-daemon.pid` (if daemon running)
     - `.amalfa-daemon.log` (daemon logs)

2. **Test cleanup**
   ```bash
   amalfa daemon stop  # Ensure stopped
   rm -rf .amalfa/
   rm .amalfa-daemon.*
   amalfa doctor
   ```
   - Expected: Doctor shows clean state

3. **Verify documentation accuracy**
   - [ ] README.md examples all work
   - [ ] `amalfa.config.example.ts` valid
   - [ ] MCP_TOOLS.md schemas match implementation
   - [ ] Installation instructions correct

### Success Criteria
- [ ] All generated files documented
- [ ] Cleanup removes all artifacts
- [ ] No orphaned processes after cleanup
- [ ] Documentation matches actual behavior

---

## Test Execution Checklist

### Pre-Release Checklist
- [ ] All Phase 1-8 tests pass
- [ ] No console errors during normal operation
- [ ] Performance benchmarks met
- [ ] Documentation complete and accurate
- [ ] Example configs work as written

### Known Issues
- TypeScript config warnings (legacy code, not blocking)
- Biome lint warnings in `scripts/lab/` (not critical)

### Test Results Template
```
Test Date: YYYY-MM-DD
Tester: [Name]
Version: 1.0.0

Phase 1: [PASS/FAIL] - Notes:
Phase 2: [PASS/FAIL] - Notes:
Phase 3: [PASS/FAIL] - Notes:
Phase 4: [PASS/FAIL] - Notes:
Phase 5: [PASS/FAIL] - Notes:
Phase 6: [PASS/FAIL] - Notes:
Phase 7: [PASS/FAIL] - Notes:
Phase 8: [PASS/FAIL] - Notes:

Overall: [PASS/FAIL]
```

---

## Edge Case Deep Dive: Large File Handling

### Problem
What happens if a user drops a huge markdown file (e.g., 100MB API documentation) into a watched folder? Current behavior is undefined and may cause:
- Excessive memory usage during embedding
- Long processing times blocking other updates
- Poor search quality (entire file as one chunk)

### Proposed Solution
Implement automatic file splitting for large documents:

1. **Detection:** Check file size before processing
2. **Threshold:** Files > 1MB trigger splitting
3. **Strategy:** Split by headers (H1/H2) or by token count
4. **Naming:** Create virtual nodes (e.g., `api-docs.md#section-1`)
5. **Graph:** Link split chunks with `part_of` edges

### Implementation Status
- [ ] TODO: Add file size check in AmalfaIngestor
- [ ] TODO: Implement markdown splitter utility
- [ ] TODO: Add configuration option for max file size
- [ ] TODO: Test with large real-world files

---

## Future Test Scenarios

### V1.1+ Features
- [ ] Multi-language support (non-English embeddings)
- [ ] Custom embedding models
- [ ] Graph visualization export
- [ ] Backup/restore database
- [ ] Incremental edge reweaving

### Performance Tests
- [ ] 1000+ file corpus
- [ ] Embedding generation benchmark
- [ ] Search latency under load
- [ ] Memory profiling during ingestion

---

**End of Test Plan**
