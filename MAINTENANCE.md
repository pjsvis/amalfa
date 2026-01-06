# Maintenance Guide

**Last Updated:** 2025-12-17

---

## 🔒 Version Pinning Strategy

This project uses **exact version pinning** for all dependencies to ensure reproducible builds and avoid surprise breakage during active development.

### **Pinned Versions (as of 2025-12-17)**

| Component | Version | Pin Method | Notes |
|-----------|---------|------------|-------|
| **Bun** | v1.3.5 | Manual (documented) | Runtime & package manager |
| **Node.js** | v22.21.1 | Homebrew (`brew pin node@22`) | TailwindCSS CLI only |
| **npm** | v10.9.4 | Bundled with Node | Comes with Node v22 |
| **TailwindCSS** | v4.1.18 | package.json (exact) | CSS framework |
| **Biome** | v2.3.8 | package.json (exact) | Linter/formatter |
| **Drizzle ORM** | v0.45.0 | package.json (exact) | Database ORM |
| **FastEmbed** | v2.0.0 | package.json (exact) | Embedding model |
| **Alpine.js** | v3.15.2 | package.json (exact) | Frontend reactivity |

---

## 📅 Update Schedule

**Update Window:** First weekend of each month (or as needed for security patches)

**Process:**
1. Create `update-deps` branch from `main`
2. Run dependency updates:
   ```bash
   bun update  # Update all dependencies
   bun install # Reinstall to verify
   ```
3. Run full verification suite:
   ```bash
   bun run check              # Biome linting
   bunx tsc --noEmit          # TypeScript compilation
   bun run build:css          # CSS build
   bun run build:js           # JS build
   bun run test:integration   # Integration tests
   ```
4. Manual testing:
   ```bash
   bun run dev                # Test dev server
   bun run daemon start       # Test daemon
   bun run mcp                # Test MCP server
   bun run build:data         # Test ingestion
   ```
5. Check for breaking changes in changelogs:
   - TailwindCSS: https://github.com/tailwindlabs/tailwindcss/releases
   - Drizzle ORM: https://github.com/drizzle-team/drizzle-orm/releases
   - Biome: https://biomejs.dev/blog/
6. If all tests pass → merge to `main`
7. If anything fails → investigate, fix, or rollback specific packages

**Rollback Strategy:**
```bash
git checkout main -- package.json bun.lockb
bun install
```

---

## 🔄 Bun Updates

Bun is installed via `curl` installer and doesn't auto-update.

**Current Version:** v1.3.5

**Update Process:**
```bash
# Check current version
bun --version

# Update to latest
curl -fsSL https://bun.sh/install | bash

# Verify new version
bun --version

# Test all services
bun run dev
bun run daemon start
bun run mcp
```

**Rollback (if needed):**
```bash
# Install specific version
curl -fsSL https://bun.sh/install | bash -s "bun-v1.3.5"
```

---

## 🟢 Node.js Updates

Node.js v22 is LTS (Long Term Support) and pinned via Homebrew.

**Current Version:** v22.21.1

**Security Updates (within v22.x):**
```bash
# Check for updates within v22.x
brew update
brew outdated node@22

# Apply security patches (stays on v22.x)
brew upgrade node@22

# Verify version
node --version  # Should be v22.x.x
```

**Major Version Upgrades (v22 → v24):**
```
DO NOT upgrade to Node v23, v24, v25 without testing!
Even-numbered versions = LTS (stable)
Odd-numbered versions = Experimental

Only consider v24 after it reaches LTS status (April 2025)
```

**Pinning Status:**
```bash
# Verify pin
brew list --pinned  # Should show node@22

# Re-pin if needed
brew pin node@22
```

---

## 📦 Package.json Updates

All dependencies use **exact versions** (no `^` or `~`).

**Critical Dependencies (test thoroughly):**
- `fastembed` - Embedding model changes = different vectors
- `drizzle-orm` - Schema changes = migration needed
- `@tailwindcss/cli` - CSS syntax changes = theme breaks
- `@biomejs/biome` - Lint rules change = new errors
- `@modelcontextprotocol/sdk` - Protocol changes = MCP breaks

**Safe to Update (backward compatible):**
- `glob` - Stable API
- `marked` - Markdown parser (usually stable)
- `openai` - SDK mostly backward compatible

**Update Individual Package:**
```bash
# Update specific package to latest
bun update fastembed

# Or specify exact version
bun add fastembed@2.1.0

# Test thoroughly before committing
```

---

## 🧪 Verification Checklist

After any dependency update, verify:

- [ ] **TypeScript Compilation:** `bunx tsc --noEmit` (0 errors)
- [ ] **Biome Linting:** `bun run check` (0 new errors)
- [ ] **CSS Build:** `bun run build:css` (completes successfully)
- [ ] **JS Build:** `bun run build:js` (completes successfully)
- [ ] **Dev Server:** `bun run dev` (starts without errors)
- [ ] **Daemon:** `bun run daemon start` + edit file → auto-ingestion works
- [ ] **MCP Server:** `bun run mcp` (starts without errors)
- [ ] **Ingestion:** `bun run build:data` (completes without errors)
- [ ] **Integration Tests:** `bun run test:integration` (all pass)
- [ ] **Browser Test:** Open http://localhost:3000 (no console errors)
- [ ] **Graph Explorer:** Open /sigma-explorer/ (renders correctly)

---

## 🚨 Known Issues

### **Bun + TailwindCSS v4 Compatibility**
- **Fixed:** 2025-12-17
- **Solution:** Upgraded Bun to v1.3.5, Node to v22 LTS, TailwindCSS to v4.1.18
- **Issue:** `enhanced-resolve` CachedInputFileSystem constructor incompatibility
- **Prevention:** Pin Node v22, don't upgrade to v25+

### **FastEmbed + Tar Dependency**
- **Fixed:** 2025-12-17
- **Solution:** Node v22 LTS compatible with tar/minizlib chain
- **Issue:** Bun v1.3.4 + fastembed → tar → minizlib constructor error
- **Prevention:** Keep Node on v22 LTS

---

## 📊 Update History

| Date | Component | Old Version | New Version | Notes |
|------|-----------|-------------|-------------|-------|
| 2025-12-17 | Node.js | v25.2.1 | v22.21.1 | Downgraded to LTS, pinned via Homebrew |
| 2025-12-17 | Bun | v1.3.4 | v1.3.5 | Manual upgrade via curl installer |
| 2025-12-17 | TailwindCSS | v4.1.17 | v4.1.18 | Auto-update during node_modules reinstall |
| 2025-12-17 | package.json | Semver ranges | Exact versions | Pinned all dependencies |

---

## 🔧 Environment Setup

**Fresh Machine Setup:**
```bash
# 1. Install Bun
curl -fsSL https://bun.sh/install | bash

# 2. Install Node v22 LTS
brew install node@22
brew link node@22 --force
brew pin node@22

# 3. Clone repo
git clone <repo-url>
cd polyvis

# 4. Install dependencies
bun install

# 5. Verify versions
bun --version    # Should be 1.3.5+
node --version   # Should be v22.x
```

---

## 📞 Support

If you encounter issues after updates:
1. Check this document for known issues
2. Review `debriefs/` for past troubleshooting
3. Check `briefs/` for architectural decisions
4. Rollback to last known good versions
5. Create issue in GitHub with details

---

**Next Scheduled Update:** 2026-01-05
