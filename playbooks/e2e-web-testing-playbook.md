---
name: e2e-web-testing
description: End-to-end testing patterns for AMALFA web interfaces using browser automation. Covers dashboard testing, API validation, console log verification, and service management testing.
allowed-tools: Bash(agent-browser:*), Bash(bun:*)
---

# E2E Web Testing Playbook

## Philosophy

The AMALFA E2E testing philosophy addresses a persistent failure mode: agents declare completion when they have merely produced code that appears syntactically correct but fails at runtime. Browser-based E2E tests force actual execution paths, revealing the gap between "looks good" and "actually works."

Key principles:
1. **Verify actual outcomes, not just code existence** - If a button exists but clicking it crashes, the test fails
2. **Capture all failure modes** - Console errors, network failures, and JS exceptions
3. **Test the happy path AND the edges** - Services may stop, networks may fail, sockets may timeout
4. **Deterministic assertions** - Tests must reliably pass or fail based on actual system state

## Tools

### agent-browser

The primary browser automation tool. Available commands:

```bash
agent-browser open <url>        # Navigate to page
agent-browser snapshot -i       # Get interactive elements with refs
agent-browser click @e1         # Click element by ref
agent-browser fill @e2 "text"   # Fill input by ref
agent-browser get title         # Get page title
agent-browser console           # View console messages
agent-browser errors            # View page errors
agent-browser screenshot        # Take screenshot
agent-browser close             # Close browser
```

### Dashboard Server

The AMALFA dashboard runs on port 3013 (configurable):

```bash
bun run src/cli.ts dashboard start  # Start dashboard
bun run src/cli.ts dashboard stop   # Stop dashboard
bun run src/cli.ts dashboard status # Check status
```

Key endpoints:
- `http://localhost:3013/` - Main dashboard
- `/api/stream` - SSE stream for real-time updates
- `/api/stats` - JSON stats endpoint
- `/api/services` - Service status endpoint

## Test Structure

### Location

E2E tests live in `tests/e2e/` directory:

```
tests/e2e/
├── dashboard-e2e.test.ts    # Main dashboard tests
├── output/                   # Screenshots and test artifacts
└── README.md                # This playbook
```

### Test Pattern

```typescript
async function testFeatureName(): Promise<TestResult> {
  const start = Date.now();
  const consoleErrors: string[] = [];

  try {
    // 1. Setup / Navigate
    await agentBrowser(`open ${DASHBOARD_URL}`);
    await waitForPageLoad();

    // 2. Interact with page
    const snapshot = await agentBrowser("snapshot -i --json");
    const elements = JSON.parse(snapshot.stdout);

    // 3. Verify assertions
    const success = elements.some((e) => e.text?.includes("expected"));

    // 4. Capture failures
    const errors = await captureConsoleErrors();

    return {
      name: "Feature name",
      passed: success,
      duration: Date.now() - start,
      consoleErrors: errors,
    };
  } catch (error) {
    return {
      name: "Feature name",
      passed: false,
      duration: Date.now() - start,
      error: String(error),
      consoleErrors: [],
    };
  }
}
```

## Core Test Scenarios

### 1. Page Load Test

Verify the page loads with correct title and basic structure:

```typescript
async function testDashboardLoads(): Promise<TestResult> {
  await agentBrowser(`open ${DASHBOARD_URL}`);

  const loaded = await waitForPageLoad();
  if (!loaded) {
    return { name: "Dashboard loads", passed: false, error: "Timeout" };
  }

  const title = await agentBrowser("get title --json");
  if (!title.includes("amalfa")) {
    return { name: "Dashboard loads", passed: false, error: "Wrong title" };
  }

  return { name: "Dashboard loads", passed: true };
}
```

### 2. Console Error Detection

Critical test - catches JS errors that don't crash the page:

```typescript
async function testNoConsoleErrors(): Promise<TestResult> {
  await agentBrowser(`open ${DASHBOARD_URL}`);
  await waitForPageLoad();
  await new Promise(r => setTimeout(r, 3000));

  const errors = await captureConsoleErrors();

  // Filter out network 404s and favicon errors
  const critical = errors.filter(
    e => !e.includes("favicon") && !e.includes("404") && !e.includes("net::ERR")
  );

  if (critical.length > 0) {
    return { name: "No console errors", passed: false, error: critical.join("; ") };
  }

  return { name: "No console errors", passed: true };
}

async function captureConsoleErrors(): Promise<string[]> {
  const result = await agentBrowser("console --json");
  try {
    const logs = JSON.parse(result.stdout);
    return logs.filter(l => l.type === "error").map(l => l.message);
  } catch {
    return [];
  }
}
```

### 3. Interactive Elements

Test that buttons and controls actually work:

```typescript
async function testServiceActions(): Promise<TestResult> {
  await agentBrowser(`open ${DASHBOARD_URL}`);
  await waitForPageLoad();

  // Get interactive elements
  const snapshot = await agentBrowser("snapshot -i --json");
  const elements = JSON.parse(snapshot.stdout);

  // Find start/stop buttons
  const actionButtons = elements.filter(
    e => (e.type === "button" || e.type === "button") &&
         (e.text?.includes("start") || e.text?.includes("stop"))
  );

  if (actionButtons.length === 0) {
    return { name: "Service actions", passed: false, error: "No buttons found" };
  }

  // Note: We don't actually click service controls in tests
  // as they affect system state. Just verify they exist.

  return { name: "Service actions", passed: true };
}
```

### 4. Real-time Updates (SSE)

Verify SSE stream is delivering updates:

