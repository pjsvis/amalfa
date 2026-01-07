# Daemon Configuration Root Cause Analysis
**Date:** 2026-01-07  
**Issue:** Daemon watching wrong directories (polyvis paths instead of amalfa paths)

---

## Executive Summary

The daemon was watching `/Users/petersmith/Documents/GitHub/polyvis/docs` instead of `/Users/petersmith/Documents/GitHub/amalfa/docs` because:

1. **Config was outdated when daemon started**
2. **Daemon loads config ONCE at startup** - never hot-reloads
3. **Single Source of Truth was correct** - `amalfa.config.json`
4. **Discovery Process failed** - We didn't check WHEN the running daemon was started relative to config changes

---

## Timeline of Events

### Before Commit 8282109
- `amalfa.config.json` contained: `["../polyvis/docs", "../polyvis/playbooks"]`
- This was remnant from when AMALFA was testing against polyvis codebase

### 2026-01-07 13:36:28
- **Daemon PID 29000 started**
- Loaded config from `amalfa.config.json`
- Started watching: `/Users/petersmith/Documents/GitHub/polyvis/docs`
- Started watching: `/Users/petersmith/Documents/GitHub/polyvis/playbooks`
- **Log evidence:**
  ```
  {"component":"AmalfaDaemon","path":"/Users/petersmith/Documents/GitHub/polyvis/docs","msg":"👀 Watching directory"}
  {"component":"AmalfaDaemon","path":"/Users/petersmith/Documents/GitHub/polyvis/playbooks","msg":"👀 Watching directory"}
  ```

### Commit 8282109 (Later)
- `amalfa.config.json` updated to: `["./docs", "./playbooks", "./debriefs"]`
- **Daemon PID 29000 still running** - Unaware of config change
- Daemon continued watching OLD paths

### 2026-01-07 14:33:27
- **Daemon PID 29000 stopped** - `bun run cli.ts daemon stop`
- **Daemon PID 89802 started** - `bun run cli.ts daemon start`
- **New daemon loaded CURRENT config**
- Started watching correct paths: `./docs`, `./playbooks`, `./debriefs`

---

## Root Cause: Config Loading Architecture

### Current Behavior
**File:** `src/daemon/index.ts`

```typescript
async function main() {
  // Load configuration ONCE at startup
  const config = await loadConfig();  // Line 46
  const DEBOUNCE_MS = config.watch.debounce;
  const sources = config.sources || ["./docs"];  // Line 49
  
  // Start watchers (paths are fixed for daemon lifetime)
  for (const source of sources) {
    startWatcher(source, DEBOUNCE_MS);  // Line 66
  }
  
  // Keep process alive indefinitely
  await new Promise(() => {});  // Line 83
}
```

**During ingestion batches:**
```typescript
function triggerIngestion(debounceMs: number) {
  setTimeout(async () => {
    // Config IS reloaded for database/embedding settings
    const config = await loadConfig();  // Line 135
    const dbPath = join(process.cwd(), config.database);
    const ingestor = new AmalfaIngestor(config, db);
    await ingestor.ingest();  // Uses current config
  }, debounceMs);
}
```

### The Issue
1. **Watch paths** are set ONCE at daemon startup (line 49-66)
2. **Database config** IS reloaded per batch (line 135)
3. **Inconsistency:** Changing `config.sources` requires daemon restart
4. **Changing `config.database` or `config.embeddings`** works without restart

---

## Single Source of Truth Analysis

### ✅ What Worked
- **Config file:** `amalfa.config.json` is the single source of truth
- **Config loading:** `src/config/defaults.ts` correctly loads and merges config
- **Config precedence:** JSON → JS → TS (correct priority)

### ❌ What Failed
- **Runtime state vs config state:** Daemon held stale runtime state
- **Discovery process:** We didn't check daemon startup time vs config modification time
- **Validation:** No check that running daemon config matches current config file

---

## Truth Discovery Process - What We Should Have Done

### Step 1: Check Config File ✅
```bash
$ cat amalfa.config.json
{
  "sources": ["./docs", "./playbooks", "./debriefs"],  # Correct!
  ...
}
```

### Step 2: Check Running Daemon Config ❌ (We skipped this)
```bash
# Should have checked daemon logs for startup message
$ tail -100 .amalfa/logs/daemon.log | grep "sources"
{"sources":["../polyvis/docs","../polyvis/playbooks"]}  # STALE!
```

### Step 3: Check Daemon Start Time ❌ (We skipped this)
```bash
# Should have compared daemon PID start time to config modification time
$ ps -p 29000 -o lstart  # When daemon started
$ git log -1 --format="%ai" -- amalfa.config.json  # When config changed
```

