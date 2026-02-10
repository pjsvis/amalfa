Implementing a `jq`-friendly output completes the bridge between the transient terminal session and the persistent web interface. By saving the `mods` distillation back into a structured JSON format, we create a "Mentation Artifact" that the **SSR Docs Server** or **Polyvis Dashboard** can render.

This follows the **Principle of Explicit Formulation (PHI-5)**: the AI doesn't just show you news; it produces a versioned artifact of its reasoning.

### 1. Updated Implementation Brief

```markdown
---
date: 2026-02-10
tags: [feature, service, charm, jq, web-ui]
agent: gemini
---

## Task: Dual-Layer Intelligence Pipeline (TUI -> WUI)

**Objective:** Create a two-step intelligence workflow that distill raw AI news into structured JSON artifacts for both terminal consumption and Web UI display.

- [ ] [Ingest] `intel-fetcher.ts` gathers raw "Stuff" (JSONL).
- [ ] [Distill] `bin/amalfa-intel` processes "Stuff" via `mods` into a "Thing" (Artifact).
- [ ] [Output] Save distillation as `~/.amalfa/intel/distilled/YYYY-MM-DD.json`.
- [ ] [WUI] Enable the SSR server to pick up the distilled artifact for dashboard display.

## Key Actions:
- Use `gum` for selection/spinners.
- Use `mods` to output strict JSON (via system prompt).
- Use `jq` to validate and store the artifact.
- Use `glow` to preview the result in the TUI.

```

---

### 2. The Orchestration Script: `bin/amalfa-intel`

This script now handles the conversion from JSONL to a structured Artifact.

```bash
#!/bin/bash
# amalfa-intel: TUI viewer and WUI Artifact Generator

RAW_DIR="$HOME/.amalfa/intel"
DISTILL_DIR="$RAW_DIR/distilled"
TODAY=$(date +%Y-%m-%d)
TARGET_FILE="$RAW_DIR/$TODAY.jsonl"
ARTIFACT_FILE="$DISTILL_DIR/$TODAY.json"

mkdir -p "$DISTILL_DIR"

# 1. Fetching
if [ ! -f "$TARGET_FILE" ]; then
    gum confirm "No raw intel for $TODAY. Fetch?" && bun run scripts/services/intel-fetcher.ts
fi

# 2. Source Selection
SOURCE=$(cat "$TARGET_FILE" | jq -r '.source' | sort -u | gum choose --header "Select Source to Distill")

# 3. Mentation (Stuff -> Thing)
# We ask mods to output strict JSON so jq can handle it
echo "Distilling $SOURCE into Structured Artifact..." | gum style --foreground 212

cat "$TARGET_FILE" | \
  jq -r "select(.source == \"$SOURCE\") | .payload" | \
  mods --format json \
  "Act as a Scottish Enlightenment Polymath. Distill this news into a JSON object with:
   - 'headline': A concise summary.
   - 'impact_score': 1-10 on architectural relevance.
   - 'hollow_nodes': Array of new concepts to explore.
   - 'summary_md': A technical markdown summary.
   - 'tags': Array of CL terms." > "$ARTIFACT_FILE"

# 4. TUI Display (WUI handles the file later)
gum style --border normal --margin "1 2" --padding "1 2" --foreground 212 "Artifact Generated: $ARTIFACT_FILE"

cat "$ARTIFACT_FILE" | jq -r '.summary_md' | glow

```

---

### 3. Web UI Integration (The Artifact Path)

By saving to `~/.amalfa/intel/distilled/`, we create a standardized endpoint for the Amalfa Web UI.

**Opinion on the "Two-Step" Workflow:**

1. **TUI (The Forge):** You use the terminal to trigger the fetch and distillation. This is where the "heat" of the interaction happens. You see the `gum spin` and `glow` output, providing immediate cognitive value.
2. **WUI (The Gallery):** The distilled `.json` file is a "Hollow Node" candidate. The Web UI (Dashboard) can simply list files in the distilled directory and render them as "Daily Intelligence Cards."

### 4. Technical Recommendation: "The Clean Pipe"

To ensure the WUI doesn't break, we should add a `jq` validation step in the script:

```bash
if jq empty "$ARTIFACT_FILE" 2>/dev/null; then
  echo "Artifact validated."
else
  echo "Mentation failed: Invalid JSON."
  rm "$ARTIFACT_FILE"
fi

```

**Next Step:** I can provide a sample React/Hono component for the Web UI that automatically scans this `distilled` folder and displays the "Intelligence Cards" if you wish.