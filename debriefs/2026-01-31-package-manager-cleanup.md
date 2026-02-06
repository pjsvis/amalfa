---
date: 2026-01-31
tags: [cleanup, infrastructure, verification, best-practices]
agent: antigravity
environment: production
---

# Debrief: Package Manager Cleanup

## Accomplishments

- **Global Package Hygiene:** successfully reduced global npm packages from ~28 down to just 1 (`npm` itself), significantly reducing bloat and potential conflicts.
- **Duplicate Elimination:** Removed redundant installations of TypeScript, Bun, and various AI tools that were installed in both `npm` and `bun` scopes.
- **Bun-First Adoption:** Established Bun as the primary package manager for JavaScript tooling, retaining only essential Bun globals (TypeScript, Wrangler, etc.).
- **PATH Verification:** Confirmed that `~/.bun/bin` takes precedence over `/opt/homebrew/bin`, ensuring the correct binaries are executed.
- **AI Tool Consolidation:** Removed over 20 unused or redundant AI assistant CLIs, streamlining the development environment.

## Problems

- **Legacy Dependencies:** Some tools were installed via npm historically without clear documentation, requiring manual audit to determine necessity.
- **Path Confusion:** Initial confusion about which `tsc` or `bun` binary was being executed due to multiple installation sources (npm vs brew vs bun). Resolved by cleaning up duplicates and verifying PATH.

## Lessons Learned

- **Explicit Install Strategy:** Future tools should default to `bun install -g`. `npm install -g` should be an exception requiring documentation.
- **Use `bunx` more:** Many "global" tools (like `http-server` or `npm-check`) don't need to be installed permanently and are better accessed via `bunx` on demand to keep the system clean.
- **Regular Audits:** Periodic checks (quarterly) of `npm ls -g --depth=0` are necessary to prevent "global creep".
- **Separation of Concerns:** Using Homebrew for system tools and Bun for JS tools provides a clean, logical separation that simplifies maintenance.
