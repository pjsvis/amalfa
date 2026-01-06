# Undocumented Confusion Scan - 2025-12-12

**Trigger:** Found `.resonance/` had no README explaining `resonance.db`  
**Method:** Super-grep + directory scan  
**Result:** 13 directories lack READMEs!

---

## Findings

### **Critical (Core Directories)**

| Directory | Purpose | Status | Priority |
|-----------|---------|--------|----------|
| `briefs/` | Project briefs (planning) | ❌ No README | **P0** |
| `debriefs/` | Project debriefs (reality) | ❌ No README | **P0** |
| `playbooks/` | Operational procedures | ❌ No README | **P0** |
| `context/` | Agent context files | ❌ No README | **P1** |
| `resonance/` | Resonance CLI source | ✅ Has README | ✅ |

### **Development (Tools & Tests)**

| Directory | Purpose | Status | Priority |
|-----------|---------|--------|----------|
| `tests/` | Test files | ❌ No README | **P1** |
| `examples/` | Example code/data | ❌ No README | **P2** |
| `scratchpads/` | Temporary experiments | ❌ No README | **P2** |

### **Data & Artifacts**

| Directory | Purpose | Status | Priority |
|-----------|---------|--------|----------|
| `reports/` | Generated reports | ❌ No README | **P1** |
| `images/` | Image assets | ❌ No README | **P2** |
| `local_cache/` | Build cache | ❌ No README | **P2** |
| `substack/` | Substack articles? | ❌ No README | **P3** |

### **Legacy/Unknown**

| Directory | Purpose | Status | Priority |
|-----------|---------|--------|----------|
| `drizzle/` | Drizzle ORM? | ❌ No README | **P3** |
| `plans/` | Old planning docs? | ❌ No README | **P3** |

---

## Impact Analysis

### **Confusion Examples**

**Question:** "What's in `.resonance/resonance.db`?"  
**Without README:** Unknown, undocumented, scary to delete  
**With README:** Explained, safe to delete/regenerate

**Question:** "What goes in `briefs/` vs `context/`?"  
**Without READMEs:** Guesswork, inconsistent usage  
**With READMEs:** Clear guidelines, consistent structure

---

## Proposed Solutions

### **P0: Core Documentation** (30 min)

Create READMEs for critical directories:

1. **`briefs/README.md`**
   - What: Project briefs (plans before execution)
   - Format: Markdown, follow template
   - Lifecycle: Archive when complete

2. **`debriefs/README.md`**
   - What: Post-mortem documentation
   - Format: Markdown, CMP protocol
   - Naming: `YYYY-MM-DD-topic.md`

3. **`playbooks/README.md`**
   - What: Reusable procedures
   - Categories: By domain (CSS, DB, etc)
   - Status: Authoritative vs draft

### **P1: Development Docs** (15 min)

4. **`context/README.md`** - Agent context management
5. **`tests/README.md`** - Test strategy
6. **`reports/README.md`** - What gets generated

### **P2: Cleanup Candidates** (10 min)

7. **`examples/README.md`** - If keeping, document. Else delete.
8. **`images/README.md`** - Image asset guidelines
9. **`scratchpads/README.md`** - Temporary work policy

### **P3: Legacy Assessment** (Review)

10. **`drizzle/`** - Is this used? If not, delete
11. **`plans/`** - Merged into `briefs/`? Delete if redundant
12. **`substack/`** - Active? Document or delete

---

## Standard README Template

```markdown
# [Directory Name]

**Purpose:** [One-line description]  
**Used by:** [Scripts, tools, humans]  
**Git Status:** Versioned | Ignored | Mixed

---

## Structure

[Typical contents]

---

## Usage

[When to add files here]

---

## Lifecycle

[When to delete/archive]

---

## Related

[Links to playbooks, scripts]
```

---

## Super-Grep Pattern (New Echo!)

**Find undocumented directories:**

```bash
# Method 1: Check for missing READMEs
for dir in */; do
  if [ ! -f "${dir}README.md" ]; then
    echo "❌ $dir"
  fi
done

# Method 2: Ripgrep for directories in .gitignore
rg "^[a-z_-]+/$" .gitignore
```

**Add to echoes:**
- `undocumented-dirs.md` (directory hygiene pattern)

---

## Immediate Actions

### **Today (Friday):**
- [x] Fixed `.resonance/` → Added README
- [x] Renamed findings file (date prefix)
- [x] Scanned for more confusion
- [ ] Create `briefs/README.md` (P0)
- [ ] Create `debriefs/README.md` (P0)
- [ ] Create `playbooks/README.md` (P0)

### /**Next Session:**
- [ ] Create P1 READMEs (context, tests, reports)
- [ ] Assess P2 directories (keep or delete?)
- [ ] Clean up P3 legacy (drizzle, plans, substack)
- [ ] Add `undocumented-dirs.md` echo

---

## Metrics

**Before:**
- Documented directories: 4/17 (23%)
- `.resonance/`: Completely undocumented

**After P0:**
- Documented directories: 8/17 (47%)
- Core workflow: 100% documented

**After full cleanup:**
- Target: 100% or deleted
- Principle: **Every directory explains itself**

---

## Philosophy

> "If it's not documented, it doesn't exist (or shouldn't)"

**Every directory should answer:**
1. **What** goes here?
2. **Why** does it exist?
3. **When** to add/remove files?
4. **Who** uses it (scripts, humans, tools)?

**If you can't answer these** → Delete the directory!

---

## Related Work

- `.resonance/README.md` (just created!)
- `docs/README.md` (already exists)
- `scripts/README.md` (TODO)
- Root `README.md` (could be enhanced)

---

**Status:** P0 in progress (3 core READMEs to create)  
**Friday work:** Documentation hygiene  
**Impact:** Reduced confusion, better onboarding
