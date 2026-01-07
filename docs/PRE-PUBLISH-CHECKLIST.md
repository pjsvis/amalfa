# Pre-Publish Checklist

This checklist ensures quality gates are met before releasing a new version of AMALFA.

## Automated Gates (enforced by `scripts/release.ts`)

These are automatically checked by the release script:

- [ ] **Git status clean**: No uncommitted changes
- [ ] **On main branch**: Release from `main` only
- [ ] **Remote sync**: Local branch up-to-date with `origin/main`
- [ ] **Config validation**: `bun run validate-config` passes
- [ ] **Linting**: `bun run check` passes (warning if fails, non-blocking)
- [ ] **npm authentication**: Logged in to npm

## Manual Gates (check before running release script)

### 1. Code Quality
- [ ] All tests passing: `bun test`
- [ ] No TypeScript errors
- [ ] Code formatted and linted

### 2. Documentation
- [ ] **CHANGELOG.md updated**: Move `[Unreleased]` section to new version with date
- [ ] README.md reflects any new features or breaking changes
- [ ] Example config updated if config schema changed
- [ ] API/MCP schema changes documented

### 3. Versioning
- [ ] **Version source of truth**: Confirm `package.json` is single source (CLI reads from it)
- [ ] Version bump type determined (patch/minor/major)
- [ ] Breaking changes properly versioned (major bump)

### 4. Functional Testing
- [ ] Core functionality tested locally:
  - [ ] `amalfa init` works
  - [ ] `amalfa serve` starts MCP server
  - [ ] `amalfa stats` shows correct data
  - [ ] `amalfa daemon start` works
  - [ ] `amalfa --version` shows correct version
- [ ] MCP integration tested with Claude Desktop or other client
- [ ] Search queries return expected results

### 5. Build & Package
- [ ] Dependencies up to date (or intentionally pinned)
- [ ] `.npmignore` excludes dev-only files
- [ ] Binary (`amalfa` CLI) works when installed globally

### 6. Release Notes Preparation
- [ ] Draft GitHub release notes (can be finalized after publish)
- [ ] Highlight breaking changes prominently
- [ ] Credit contributors if applicable

## Release Process

Once all gates pass:

```bash
# Dry run first (recommended)
bun run scripts/release.ts patch --dry-run

# Actual release
bun run scripts/release.ts patch
```

The script will:
1. Update `package.json` version
2. Commit and tag
3. Push to GitHub
4. Publish to npm

## Post-Publish

- [ ] Verify npm package: `npm view amalfa`
- [ ] Create GitHub release with notes
- [ ] Update CHANGELOG.md `[Unreleased]` section for next version
- [ ] Test global install: `bun install -g amalfa@latest && amalfa --version`
- [ ] Announce (if significant release)

## Common Pre-Publish Issues

| Issue | Fix |
|-------|-----|
| Version mismatch in CLI | CLI now reads from `package.json` (fixed in v1.0.19) |
| Forgot to update CHANGELOG | Always update before running release script |
| Tests fail on CI but pass locally | Check node/bun version differences |
| npm publish fails | Verify `npm whoami` and package name not taken |

---

**Philosophy**: These gates exist to prevent shipping broken code. The release script automates what can be automated; this checklist covers what requires human judgment.
