To maintain strict **Architectural Specialisation (PHI-14)** and ensure the **Persona (Concept-05)** remains grounded during the distillation process, we will colocate a localized version of the Conceptual Lexicon within the service directory.

This allows the `mods` pipeline to reference terms like **Mentation**, **Hollow Nodes**, and **Conceptual Entropy** without needing to reach into the main project graph, keeping the service "sidecar" truly portable.

### 1. Updated Service Structure

We will store the reference file at `~/.amalfa/intel/conceptual-lexicon.json`. The `amalfa-intel` script will then feed this as context to the LLM.

### 2. Refined `mods` System Prompt

By piping the collocated lexicon into the prompt, we ensure that the "Thing" produced is semantically compatible with the rest of your Amalfa ecosystem.

```bash
#!/bin/bash
# amalfa-intel: TUI viewer, WUI Artifact Generator, and Lexicon-Grounded Distiller

RAW_DIR="$HOME/.amalfa/intel"
DISTILL_DIR="$RAW_DIR/distilled"
LEXICON_FILE="$RAW_DIR/conceptual-lexicon.json" # Localised reference
TODAY=$(date +%Y-%m-%d)
TARGET_FILE="$RAW_DIR/$TODAY.jsonl"
ARTIFACT_FILE="$DISTILL_DIR/$TODAY.json"

# ... (Previous fetching/selection logic) ...

# Load local lexicon context for the LLM
LEXICON_CONTEXT=$(cat "$LEXICON_FILE" | jq -c '.entries[].Term')

echo "Distilling $SOURCE through the Scottish Enlightenment Lexicon..." | gum style --foreground 212

cat "$TARGET_FILE" | \
  jq -r "select(.source == \"$SOURCE\") | .payload" | \
  mods --format json \
  "Act as a Scottish Enlightenment Polymath. Distill this news into a strict JSON object.
   
   CONTEXTUAL LEXICON:
   $LEXICON_CONTEXT

   REQUIREMENTS:
   1. Identify 'hollow_nodes' specifically using the provided Lexicon definition (unexplored conceptual spaces).
   2. Assign an 'impact_score' (1-10) based on how much this news reduces 'Conceptual Entropy'.
   3. Ensure the 'summary_md' uses terms like 'Mentation' where appropriate.
   
   JSON SCHEMA:
   {
     'headline': string,
     'impact_score': number,
     'hollow_nodes': string[],
     'summary_md': string,
     'tags': string[]
   }" > "$ARTIFACT_FILE"

# ... (Validation and Display logic) ...

```

### 3. Opinion: The "Colocated Persona"

This approach is highly effective for a "real world test" for three reasons:

1. **Semantic Gravity:** By forcing `mods` to use the **Conceptual Lexicon**, the daily news doesn't just feel like "the internet"; it feels like an extension of your own project's thought process.
2. **Minimum Friction:** Keeping the lexicon in the `~/.amalfa/intel` folder means the script doesn't have to guess where your project root is. It’s a self-contained intelligence environment.
3. **WUI Readiness:** When the Web UI renders these cards, the tags and concepts will match the hover-tooltips and links already defined in your **SSR Docs Server**, creating a unified "Skin" (Concept-05) across the platform.

### Next Step

To finalize the colocation, would you like me to provide a **"Lexicon Slimming" script**? This would extract only the most relevant "Core Concepts" from your `conceptual-lexicon-ref-v1.79.json` to keep the `mods` prompt token-efficient.