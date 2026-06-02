---
date: 2026-04-10
tags:
  - playbook
  - justfile
  - cli
  - automation
  - standards
agent: any
environment: local
---

# Justfile Design Playbook

## Purpose
A codified set of standards for designing `justfile` command runners. Ensures consistent, discoverable, and maintainable task automation that serves as a **capability façade** — abstracting implementation details behind intent-driven commands.

## Context & Prerequisites

### Tools Required
- `just` command runner installed (`brew install just` or `cargo install just`)
- Shell environment (bash/zsh)

### System State
- Project initialized with version control
- Core scripts/tools identified

### Related Playbooks
- `agent-competency-assessment-playbook.md` — Agents invoke just recipes
- `first-contact-playbook.md` — Novel capability discovery

---

## The Protocol

### Step 1: Create justfile in project root

```bash
touch justfile
```
- *Constraint:* One justfile per project root.
- *Constraint:* Filename is `justfile` (lowercase, no extension).

### Step 2: Add shebang and settings

```just
# Project task runner
set shell := ["bash", "-uc"]
set dotenv-load

# Default recipe (runs on bare `just`)
default: help
```

### Step 3: Organize recipes by domain

Use comment headers to group related recipes:

```just
# === Help ===
help:
    @just --list

# === Build ===
build:
    cargo build --release

# === Test ===
test: build
    cargo test

# === Deploy ===
deploy env="staging":
    ./scripts/deploy.sh {{env}}
```

### Step 4: Document every public recipe

```just
# Run the full CI pipeline locally
ci: lint test build
    @echo "CI passed ✓"
```
- *Constraint:* Comment directly above recipe becomes `--list` description.

### Step 5: Use dependencies for ordering

```just
release: test build
    ./scripts/publish.sh
```
- Dependencies run first, left to right.

### Step 6: Hide internal recipes with underscore prefix

```just
_setup:
    @echo "Internal setup..."

build: _setup
    cargo build
```
- Underscore recipes don't appear in `just --list`.

### Step 7: Add parameters with sensible defaults

```just
deploy env="staging" tag="latest":
    ./deploy.sh --env={{env}} --tag={{tag}}
```
- Users can override: `just deploy prod v2.1.0`

### Step 8: Validate with `just --list`

```bash
just --list
```
- Output should read like a menu of capabilities.
- Descriptions should be action-oriented.

---

## Standards & Patterns

### Naming Conventions

| Pattern | Example | Use When |
|---------|---------|----------|
| `verb` | `build`, `test`, `deploy` | Single clear action |
| `verb-noun` | `build-docker`, `test-integration` | Disambiguation needed |
| `noun` | `db`, `cache` | Namespace for subcommands |
| `_prefix` | `_setup`, `_validate` | Internal/private recipes |

### Recipe Design Rules

1. **Name for intent, not implementation**
   - ✅ `deploy-prod`
   - ❌ `run-ansible-playbook-with-prod-inventory`

2. **One recipe, one responsibility**
   - ✅ Separate `build`, `test`, `lint`
   - ❌ Single `do-everything` recipe

3. **Idempotent when possible**
   - Running twice should not break things
   - Use `mkdir -p`, check before create

4. **Fail fast and loud**
   - Let errors propagate (don't swallow with `|| true`)
   - Use `set -e` behavior

5. **No hidden state**
   - Avoid recipes that depend on undocumented environment
   - Use `set dotenv-load` for env vars

### Parameter Patterns

```just
# Required parameter (no default)
greet name:
    @echo "Hello, {{name}}!"

# Optional with default
deploy env="staging":
    ./deploy.sh {{env}}

# Variadic arguments
test *args:
    cargo test {{args}}

# Positional + variadic
run cmd *args:
    {{cmd}} {{args}}
```

### Output Conventions

```just
# Silent prefix (@) for clean output
help:
    @just --list

# Explicit echo for status
build:
    @echo "Building..."
    cargo build --release
    @echo "Build complete ✓"

# JSON output flag for agent consumption
status format="text":
    ./status.sh --format={{format}}
```

### Cross-Platform Considerations

```just
# Use portable commands
clean:
    rm -rf target/ || true

# Or use just's built-in
clean:
    -rm -rf target/

# Platform-specific recipes
[linux]
install:
    apt-get install -y deps

[macos]
install:
    brew install deps
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| `do-all` mega-recipe | Unclear, hard to debug | Break into composable pieces |
| Undocumented recipes | Discoverable only by reading file | Add comment above each |
| Hardcoded paths | Breaks on other machines | Use variables or env |
| Silent failures | Masks problems | Let errors propagate |
| Magic dependencies | "Works on my machine" | Document prerequisites |
| Overly clever shell | Hard to maintain | Keep recipes simple, put complexity in scripts |

---

## Agent-Specific Considerations

When designing justfiles that **agents will invoke**:

### Structured Output
```just
# Provide JSON option for machine parsing
status format="text":
    #!/usr/bin/env bash
    if [[ "{{format}}" == "json" ]]; then
        ./status.sh --json
    else
        ./status.sh
    fi
```

### Explicit Over Implicit
```just
# ✅ Explicit environment
deploy env:
    ./deploy.sh --env={{env}}

# ❌ Implicit from context
deploy:
    ./deploy.sh  # Uses current branch? Magic?
```

### Predictable Exit Codes
```just
check:
    ./validate.sh  # Exit 0 = pass,non-zero = fail
```

### Dry-Run Support
```just
deploy env="staging" dry="false":
    ./deploy.sh --env={{env}} {{ if dry == "true" { "--dry-run" } else { "" } }}
```

---

## Validation

Justfile design is complete when:
- [ ] `just --list` produces clear, scannable output
- [ ] Every public recipe has a documentation comment
- [ ] Default recipe is defined (typically `help` or primary action)
- [ ] Parameters have sensible defaults where appropriate
- [ ] Internal recipes are prefixed with `_`
- [ ] No hardcoded machine-specific paths
- [ ] Recipes are idempotent where possible
- [ ] Tested on clean checkout

---

## Example: Complete Justfile Template

```just
# Project automation - run `just` or `just help` to see options
set shell := ["bash", "-uc"]
set dotenv-load

# Show available commands
default: help

# === Help ===

# List all available recipes
help:
    @just --list

# === Development ===

# Install dependencies
setup:
    ./scripts/setup.sh

# Start development server
dev: setup
    ./scripts/dev.sh

# === Quality ===

# Run linter
lint:
    ./scripts/lint.sh

# Run tests
test:
    ./scripts/test.sh

# Run full quality checks
check: lint test
    @echo "All checks passed ✓"

# === Build ===

# Build for production
build:
    ./scripts/build.sh

# === Deploy ===

# Deploy to environment (default: staging)
deploy env="staging":
    ./scripts/deploy.sh {{env}}

# Deploy to production (requires confirmation)
deploy-prod: check build
    @echo "Deploying to PRODUCTION..."
    ./scripts/deploy.sh prod

# === Utilities ===

# Clean build artifacts
clean:
    ./scripts/clean.sh

# Show project status (use format=json for machine output)
status format="text":
    ./scripts/status.sh --format={{format}}

# === Internal ===

_validate:
    @./scripts/validate-env.sh
```

---

## Maintenance

- **Review frequency:** When adding new project capabilities
- **Migration:** If switching build tools, update recipes to wrap new tools
- **Deprecation:** Mark obsolete recipes with comment `# DEPRECATED: use X instead` before removing
