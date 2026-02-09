---
date: 2026-02-08
tags: [feature, streaming, sse, config, watcher, infrastructure]
agent: kilo-code
environment: local
---

# Task: Config Watcher/Sync System

**Objective:** Implement a real-time configuration synchronization system that watches `config.json` for changes and broadcasts updates to connected UI clients via Server-Sent Events (SSE).

- [ ] Create file watcher module that monitors config.json
- [ ] Implement SSE endpoint for broadcasting config changes
- [ ] Create client-side sync janitor for selective UI re-hydration
- [ ] Ensure SSOT (Single Source of Truth) is always the file

## Key Actions Checklist

- [ ] Create `src/components/watcher.ts` — File watcher using Node fs.watch
- [ ] Create SSE route `/system/sync` in Hono server
- [ ] Create `src/components/sync-janitor.ts` — Client-side EventSource handler
- [ ] Add `data-updatable="true"` attribute support to config-bound components
- [ ] Implement write-back validation via POST `/config/update` endpoint
- [ ] Add error handling for malformed JSON during writes

## Detailed Requirements

### 1. The Watcher Module (`watcher.ts`)

**Purpose:** Monitor `config.json` and emit events on change.

```typescript
// Expected interface
import { watch } from "node:fs";
import { EventEmitter } from "node:events";

export const configEmitter = new EventEmitter();

const watcher = watch("./config.json", async (event, filename) => {
  if (event === "change") {
    // Read and validate config
    // Emit "config-update" event with new config
  }
});
```

**Requirements:**

- Use Node's `fs.watch()` for OS-level file monitoring
- Parse and validate JSON before emitting
- Handle malformed JSON gracefully (log error, don't crash)
- Clean up watcher on SIGINT

### 2. The SSE Route (`/system/sync`)

**Purpose:** Broadcast config changes to connected clients.

```typescript
// Expected interface
app.get("/system/sync", (c) => {
  return c.streamSSE(async (stream) => {
    // Listen to configEmitter
    // Write SSE events on config-update
    // Implement heartbeat (30s interval)
    // Clean up listener on abort
  });
});
```

**Requirements:**

- Use Hono's `streamSSE` for Server-Sent Events
- Event type: `config-change`
- Include heartbeat to keep connections alive
- Proper cleanup when client disconnects

### 3. The Sync Janitor (`sync-janitor.ts`)

**Purpose:** Client-side script to receive SSE and update UI.

```typescript
// Expected behavior
const eventSource = new EventSource("/system/sync");

eventSource.addEventListener("config-change", (event) => {
  const newConfig = JSON.parse(event.data);

  // Find all data-updatable elements
  document.querySelectorAll('[data-updatable="true"]').forEach((block) => {
    // Extract config key from element ID
    // Update component state based on new value
  });
});
```

**Requirements:**

- Only update elements with `data-updatable="true"`
- Extract config key from element ID (e.g., `config_max_threshold` → `max_threshold`)
- Handle switches (update `data-state` and `aria-checked`)
- Handle dials (update `data-value` and display)
- Log sync events to console for debugging

### 4. The Write-Back Endpoint (`/config/update`)

**Purpose:** Validate and persist UI-triggerated config changes.

```typescript
// Expected interface
app.post("/config/update", async (c) => {
  const { key, value } = await c.req.json();

  // 1. Validate against schema
  // 2. Read current config
  // 3. Update key
  // 4. Write back to file
  // 5. File watcher will trigger broadcast
});
```

**Requirements:**

- Validate incoming changes against schema
- Atomic write (read-modify-write)
- File watcher triggers UI update (closed loop)
- Return success/error response

## Visual Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                     SERVER (Bun/Hono)                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │ watcher.ts  │───▶│ configEmitter│───▶│ /system/sync    │  │
│  │ (fs.watch)  │    │ (EventEmitter)│   │ (SSE endpoint)  │  │
│  └─────────────┘    └─────────────┘    └─────────────────┘  │
│         ▲                                       │            │
│         │                                       ▼            │
│  ┌─────────────┐                       ┌─────────────────┐  │
│  │config.json  │◀──────────────────────│ /config/update  │  │
│  │  (SSOT)     │                       │ (POST endpoint) │  │
│  └─────────────┘                       └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                                       ▲
         │ File change                   POST │
         ▼                                       │
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                        │
│  ┌─────────────────┐              ┌─────────────────────┐   │
│  │ sync-janitor.ts │◀─────────────│ ConfigBlock         │   │
│  │ (EventSource)   │   SSE        │ (data-updatable)    │   │
│  └─────────────────┘              └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Verification

- [ ] Manual test: Edit config.json, verify UI updates without refresh
- [ ] Manual test: Toggle switch in UI, verify config.json updates
- [ ] Manual test: Malformed JSON in config.json doesn't crash server
- [ ] Manual test: Client disconnect/reconnect works correctly
- [ ] Console logs show sync events with timestamps

## Best Practices

- **SSOT Law:** The UI must never update its internal state without confirmation from the file via SSE
- **Atomic Writes:** Use read-modify-write pattern to prevent race conditions
- **Graceful Degradation:** If SSE fails, UI should still function (just not live-update)
- **Logging:** All sync events should be logged for debugging

## Related Files

- `src/components/DESIGN-SYSTEM.md` — Section 9: Config Sync
- `src/components/tc-watcher-components-01.md` (archived) — Original design discussion
- `src/components/tc-watcher-components-02.md` (archived) — Original implementation notes