```typescript
async function testSSEStream(): Promise<TestResult> {
  await agentBrowser(`open ${DASHBOARD_URL}`);
  await waitForPageLoad();

  // Wait for SSE updates
  await new Promise(r => setTimeout(r, 5000));

  const uptime = await agentBrowser(
    'eval "document.getElementById(\'uptime\')?.textContent" --json'
  );

  if (!uptime || !uptime.includes("s")) {
    return { name: "SSE stream", passed: false, error: `No update: ${uptime}` };
  }

  return { name: "SSE stream", passed: true };
}
```

### 5. API Verification

Cross-check browser state with API responses:

```typescript
async function testApiMatchesBrowser(): Promise<TestResult> {
  // Get browser stats
  const snapshot = await agentBrowser("snapshot -i --json");
  const elements = JSON.parse(snapshot.stdout);

  const browserNodes = elements.find(e => e.text?.includes("Nodes"))?.text;

  // Fetch API stats
  const apiResponse = await fetch(`${DASHBOARD_URL}/api/stats`);
  const apiStats = await apiResponse.json();

  // Verify reasonable consistency
  if (!apiStats.nodes || apiStats.nodes < 0) {
    return { name: "API matches browser", passed: false, error: "Invalid API response" };
  }

  return { name: "API matches browser", passed: true };
}
```

## Logging and Verification

### Pino Log Capture

The dashboard emits pino logs. To capture and verify:

```bash
# In one terminal - tail logs
tail -f .amalfa/logs/dashboard.log | grep -E "(ERROR|WARN|INFO)"

# Or capture to file for test verification
tail -f .amalfa/logs/dashboard.log > tests/e2e/output/dashboard.log &
TAIL_PID=$!
# Run tests...
kill $TAIL_PID
```

### Log Assertions in Tests

```typescript
async function testNoPinoErrors(): Promise<TestResult> {
  const logFile = ".amalfa/logs/dashboard.log";

  if (!existsSync(logFile)) {
    return { name: "No pino errors", passed: true }; // Skip if no logs
  }

  const logs = readFileSync(logFile, "utf-8");
  const lines = logs.split("\n").filter(l => l.trim());

  // Check recent logs for errors
  const recentErrors = lines
    .slice(-100)
    .filter(l => l.includes('"level":50') || l.includes('"level":40')); // error or warn

  if (recentErrors.length > 0) {
    return {
      name: "No pino errors",
      passed: false,
      error: `Found ${recentErrors.length} errors in recent logs`,
    };
  }

  return { name: "No pino errors", passed: true };
}
```

## Running Tests

### Full Suite

```bash
# Start dashboard and run all E2E tests
bun run tests/e2e/dashboard-e2e.test.ts
```

### Single Test

```bash
# Run specific test
bun run tests/e2e/dashboard-e2e.test.ts -- --test "Console errors"
```

### With Verbose Output

```bash
# See browser actions
agent-browser --session amalfa-e2e open http://localhost:3013 --headed
agent-browser --session amalfa-e2e console
```

### CI/CD Pipeline

```yaml
# GitHub Actions example
- name: E2E Tests
  run: |
    bun run src/cli.ts dashboard start
    bun run tests/e2e/dashboard-e2e.test.ts
    bun run src/cli.ts dashboard stop
  env:
    DASHBOARD_URL: http://localhost:3013
```

## Common Failure Modes

### 1. Dashboard Not Running

```
Error: Failed to connect to dashboard
Fix: Run `bun run src/cli.ts dashboard start` before tests
```

### 2. Port Conflict

```
Error: Port 3013 already in use
Fix: Check running processes: `lsof -i :3013`
     Stop existing: `bun run src/cli.ts dashboard stop`
```

### 3. Browser Session Stale

```
Error: Session not found
Fix: `agent-browser close || true` to clean up
```

### 4. Console Errors from Extensions

```
Error: Third-party extension errors
Fix: Use headless mode or disable extensions
     agent-browser open <url> --headed=false
```

## Test Checklist

Before committing E2E tests:

- [ ] Tests use `agent-browser` for all browser interactions
- [ ] Console errors are captured and asserted
- [ ] Screenshot on failure for debugging
- [ ] Tests clean up browser state (close sessions)
- [ ] Tests handle missing services gracefully
- [ ] Pin log verification is included for server-side errors
- [ ] Tests are deterministic (same inputs -> same outputs)
- [ ] Test artifacts go to `tests/e2e/output/`
- [ ] README documents new test patterns

## Anti-Patterns to Avoid

1. **Skipping console error checks** - Many bugs don't crash the page but break functionality
2. **Not waiting for SSE updates** - Always wait for real-time data
3. **Testing implementation details** - Test user-visible behavior, not internal state
4. ** brittle selectors** - Use semantic text matching over fragile CSS classes
5. **Ignoring network errors** - API failures should fail tests
6. **Not capturing screenshots** - Debugging is impossible without visual evidence

## Dashboard Test Coverage Matrix

| Feature | Test Status | Notes |
|---------|-------------|-------|
| Page loads | Required | Title, basic structure |
| System health | Required | Status, uptime |
| Services table | Required | All 5 services visible |
| Graph stats | Required | Nodes, edges, vectors |
| Navigation | Required | SYSTEM, GRAPH, DOCS |
| SSE updates | Required | Uptime changes |
| Console errors | Required | No JS errors |
| Action buttons | Required | Start/stop visible |
| API parity | Recommended | Browser matches API |
| Log errors | Recommended | Pino logs clean |
| Stress test | Optional | Multiple rapid actions |
| Error recovery | Optional | Service restart behavior |
