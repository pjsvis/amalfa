---
date: 2026-01-07
tags: [refactor, service-lifecycle, notifications, zombie-defense, directory-structure]
---

## Debrief: .amalfa Directory Reorganization

## Accomplishments

- **Consolidated runtime files into `.amalfa/` directory structure:**
  - Created `AMALFA_DIRS` constant with base, logs, and runtime paths
  - Added `initAmalfaDirs()` function to ensure directories exist
  - Structure: `.amalfa/logs/` for log files, `.amalfa/runtime/` for PID files, `.amalfa/resonance.db` for database
  - Moved from cluttering project root with `.vector-daemon.pid`, `.amalfa-daemon.log`, etc. to organized structure
  
- **Updated all services to use new paths:**
  - `src/utils/ServiceLifecycle.ts` - Calls `initAmalfaDirs()` in `start()` and `serve()` methods
  - `src/utils/DaemonManager.ts` - Uses new paths for daemon PID/log files
  - `src/mcp/index.ts` - MCP server lifecycle uses `.amalfa/runtime/mcp.pid` and `.amalfa/logs/mcp.log`
  - `src/resonance/services/vector-daemon.ts` - Updated to use `AMALFA_DIRS` paths
  - `src/daemon/index.ts` - File watcher daemon uses `AMALFA_DIRS` paths
  - `src/pipeline/PreFlightAnalyzer.ts` - Pre-flight logs go to `.amalfa/logs/pre-flight.log`
  
- **Fixed ServiceLifecycle PID file bug:**
  - Discovered that `serve()` method wasn't writing PID to file (only `start()` was)
  - Added `await Bun.write(this.config.pidFile, process.pid.toString())` in `serve()` method
  - This ensures detached services can be properly tracked and managed
  
- **Fixed ZombieDefense false positives:**
  - Issue: When running `amalfa daemon restart` or `amalfa vector restart`, ZombieDefense flagged parent CLI process as unknown
  - Root cause: Parent process `bun run src/cli.ts daemon restart` matches CWD filter but wasn't whitelisted
  - Solution: Added explicit filtering for CLI parent processes (lines 85-93 in `ZombieDefense.ts`)
  - Now ignores `src/cli.ts`, `cli.ts daemon`, `cli.ts vector`, `cli.ts servers` parent processes
  
- **Implemented cross-platform notifications:**
  - Created `src/utils/Notifications.ts` with `sendNotification()` function
  - **macOS support:** Uses `osascript` with AppleScript `display notification` command
  - **Linux support:** Uses `notify-send` (requires libnotify package)
  - Proper escaping for AppleScript strings (backslashes and quotes)
  - Timeout protection (5 seconds) to prevent hanging on failed notifications
  - Graceful failure - notifications are non-critical and fail silently
  - Replaced old broken implementation in `src/daemon/index.ts`
  
