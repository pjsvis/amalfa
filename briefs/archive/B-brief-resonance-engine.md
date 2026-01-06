# Project Brief: The Resonance Engine (v1.1)

**Objective:**
To build a standalone CLI tool (`resonance`) that acts as an "Operational Memory" manager and "Knowledge Package Manager." It ingests artifacts into a local graph (`resonance.db`) and manages the acquisition of external Playbooks via a Registry.

**Constraints:**
* **Single Binary:** Compile via `bun build --compile`.
* **Zero Dependency:** End-user needs no external runtimes.
* **Local-First:** Data lives in `.resonance/`.
* **Registry-Aware:** Capable of fetching/updating Playbooks from a remote Git source.

---

## 1. Configuration Architecture
(Unchanged from v1.0)

## 2. The `resonance` CLI Commands

****A. `init` (Bootstrap & Discovery)****
* **Action:** Scaffolds environment and performs "Magic" discovery.
* **Flags:** `--magic` (Auto-detect stack and install playbooks).
* **Logic:**
    1.  Create config/folders.
    2.  **Heuristic Scan:** Check project for signature files (`bun.lockb`, `tailwind.config.js`).
    3.  **Auto-Install:** Fetch matching Playbooks from the Registry if `--magic` is used.

****B. `install` (Acquisition)****
* **Action:** Fetches specific playbooks from the Registry.
* **Usage:** `resonance install css-zero-magic` or `resonance install --magic`.
* **Logic:** Downloads Markdown files to `./playbooks/` and updates a lockfile/manifest.

****C. `sync` (Ingestion)****
* **Action:** The core ETL pipeline (Markdown -> Graph).
* **Logic:** Reads local files, parses frontmatter/regex, writes to `resonance.db`.

****D. `audit` (Reporting)****
* **Action:** Checks graph health and playbook currency.
* **Logic:**
    * **Graph Check:** Identify "Open Loops" (Debriefs vs. Playbooks).
    * **Drift Check:** Compare local Playbook hashes against the Registry upstream.

****E. `serve` (Interface)****
* **Action:** Spins up the Visualizer UI and **MCP Server**.
* **Logic:** Starts Bun server; exposes Cognitive Tools to external agents.

****F. `publish` (Sharing)****
* **Action:** Pushes a local playbook to the Registry (for team sharing).
* **Logic:** Git push or API call to the central playbook repository.

---

## 3. Implementation Plan

- [ ] **Core:** Config & Scaffolding (`src/config.ts`, `src/commands/init.ts`).
- [ ] **Registry:** Auto-Discovery & Fetching (`src/registry/*`). **(New)**
- [ ] **Graph:** Ingestion Engine (`src/etl/*`).
- [ ] **MCP:** Server & Tools (`src/mcp/*`).
- [ ] **UI:** Embedded Visualizer (`src/ui/*`).
```

-----

### 2\. New Brief: The Registry Module

**File:** `briefs/brief-resonance-registry.md`

*(New: Details the specific logic for "npm for Wisdom" functionality.)*

````markdown
## Project Brief: Resonance Registry Module

**Objective:**
Implement the "Package Manager" logic for Resonance, enabling the discovery, installation, and updating of Playbooks from a centralized repository.

**Core Concept:**
Treat Playbooks as **Vendored Dependencies**. We download them into the project (so they are editable), but track their upstream source for updates.

---

## 1. The Registry Structure
The "Registry" is simply a Git repository (or HTTP endpoint) with a specific structure.

**Manifest (`registry.json`):**
```json
{
  "packages": {
    "css-zero-magic": {
      "path": "css/zero-magic.md",
      "signatures": ["tailwind.config.js", "tailwind.config.ts"],
      "description": "Strict tokens, no magic numbers."
    },
    "bun-native": {
      "path": "backend/bun.md",
      "signatures": ["bun.lockb"],
      "description": "Bun-first workflows."
    }
  }
}
````

## 2\. Heuristic Auto-Discovery (The "Magic")

**Logic:** `src/registry/detector.ts`

1.  **Scan:** Walk the project root (depth 1 or 2).
2.  **Match:** Compare filenames against `signatures` in the Registry Manifest.
3.  **Result:** Return a list of recommended packages (e.g., `['bun-native', 'css-zero-magic']`).

## 3\. The `install` Workflow

**Logic:** `src/commands/install.ts`

1.  **Fetch:** Retrieve the raw Markdown content from the Registry URL.
2.  **Write:** Save to `./playbooks/[name].md`.
3.  **Metadata:** Append/Update `.resonance/resonance.lock.json`:
    ```json
    {
      "css-zero-magic": {
        "version": "1.2.0",
        "hash": "sha256...",
        "installed_at": "2025-12-07..."
      }
    }
    ```

## 4\. The `update` Workflow (Drift Management)

**Logic:** `src/commands/update.ts`

1.  **Check:** Fetch upstream content and calculate hash.
2.  **Compare:**
      * `Upstream Hash` vs `Lockfile Hash` (Has upstream changed?)
      * `Local File Hash` vs `Lockfile Hash` (Has user edited it?)
3.  **Resolution:**
      * *Safe:* User hasn't edited, Upstream changed -\> **Overwrite**.
      * *Conflict:* User edited, Upstream changed -\> **Prompt/Diff** (or save as `.new`).

-----

## 5\. Implementation Checklist

  - [ ] **Manifest Type:** Define TypeScript interface for Registry Manifest.
  - [ ] **Detector:** Implement file scanner (using `Bun.file().exists()`).
  - [ ] **Fetcher:** Implement `fetch()` logic for raw GitHub content.
  - [ ] **Lockfile:** Implement read/write logic for `resonance.lock.json`.
