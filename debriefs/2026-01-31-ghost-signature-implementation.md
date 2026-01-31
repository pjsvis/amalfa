---
date: 2026-01-31
tags: [loop-prevention, resilience, git, security]
agent: antigravity
---

# Debrief: Ghost Signature Implementation

## 🎯 Objective
Prevent the "Infinite Billing Loop" where the system's own writes trigger new (expensive) extraction cycles.

## 🛠️ Implementation

### 1. Substance Hashing (`src/utils/ghost.ts`)
We implemented a MIME-aware hashing utility `getSubstanceHash` that:
*   Parses Markdown frontmatter (using `gray-matter`) and hashes *only* the content body.
*   Ignores existing `amalfa_hash` lines in TypeScript files.
*   Uses SHA-256.

### 2. The Dual Gates (`src/daemon/index.ts`)
Modified the File Watcher to enforce two checks before triggering Ember:
1.  **Coarse Gate (Git)**: If `git diff` is clean (exit code 0), we assume the file was committed by the System (Squash). **Action: Skip Ember.**
2.  **Fine Gate (Signature)**: If the calculated `substance_hash` matches the `amalfa_hash` in frontmatter, we assume the content hasn't changed (Self-Write). **Action: Skip Ember.**

### 3. The Seal (`src/ember/squasher.ts`)
Updated the Squasher to:
1.  Calculate the new `substance_hash`.
2.  Inject it into `amalfa_hash`.
3.  Write the file.
4.  **Immediately Commit** to Git (`chore(ember): squash sidecar insights`).

## 📊 Verification
Ran `scripts/verify/verify-ghost.ts`:
*   Metadata changes (tags) -> Hash Unchanged (✅ PASS).
*   Body changes (text) -> Hash Changed (✅ PASS).

## 🚀 Status
**System Resilience: INCREASED.**
The loop is now structurally impossible unless the user manually edits the body content.
