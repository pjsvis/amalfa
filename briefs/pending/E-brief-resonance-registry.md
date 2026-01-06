# Project Brief: Resonance Registry Module

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
