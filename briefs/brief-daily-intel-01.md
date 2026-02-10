Redoing the brief to integrate the Charm toolchain transforms the "Daily Intelligence Service" from a background script into a **Brutalisimo (OH-125)** terminal experience. This orchestration utilizes `gum` for interface, `mods` for mentation, and `glow` for markdown rendering.

### 1. Implementation Brief: Charm-Powered Intelligence Service

```markdown
---
date: 2026-02-10
tags: [feature, infrastructure, service, charm, intel]
agent: gemini
environment: local
---

## Task: Charm-Powered Daily Intelligence Sidecar

**Objective:** Implement a daily AI news service that leverages the Charm toolchain (`gum`, `mods`, `glow`) to provide high-signal, zero-ingestion terminal context.

- [ ] [Script] Create `scripts/services/intel-fetcher.ts` (Simple JSONL caching).
- [ ] [UX] Create `bin/amalfa-intel` Bash wrapper to orchestrate the pipeline.
- [ ] [Interaction] Use `gum` for source selection and confirmation prompts.
- [ ] [Mentation] Pipe raw data through `mods` using a "Scottish Enlightenment" persona.
- [ ] [Display] Render the final refined markdown via `glow`.

## Key Actions Checklist:

- [ ] [Orchestration] Implement `bin/amalfa-intel` with the pipe: `cat -> jq -> mods -> glow`.
- [ ] [Mentation] Define a specific `mods` prompt to identify "Hollow Node" opportunities.
- [ ] [Verification] Confirm the service operates globally via `~/.amalfa/intel/`.

## Technical Notes:
- Adheres to **COG-12 (Deductive Minimalism)**: `mods` acts as a noise filter.
- Follows **PHI-14 (Architectural Specialisation)**: Keeps "Live News" outside the core graph.

```

---

### 2. The Orchestration Script (`bin/amalfa-intel`)

This script should be placed in your `bin` directory and made executable (`chmod +x`).

```bash
#!/bin/bash
# amalfa-intel: Minimal-friction, Charm-powered news viewer

INTEL_DIR="$HOME/.amalfa/intel"
TODAY=$(date +%Y-%m-%d)
TARGET_FILE="$INTEL_DIR/$TODAY.jsonl"

# Ensure directory exists
mkdir -p "$INTEL_DIR"

# 1. Fetching Logic (using gum for feedback)
if [ ! -f "$TARGET_FILE" ]; then
    gum confirm "No intel cached for today ($TODAY). Fetch now?" && \
    gum spin --spinner dot --title "Fetching AI News..." -- bun run scripts/services/intel-fetcher.ts
fi

# Exit if fetch failed or was declined
[ ! -f "$TARGET_FILE" ] && echo "Aborted." && exit 1

# 2. Source Selection (using gum)
SOURCE=$(cat "$TARGET_FILE" | jq -r '.source' | sort -u | gum choose --header "Select Intel Source")

# 3. Mentation & Rendering (using mods and glow)
echo "Processing $SOURCE through LLM filter..." | gum style --foreground 212

cat "$TARGET_FILE" | \
  jq -r "select(.source == \"$SOURCE\") | .payload" | \
  mods --role "Scottish Enlightenment Polymath" \
  "Summarize this AI news. 
   - Focus on technical novelty and architectural shifts.
   - List potential 'Hollow Nodes' we should explore.
   - Use strict markdown." | \
  glow -s dark

```

---

### 3. Opinion: Why this configuration is superior

**Minimum Friction, Maximum Signal:**
By using `gum confirm` and `gum choose`, you reduce the cognitive load of remembering CLI flags. The interface becomes self-documenting.

**LLM as a Distillation Engine (`mods`):**
Calling `mods` with a specific role ensures that the "Stuff" (Concept-02) is transformed into "Things" (Concept-03) that are contextually relevant to the Amalfa project. It doesn't just summarize; it analyzes for **Mentational** value.

**Visual Consistency:**
Using `glow` with the `-s dark` flag ensures the output matches the **Brutalisimo** aesthetic of the terminal-first workflow, keeping you in a "flow state" without browser distractions.

**Next Step:** Would you like me to refine the `intel-fetcher.ts` to include a `jq`-friendly output structure specifically optimized for this pipe?