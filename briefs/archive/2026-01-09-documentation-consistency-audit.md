---
title: "Brief: Documentation Consistency Audit"
date: 2026-01-09
type: brief
tags: [documentation, gap-analysis, consistency, proposal]
---

# Brief: Documentation Consistency Audit

**Objective:** Align all documentation with the current code capabilities of Amalfa v1.0.34.

---

## Executive Summary

An analysis of the knowledge graph reveals a significant **Code-Documentation Drift**. Several critical documents describe legacy systems ("PolyVis", "Olmo-3 Triad") that no longer exist or have been superseded by the current Amalfa architecture. This creates confusion for new users and AI agents alike.

This brief proposes a targeted update plan to bring the documentation into alignment with the codebase.

---

## 1. Gap Analysis: Code vs. Documentation

### Source of Truth: `src/cli.ts`
The definitive list of capabilities is derived from the CLI dispatcher. This is the **Code Truth**.

| Current CLI Command | Function | Status |
| :--- | :--- | :--- |
| `amalfa init` | Ingest markdown, build vectors | ✅ Documented |
| `amalfa serve` | Start MCP server | ✅ Documented |
| `amalfa stats` | Show database statistics | ✅ Documented |
| `amalfa validate` | Pre-publish health check | ❌ **Undocumented** |
| `amalfa doctor` | Check installation | ✅ Documented |
| `amalfa setup-mcp` | Generate MCP config JSON | ❌ **Undocumented** |
| `amalfa daemon <action>` | File watcher service | ⚠️ Partially Documented |
| `amalfa vector <action>` | Vector daemon service | ⚠️ Partially Documented |
| `amalfa sonar <action>` | Sonar AI agent | ✅ Documented (Playbooks) |
| `amalfa enhance <doc>` | AI-powered doc enhancement | ❌ **Undocumented** |
| `amalfa servers` | Service status dashboard | ❌ **Undocumented** |
| `amalfa scripts list` | Show available scripts | ❌ **Undocumented** |

---

## 2. Stale Documentation Identified

### Critical: `docs/services.md`
**Status:** ❌ **Outdated (Legacy)**
**Issue:** This document describes a "PolyVis Triad" architecture based on `llama.cpp` servers (`Olmo-3`, `Phi-3.5`, `Llama-3`). This system **does not exist** in the current codebase.
**Impact:** Severely misleading for new users. The `amalfa servers` command now shows a completely different set of services (Vector Daemon, Sonar Agent, MCP Server).
**Recommendation:** **Archive** to `docs/archive/` and replace with a new `docs/services.md` reflecting the current architecture.

### Moderate: `docs/user-guide.md`
**Status:** ⚠️ **Partially Outdated**
**Issue:** References legacy commands (`bun run build:data`, `bun run mcp`, `bun run resonance/src/daemon.ts`). These have been superseded by the unified `amalfa` CLI.
**Impact:** Users will get "command not found" errors if they follow the guide.
**Recommendation:** **Update** to use `amalfa init`, `amalfa serve`, `amalfa vector start`.

### Minor: `playbooks/sonar-manual.md` & `sonar-system-overview.md`
**Status:** ✅ Mostly Current
**Issue:** Minor discrepancies. Refers to `phi3:latest` as default when the config now prefers `qwen2.5:1.5b`.
**Recommendation:** **Patch** model references to reflect new tiered defaults.

---

## 3. Missing Documentation Identified

The following capabilities exist in code but have **no dedicated documentation**:

| Missing Topic | Code Location | Proposed Doc Location |
| :--- | :--- | :--- |
| **`amalfa validate`** | `src/cli.ts:cmdValidate` | `docs/guides/publishing.md` |
| **`amalfa setup-mcp`** | `src/cli.ts:cmdSetupMcp` | `docs/setup/mcp-client-setup.md` (Update) |
| **`amalfa enhance`** | `src/cli/enhance-commands.ts` | `playbooks/enhance-playbook.md` |
| **`amalfa servers`** | `src/cli.ts:cmdServers` | `docs/services.md` (New) |
| **OpenRouter Cloud Config** | `src/config/defaults.ts:cloud` | `docs/guides/cloud-inference.md` |
| **Tiered Model Strategy** | `src/daemon/sonar-inference.ts` | `playbooks/inference-playbook.md` (Update) |

---

## 4. Proposal: Documentation Update Plan

### Phase 1: Archival (Immediate)
1.  **Move** `docs/services.md` to `docs/archive/legacy-services-polyvis.md`.
2.  Add a deprecation notice header to the archived file.

### Phase 2: Core Updates (Priority)
1.  **Create** new `docs/services.md`:
    *   Describe the Amalfa "Service Triad": MCP Server, Vector Daemon, Sonar Agent.
    *   Include commands (`amalfa servers`, `amalfa <service> start/stop`).
    *   Add architecture diagram.
2.  **Rewrite** `docs/user-guide.md`:
    *   Replace all `bun run ...` commands with `amalfa ...` CLI equivalents.
    *   Update database path from `public/resonance.db` to `.amalfa/resonance.db`.
    *   Add MCP client setup section referencing `amalfa setup-mcp`.

### Phase 3: Gap Fills (Secondary)
1.  **Create** `docs/guides/cloud-inference.md`:
    *   Document OpenRouter setup, API keys, and the "Dev-Cloud/Prod-Local" strategy.
2.  **Update** `playbooks/sonar-manual.md`:
    *   List current model hierarchy (`qwen2.5:1.5b` → `tinydolphin` → etc.).
    *   Document chat, research, and enhancement capabilities.
3.  **Create** `playbooks/enhance-playbook.md`:
    *   Document the `amalfa enhance` command.

### Phase 4: Validation
1.  Re-run gap analysis using MCP `find_gaps` tool.
2.  Verify that all CLI commands are referenced in at least one document.

---

## 5. Automation Opportunity

This audit could be partially automated using Amalfa's own capabilities:

*   **Extract CLI Commands:** Parse `src/cli.ts` for `case "..."` statements.
*   **Cross-Reference:** Use `search_documents` to find if each command appears in any doc.
*   **Report Generation:** Output a structured gap report for human review.

This could become a `scripts/maintenance/doc-consistency-check.ts` script.

---

## Conclusion

The codebase has evolved significantly faster than the documentation. This brief provides a roadmap to close the gap. Prioritizing Phase 2 will yield the highest user impact.

**Estimated Effort:** 2-3 Focus Hours
**Suggested Assignee:** Agent (with human review)