- **Updated .gitignore:**
  - Changed from ignoring `.amalfa/` entirely to specifically ignoring `.amalfa/logs/` and `.amalfa/runtime/`
  - This allows `.amalfa/resonance.db` to be tracked by git if desired (though it's still ignored via separate rule)

## Problems

- **Initial PID files were empty:**
  - After first implementation, PID files were created but remained empty (0 bytes)
  - Investigation: Checked ServiceLifecycle code and found `serve()` method never wrote PID
  - Only `start()` method wrote PID (for the subprocess), but the actual serving process wasn't writing its own PID
  - Fix: Added PID write to `serve()` method at line 143
  
- **Port conflict during testing:**
  - Vector daemon restart failed with `EADDRINUSE` on port 3010
  - Zombie process from earlier testing was still holding the port
  - Had to manually kill with `lsof -ti:3010 | xargs kill -9`
  - ZombieDefense should have caught this, but process wasn't matching filters
  
- **ZombieDefense too aggressive:**
  - Initially detected CLI parent processes as "unknowns" because they:
    1. Contained the project CWD path
    2. Weren't in the WHITELIST
    3. Were still running during subprocess startup
  - This caused `restart` commands to fail with "ZOMBIE PROCESSES DETECTED" errors
  - Solution was to add specific filtering for CLI launcher processes
  
- **Old files left in project root:**
  - After implementing new structure, old PID/log files remained in root
  - Had to manually clean up: `.amalfa-daemon.log`, `.amalfa-daemon.pid`, `.amalfa-pre-flight.log`, `.vector-daemon.log`, `.vector-daemon.pid`
  - This is expected behavior - old files don't auto-migrate
  - Users upgrading will need to clean up old files manually (or we could add migration script)

## Lessons Learned

- **Directory structure needs to be created early:**
  - Created `initAmalfaDirs()` function that's called by ServiceLifecycle before any file operations
  - Using `mkdirSync(..., { recursive: true })` ensures parent directories are created
  - Better to centralize directory creation than scatter it across multiple services
  
- **PID files must be written by the serving process, not the launcher:**
  - The `start()` method spawns a subprocess and writes that subprocess's PID
  - But the subprocess must also write its own PID when it starts serving
  - This is because the subprocess is the actual long-running process that needs to be tracked
  - Without this, PID files get truncated or left empty
  
- **ZombieDefense needs parent process filtering:**
  - When services are launched via CLI, there's a legitimate parent process chain:
    - `bun run src/cli.ts daemon start` (parent)
    - `bun run src/daemon/index.ts serve` (child, detached)
  - The parent process is transient and should be ignored
  - Solution: Check for CLI process patterns and skip them during zombie scanning
  - Alternative considered: Use PPID filtering, but process patterns are more explicit
  
- **Cross-platform notifications require command detection:**
  - Can't assume `osascript` is available on Linux or `notify-send` on macOS
  - Using `platform()` from `node:os` to detect OS
  - Using `spawn()` with error handling to gracefully fail if command doesn't exist
  - Timeout protection prevents notifications from blocking the main process
  
- **spawn() vs Bun.spawn() for notifications:**
  - Original implementation used `Bun.spawn()` but didn't wait for completion
  - Switched to `spawn()` from `node:child_process` with proper promise wrapping
  - This allows awaiting completion and proper error handling
  - Using `stdio: "ignore"` to prevent notification output from cluttering logs
  
- **Breaking changes need documentation:**
  - The .amalfa directory reorganization is a breaking change for users
  - Their existing PID/log files will be in the old locations
  - Services will create new files in new locations
  - Should document this in CHANGELOG.md with migration instructions
  - For npm package users, this is fine since they're installing fresh

## Verification

**Directory Structure:**
```
.amalfa/
├── logs/
│   ├── daemon.log
│   ├── vector-daemon.log
│   └── mcp.log (when MCP running)
└── runtime/
    ├── daemon.pid
    ├── vector-daemon.pid
    └── mcp.pid (when MCP running)
```

**Code Changes:**
- `src/config/defaults.ts` - Added AMALFA_DIRS and initAmalfaDirs() ✅
- `src/utils/ServiceLifecycle.ts` - Uses new paths, writes PID in serve() ✅
- `src/utils/DaemonManager.ts` - Uses new paths ✅
- `src/mcp/index.ts` - Uses new paths ✅
- `src/resonance/services/vector-daemon.ts` - Uses new paths ✅
- `src/daemon/index.ts` - Uses new paths, imports new Notifications ✅
- `src/pipeline/PreFlightAnalyzer.ts` - Uses new log path ✅
- `src/utils/ZombieDefense.ts` - Filters CLI parent processes ✅
- `src/utils/Notifications.ts` - New cross-platform notification utility ✅
- `.gitignore` - Updated to ignore logs/ and runtime/ subdirs ✅

**Testing:**
- Vector daemon start/stop/restart ✅
- File watcher daemon start/stop/restart ✅
- `amalfa servers` command shows correct status ✅
- PID files contain valid PIDs ✅
- Log files created in correct locations ✅
- No files created in project root ✅
- ZombieDefense doesn't flag CLI parent processes ✅
- Notifications work on macOS ✅

## Next Steps

- **Bump version to 1.0.17 and publish to npm**
- **Update CHANGELOG.md** with breaking change notice about directory reorganization
- **Consider migration script** for users upgrading from pre-1.0.17 versions
  - Could detect old PID/log files in root
  - Prompt to clean them up
  - Or automatically move them to new locations
- **Test Linux notification support** (requires Linux machine with libnotify)
- **Consider Windows notification support** (PowerShell toast notifications)
- **Document notification behavior** in README or docs

## Playbook Updates

No playbook updates needed. The changes follow existing patterns from:
- `playbooks/development-workflow-playbook.md` - Service lifecycle management
- `playbooks/change-management-protocol.md` - Plan → Execute → Verify → Debrief