### Step 4: Verification Query
```bash
# Should have queried: Is daemon watching what config says?
$ grep "Watching directory" .amalfa/logs/daemon.log | tail -3
```

---

## Solutions

### Immediate Fix (Applied)
✅ Restart daemon to pick up current config

### Short-term Fix Options

**Option A: Document behavior (chosen)**
- Add to README: "Daemon must be restarted after config changes"
- Add test that documents this behavior
- Create `daemon-realtime.test.ts` test suite

**Option B: Add config change detection**
```typescript
// Watch config file and restart watchers
watch("amalfa.config.json", async () => {
  log.warn("Config changed - restart daemon to apply");
  // Or: Auto-restart watchers
});
```

**Option C: Hot reload (future enhancement)**
```typescript
// Dynamically restart watchers when config changes
async function reloadWatchers() {
  // Stop old watchers
  for (const watcher of activeWatchers) {
    watcher.close();
  }
  // Reload config
  const config = await loadConfig();
  // Start new watchers
  for (const source of config.sources) {
    startWatcher(source);
  }
}
```

### Long-term Fix
- Implement hot-reload for config changes
- Add validation that checks running daemon config matches file
- Add `amalfa daemon status --verbose` to show watched paths

---

## Testing Strategy

### Created Test Suite
**File:** `tests/daemon-realtime.test.ts`

**Tests:**
1. ✅ Daemon watches correct directories from config
2. ✅ Daemon detects new file and updates database
3. ✅ Daemon detects file modification and updates
4. ✅ Daemon respects config `sources` array
5. ✅ Daemon loads config at startup, not runtime (documents limitation)

**Run tests:**
```bash
bun test tests/daemon-realtime.test.ts
```

### Manual Verification Steps

**1. Verify daemon reads current config:**
```bash
# Start daemon
amalfa daemon start

# Check logs immediately
tail -10 .amalfa/logs/daemon.log | grep "sources"

# Should show paths from amalfa.config.json
```

**2. Verify daemon detects file changes:**
```bash
# Create test file
echo "# Test" > docs/test-daemon.md

# Wait 2 seconds (debounce period)
sleep 2

# Check database
amalfa stats  # Nodes should increase by 1
```

**3. Verify config change requires restart:**
```bash
# Modify config
echo '{"sources": ["./docs", "./newdir"], ...}' > amalfa.config.json

# Check daemon log - should NOT show newdir
tail .amalfa/logs/daemon.log

# Restart daemon
amalfa daemon stop && amalfa daemon start

# Now check log - should show newdir
tail .amalfa/logs/daemon.log
```

---

## Lessons Learned

### Configuration Management
1. **Runtime state ≠ config file state** - Always verify
2. **Check process start time** - Compare to config modification
3. **Long-lived processes** - Need config reload or restart

### Discovery Process
1. **Don't assume config is loaded** - Verify what's actually running
2. **Check logs for startup messages** - They show what config was loaded
3. **Compare timestamps** - Process start vs config change

### Testing
1. **Real-time tests essential** - Unit tests can't catch this
2. **Integration tests with actual daemon** - Not just mocks
3. **Document limitations** - Tests can verify expected behavior

---

## Recommendations

### For Users
1. **After config changes:** Always restart daemon
2. **Check daemon is working:** `tail -f .amalfa/logs/daemon.log`
3. **Verify watched paths:** Look for "👀 Watching directory" messages

### For Developers
1. **Add config validation:** `amalfa daemon status --check-config`
2. **Add startup banner:** Show loaded config in logs
3. **Consider hot-reload:** For sources array changes
4. **Add health check:** Compare running state to config file

---

## Files Modified

### Created
- `tests/daemon-realtime.test.ts` - Comprehensive daemon test suite
- `docs/audits/DAEMON-CONFIG-ROOT-CAUSE.md` - This document

### To Review
- `src/daemon/index.ts` - Consider adding hot-reload
- `src/cli.ts` - Consider adding `daemon status --verbose` command

---

## Conclusion

**The system worked as designed.** The failure was in our discovery process:
- ✅ Config file was correct
- ✅ Config loading code was correct
- ✅ New daemon loaded correct config
- ❌ We didn't verify OLD daemon startup time vs config change time

**Key takeaway:** For long-lived processes, always check **when** the process started relative to **when** the config changed.

**Status:** ✅ Resolved - Daemon restarted with correct config  
**Prevention:** Real-time test suite added to catch this in future
