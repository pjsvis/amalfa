# Scripts & CLI Playbook

## Purpose
The definitive guide to **Development Tooling**, **Script Organization**, and the **Code Promotion Lifecycle** within the Amalfa project.

---

## 1. Development Standards

### The "Single Source of Truth" Rule
All scripts must use the central `DatabaseFactory` to access the knowledge graph.
*   **DO NOT** use `new Database('./resonance.db')`.
*   **DO** use `ResonanceDB.init()` or `DatabaseFactory.connectToResonance()`.

### The FAFCAS Philosophy
We balance velocity and stability by tiering code:

| Tier | Directory | Strictness | Purpose |
| :--- | :--- | :--- | :--- |
| **1. Source** | `src/` | **High** | Production binary, user-facing CLI. Must be perfect. |
| **2. Factory** | `scripts/verify` | **Medium** | CI checks, release automation. Must be reliable. |
| **3. The Lab** | `scripts/lab` | **None** | Experiments, one-offs. "Vibe coding." |

---

## 2. Script Registry
We maintain a canonical registry of tools in `src/config/scripts-registry.json`.

**To list available tools:**
```bash
bun run amalfa scripts list
```

**Output Context:**
*   **Dev Mode (In Repo):** Shows ALL scripts (Core, Lab, Maintenance).
*   **User Mode (NPM Install):** Shows only user-facing commands (`amalfa validate`, etc.).

---

## 3. Core CLI Tools

### Developer Environment (`dev`)
```bash
bun run dev        # Start Web + CSS Watcher + JS Watcher
bun run dev start  # Run in background
```

### Resonance Daemon (`daemon`)
Watches the file system and updates the graph in real-time.
```bash
bun run amalfa daemon start
```

### Phi3 AI Agent (`phi3`)
Provides semantic search and chat intelligence.
```bash
bun run amalfa phi3 start
```

### Validation (`verify`)
Ensures database integrity.
```bash
bun run verify      # Basic connectivity
bun run verify:health # Deep structural check
```

---

## 4. Code Promotion Lifecycle

How a script graduates from an experiment to a product feature.

### Stage 1: The Lab (`scripts/lab`)
*   **Status**: `dev`
*   **Audience**: You (the developer).
*   **Quality**: "It works on my machine." No linting required.
*   **Registry**: Hidden from end-users.

### Stage 2: The Factory (`scripts/verify`)
*   **Status**: `dev`
*   **Audience**: The Team / CI.
*   **Quality**: Strict types (`noImplicitAny`). Must pass lint.
*   **Action**:
    1.  Refactor `scripts/lab/my-tool.ts` to `scripts/verify/my-tool.ts`.
    2.  Add types and error handling.
    3.  Add to `scripts-registry.json` (Category: `verify`, Type: `dev`).

### Stage 3: The Product (`src/cli`)
*   **Status**: `user`
*   **Audience**: The Customer.
*   **Quality**: Production grade.
    *   Friendly error messages (no stack traces).
    *   `--help` support.
    *   Robust argument parsing.
*   **Action**:
    1.  Wrap logic in a command function in `src/cli/commands/`.
    2.  Register in `src/cli.ts` (Dynamic import).
    3.  Update `scripts-registry.json` (Type: `user`).

---

## 5. Zombie Defense
All core daemons implement **Zombie Defense** to prevent database locks (`SQLITE_BUSY`).
*   **Mechanism**: On startup, scan for processes holding `resonance.db` locks.
*   **Policy**: If a zombie is found, **kill it** before starting.
*   **Safety**: Self-check prevents a process from killing its own parent.

---

## 6. Maintenance Commands
*   `bun run precommit`: Lint, format, and test.
*   `bun run build`: Compile TypeScript and CSS.
*   `amalfa cleaner`: (Coming soon) Prune orphaned nodes.
