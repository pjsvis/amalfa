# Polyvis Documentation Directory

This directory contains **project documentation** (not to be confused with `public/docs/` which contains website content).

---

## Directory Structure

```
docs/
├── README.md          # This file
├── webdocs/           # Technical documentation and reference materials
│   ├── *.md           # Documentation files
│   ├── *.ts           # Code examples and utilities
│   └── *.html         # HTML documentation
└── architecture/      # Architecture diagrams and high-level design
    └── pipeline.md    # Data pipeline architecture
```

---

## Purpose

### `docs/webdocs/`
Technical reference documentation including:
- Database capabilities and API reference
- Project structure and standards
- Implementation guides
- Legacy vector implementation examples
- Code snippets and utilities

### `docs/architecture/`
High-level architecture documentation:
- System diagrams
- Data flow documentation
- Design decisions

---

## Adding Documentation

### New Technical Documentation
```bash
# Add to docs/webdocs/
touch docs/webdocs/new-feature-guide.md
```

### New Architecture Document
```bash
# Add to docs/architecture/
touch docs/architecture/new-system-design.md
```

---

## Removing Documentation

**Before removing:**
1. Search for references: `rg "filename" docs/ briefs/ debriefs/`
2. Update any links in other documentation
3. Consider archiving instead of deleting

**Archive pattern:**
```bash
mkdir -p docs/webdocs/archive
mv docs/webdocs/obsolete-doc.md docs/webdocs/archive/
```

---

## Website vs Project Docs

| Location | Purpose | Examples |
|----------|---------|----------|
| `public/docs/` | **Website content** served to users | Playbooks, tutorials, public guides |
| `docs/` | **Project documentation** for developers | Technical specs, architecture, reference |

**Important:** Don't confuse the two!
- `public/docs/` = User-facing website content
- `docs/` = Developer-facing project documentation

---

## Verification

After adding/removing docs:

```bash
# Check structure
tree docs -L 2

# Verify no broken links
rg -t md "docs/" docs/ | grep "\.md"

# Test if docs are accessible (if served)
# (depends on your documentation server setup)
```

---

## Related

- `public/docs/` - Website documentation (playbooks, debriefs, tutorials)
- `README.md` - Project overview
- `AGENTS.md` - Operational protocols
- `_CURRENT-PROJECT-STATE.md` - Capability baseline

---

**Last Updated:** 2025-12-12  
**Maintained By:** Project team
