# Super-Grep Echoes: Pattern Registry Concept

**Date:** 2025-12-12  
**Status:** Design Proposal  
**Type:** Pattern Library + Registry

---

## Concept: "Echoes"

**Definition:** Reusable super-grep patterns (ripgrep + ast-grep) stored as vendored dependencies from a remote registry.

**Analogy:** Like npm packages, but for grep patterns

---

## Why "Echoes"?

1. **Echo** = Repeating pattern that resonates across codebases
2. **Canonical** = Single source of truth for common searches
3. **Discoverable** = Auto-suggest patterns based on project signatures
4. **Versioned** = Track updates, allow local edits
5. **Shareable** = Team patterns, not just personal scripts

---

## Registry Structure

### **Remote Repository** (GitHub)
```
polyvis-echoes/
├── registry.json          # Manifest
├── ripgrep/
│   ├── hardcoded-paths.md
│   ├── console-logs.md
│   └── magic-numbers.md
├── ast-grep/
│   ├── empty-catch.md
│   ├── any-types.md
│   └── console-patterns.md
└── combos/
    ├── settings-audit.md  # Uses both tools
    └── import-analysis.md
```

### **Manifest (`registry.json`)**
```json
{
  "echoes": {
    "hardcoded-paths": {
      "type": "ripgrep",
      "path": "ripgrep/hardcoded-paths.md",
      "signatures": ["settings.json", "config.ts"],
      "tags": ["refactor", "settings"],
      "description": "Find hardcoded file paths that should use settings"
    },
    "console-patterns": {
      "type": "ast-grep",
      "path": "ast-grep/console-patterns.md",
      "signatures": ["package.json"],
      "tags": ["cleanup", "production"],
      "description": "Find console.log/error/warn (semantic, not in comments)"
    },
    "settings-audit": {
      "type": "combo",
      "path": "combos/settings-audit.md",
      "signatures": ["settings.json"],
      "tags": ["audit", "refactor"],
      "description": "Complete settings-driven refactor workflow"
    }
  }
}
```

---

## Echo Format (Markdown Template)

### **Example: `ripgrep/hardcoded-paths.md`**
```markdown
# Echo: Hardcoded Paths

**Type:** ripgrep  
**Tags:** refactor, settings  
**Version:** 1.0.0

## Pattern

\`\`\`bash
rg 'join.*"(src/|public/|scripts/)"' --type ts --type js -n
\`\`\`

## What It Finds

Hardcoded path strings in `join()` calls that should reference settings.

## Why It Matters

- Breaks portability (Windows vs Unix)
- Hard to refactor (scattered magic strings)
- Single source of truth violation

## How to Fix

\`\`\`typescript
// Before
const dbPath = join(process.cwd(), "public/resonance.db");

// After
import settings from "@/polyvis.settings.json";
const dbPath = join(process.cwd(), settings.paths.database.resonance);
\`\`\`

## Related Echoes

- `magic-strings` (broader string literal search)
- `settings-audit` (complete refactor workflow)

## Success Criteria

\`\`\`bash
# Should return 0 results after fix
rg 'join.*"(src/|public/)"' scripts/ --type ts
\`\`\`
```

---

## Local Usage Workflow

### **1. Discover Available Echoes**
```bash
$ resonance echo discover
🔍 Scanning project signatures...
📋 Recommended echoes:
  - hardcoded-paths (found: settings.json)
  - console-patterns (found: package.json)
  - empty-catch (found: tsconfig.json)

Run: resonance echo install <name>
```

### **2. Install Echo**
```bash
$ resonance echo install hardcoded-paths

✅ Installed: .resonance/echoes/hardcoded-paths.md
📝 Added to: .resonance/echoes.lock.json
```

**Lockfile (`.resonance/echoes.lock.json`):**
```json
{
  "hardcoded-paths": {
    "version": "1.0.0",
    "hash": "sha256:abc123...",
    "installed_at": "2025-12-12T12:47:00Z",
    "source": "https://github.com/polyvis/echoes"
  }
}
```

### **3. Run Echo**
```bash
$ resonance echo run hardcoded-paths

🔍 Running: Hardcoded Paths
════════════════════════════
scripts/build.ts:23: const dbPath = join(cwd(), "public/db");
scripts/utils/loader.ts:45: readFile("src/config.json")

Found: 2 instances
See: .resonance/echoes/hardcoded-paths.md for fix guide
```

### **4. Update Echoes**
```bash
$ resonance echo update

📡 Checking for updates...
  hardcoded-paths: 1.0.0 → 1.1.0 (upstream changed)
  ⚠️  Local edits detected! (hash mismatch)
  
Options:
  [1] Keep local version
  [2] Overwrite with upstream
  [3] Save upstream as .new

Choice: 3
✅ Saved: .resonance/echoes/hardcoded-paths.md.new
```

---

## Implementation Plan

### **Phase 1: Local Echoes** (This Session)
```
.resonance/
└── echoes/
    ├── hardcoded-paths.md    # Today's session patterns
    ├── console-logs.md
    └── empty-catch.md
```

**No registry yet** - Just create local markdown patterns

### **Phase 2: Registry (Future)**
- Create `polyvis-echoes` GitHub repo
- Implement `resonance echo` commands
- Auto-discovery based on signatures

---

## Today's Session: Bootstrap Echoes

### **Goal: Create 5 Foundational Echoes**

1. **hardcoded-paths** (ripgrep) ✅ We just did this!
2. **console-patterns** (ast-grep) - Learn ast-grep
3. **empty-catch** (ast-grep) - Error handling
4. **any-types** (ripgrep + ast-grep combo) - Type safety
5. **settings-audit** (combo workflow) - Complete refactor

### **Output**
```
.resonance/
└── echoes/
    ├── README.md (explains echoes concept)
    ├── hardcoded-paths.md
    ├── console-patterns.md
    ├── empty-catch.md
    ├── any-types.md
    └── settings-audit.md
```

---

## Echoes vs Playbooks

| Aspect | Playbooks | Echoes |
|--------|-----------|--------|
| **Purpose** | How to build | How to find |
| **Content** | Guidelines, patterns | Grep queries |
| **Usage** | Read for context | Run for results |
| **Format** | Narrative markdown | Structured template |
| **Tool** | Human brain | ripgrep/ast-grep |

**Example:**
- **Playbook:** "How to write settings-driven code"
- **Echo:** "Find all hardcoded paths (query + fix guide)"

---

## Success Criteria

### **This Session**
- [ ] Create `.resonance/echoes/` directory
- [ ] Document 5 foundational echoes
- [ ] Run each echo against codebase
- [ ] Fix 1-2 critical findings
- [ ] Validate echo format is reusable

### **Future (Registry)**
- [ ] Remote GitHub repo
- [ ] `resonance echo` CLI commands
- [ ] Auto-discovery logic
- [ ] Version tracking

---

## Ready to Bootstrap?

**Proposed sequence:**
1. Create `.resonance/echoes/` structure
2. Document today's `hardcoded-paths` pattern as first echo
3. Create `console-patterns` echo (learn ast-grep)
4. Run both, collect findings
5. Fix critical issues
6. Document in debrief

**Time:** ~60 minutes

**Shall we proceed?** 🚀
