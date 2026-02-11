This integrated **`ctx-flow`** script embodies the principles of **Workflow Durability** and **Deductive Minimalism**. By utilizing `td` as a checksum, we ensure that the "Sleeve" (your local environment) maintains rigorous control over the "Substrate" (the AI agent).

### The "Ctx-Flow" Master Script

```bash
#!/bin/bash

# ==============================================================================
# CTX-FLOW: Resilient Agentic Development Workflow
# Tools: gh, git, git-butler, mods, gum, td
# ==============================================================================

set -e

# 1. INGEST & CONSOLIDATE (Stuff -> Thing)
# ------------------------------------------------------------------------------
echo "--- Initializing Ingestion ---"
ISSUE_JSON=$(gh issue list --limit 30 --json number,title,body | gum filter --placeholder "Select target Issue...")
ISSUE_NUM=$(echo "$ISSUE_JSON" | jq -r '.[0].number')
ISSUE_TITLE=$(echo "$ISSUE_JSON" | jq -r '.[0].title')

# Create local Brief artifact [OH-096]
BRIEF_PATH="./briefs/issue-${ISSUE_NUM}.md"
mkdir -p ./briefs

echo "Synthesizing Brief for #$ISSUE_NUM..."
echo "$ISSUE_JSON" | mods --role architect "Synthesize this issue into a technical brief. Include specific files to modify." > "$BRIEF_PATH"

gum toast "Brief created: $BRIEF_PATH"

# 2. INITIALIZE CHECKSUM (td)
# ------------------------------------------------------------------------------
# We seed 'td' with our Critical Process Checklist [OPM-9]
td clean
td add "Verify failing test matches Brief criteria"
td add "Implement logic in isolated GitButler Lane"
td add "Perform ADV-8 Pre-Mortem (identify edge cases)"
td add "Update Playbook with lessons learned"

# 3. WORK (The GitButler / Agent Handover)
# ------------------------------------------------------------------------------
# Create a lane name based on the Locus Tag [CL: Locus Tag]
LANE_NAME="ctx-issue-${ISSUE_NUM}"

# Note: If git-butler CLI is not available, we use a standard branch 
# that GitButler will pick up as a virtual lane.
git checkout -b "$LANE_NAME"

echo "Handing over to Agent. Check the 'td' list regularly."
gum spin --spinner monkey --title "Agent working on $LANE_NAME..." -- \
  mods --file "$BRIEF_PATH" "Execute the changes in $LANE_NAME. Update the 'td' checklist as you complete steps."

# 4. DEBRIEF & CHECKSUM (The Verification)
# ------------------------------------------------------------------------------
echo "--- Workflow Checksum Audit ---"
if td | grep -q "\[ \]"; then
    gum style --foreground 214 "⚠️ WARNING: Some tasks remain incomplete in 'td'."
    td
    gum confirm "Proceed to Debrief regardless?" || exit 1
fi

# Generate the Debrief [CL: Debrief]
DIFF=$(git diff main)
echo "$DIFF" | mods "Compare this diff against the Brief in $BRIEF_PATH. Summarize changes and identify any 'Compulsive Narrative Syndrome'." > "./debriefs/issue-${ISSUE_NUM}-debrief.md"

# 5. PR & SYNC
# ------------------------------------------------------------------------------
if gum confirm "Open Pull Request?"; then
    gh pr create --title "Fix: $ISSUE_TITLE (#$ISSUE_NUM)" --body-file "./debriefs/issue-${ISSUE_NUM}-debrief.md"
fi

```

---

### Why this is "Resilient" & "Lightweight"

1. **Checksum Integrity:** The `td` list acts as a **Local State Sentinel**. Even if the `mods` agent outputs a large volume of code, the script checks if it actually marked the specific process tasks (like TDD or Pre-Mortem) as complete.
2. **Cognitive Orientation [OH-080]:** The use of `gum filter` means you never have to remember which issue you were working on. The script pulls the "Context" directly from the source of truth (GitHub).
3. **Low-Tech Defense:** By relying on standard CLI tools (`td`, `git`, `gh`) rather than a complex proprietary agent platform, you avoid **Complexity Collapse**.
4. **Parallel Execution:** Because GitButler manages the lanes, you can run this script three times for three different issues. Each will have its own `BRIEF.md` and its own `td` checklist in the local directory, which GitButler will keep isolated.

### Final Ctx Opinion:

This setup represents a **Mentation Bridge** between your intent and the codebase. It satisfies the **Principle of Architectural Specialisation**—`gh` for state, `td` for checklists, `mods` for intelligence, and `GitButler` for the file-system "territory."

**Would you like me to refine the `mods` system prompt (the "Sleeve") specifically to ensure it knows how to interact with the `td` CLI?**