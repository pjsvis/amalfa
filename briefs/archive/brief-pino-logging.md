# Brief: Structured Logging with Pino

**Locus Tag:** `[Locus: Structured_Logging]`

## Problem Statement
The codebase currently relies on ~1,009 ad-hoc `console.log`, `warn`, and `error` statements. This "printf debugging" approach creates several issues:
1.  **Noise:** difficult to filter or query logs during complex operations.
2.  **Lack of Context:** logs often lack structural context (e.g., which gardener instance generated the message).
3.  **Performance:** `console.log` is synchronous and blocking in many environments.
4.  **Verification Gap:** As the system scales (e.g., 185k docs), manually verifying behavior via scrolling text is impossible.

## Proposed Solution: Pino Integration
Integrate **Pino**, a high-performance, structured logging library.

### Core Architecture
Create a centralized `Logger` factory in `src/utils/Logger.ts` that provides configured instances.

```typescript
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty", // Pretty print for dev, JSON for prod
    options: {
      colorize: true,
      ignore: "pid,hostname",
      translateTime: "SYS:standard",
    },
  },
  base: undefined, // Remove pid/hostname from base object for cleaner logs
});

// Usage pattern: Child loggers for context
export const getLogger = (component: string) => logger.child({ component });
```

### Implementation Strategy

1.  **Dependencies:**
    *   `npm install pino`
    *   `npm install -D pino-pretty`

2.  **Migration Pattern:**
    Replace console calls with semantic logging:

    *   `console.log("Starting...")` → `log.info("Starting...")`
    *   `console.warn("Warning!")` → `log.warn("Warning!")`
    *   `console.error(err)` → `log.error({ err }, "Operation failed")`

3.  **Incremental Adoption Plan (Priority Order):**
    *   **Phase 1: Core Infra** (Daemon, MCP Server, Database Class) — Critical for observability.
    *   **Phase 2: Pipeline** (Ingestor, Harvester) — Critical for data verification.
    *   **Phase 3: Gardeners** (AutoTagger, etc.) — Context-heavy operations.
    *   **Phase 4: Scripts** — Low priority, can remain console.log for simple CLI output.

## Benefits
*   **Verification:** verifiable audit trails (e.g., "Show me all errors from the AutoTagger in the last run").
*   **Performance:** ~5x faster than console logging.
*   **Observability:** structured JSON allows for future ingestion into log analysis tools if needed.

## Verification
*   Logs appear in pretty format during local `bun run`.
*   Logs capture distinct contexts (e.g., `[Ingestor]`, `[MCP]`).
*   Error objects are serialized correctly.

## Next Steps
1.  Approve this brief.
2.  Install dependencies.
3.  Create `src/utils/Logger.ts`.
4.  Refactor `mcp/index.ts` and `resonance/db.ts` as the first test subjects.
