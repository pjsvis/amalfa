Integrating GitHub Issues into our **Mission Forge** TUI provides the final link for external accountability and project tracking. By bridging the local `td` state with GitHub, we satisfy **PHI-5 (Explicit Formulation)**: the "Mission" exists both in our local "Laboratory" (terminal) and our public "Archive" (GitHub).

### 1. Implementation Brief: GitHub-Integrated Mission Forge

```markdown
---
date: 2026-02-10
tags: [tui, handoff, github, td, workflow]
agent: gemini
---

## Task: GitHub-Integrated Mission Forge

**Objective:** Extend the TUI to create GitHub issues alongside `td` tasks, linking the local implementation brief to the remote issue tracker for a unified state.

- [ ] [Script] Update `bin/amalfa-handoff` to use the GitHub CLI (`gh`).
- [ ] [Integration] Link the GitHub Issue URL back to the `td` task as metadata.
- [ ] [Status] Create a "Mission Control" view to list active missions and their remote status.
- [ ] [Validation] Ensure the hand-off includes the "Scottish Enlightenment" briefing as the issue body.

## Technical Notes:
- **State Synchronisation:** `td` remains the "Source of State" for agents; GitHub is the "Source of Record" for humans.
- **Workflow Durability (PHI-13):** If local state is lost, the GitHub issue provides the path to recover the linked Brief.

```

---

### 2. The Enhanced TUI Script (`bin/amalfa-handoff`)

This script now orchestrates the creation of the mission across three layers: the filesystem, `td`, and GitHub.

```bash
#!/bin/bash
# amalfa-handoff: select brief -> create GitHub Issue -> link to td -> handoff

# 1. Select the Brief
BRIEF=$(find briefs -name "*.md" | gum filter --header "Select implementation brief")
[ -z "$BRIEF" ] && exit 0

# 2. Extract context for the Issue Body
MISSION_TITLE=$(basename "$BRIEF" .md | tr '-' ' ' | sed 's/^[0-9]\{4\} [0-9]\{2\} [0-9]\{2\} //')
BRIEF_CONTENT=$(cat "$BRIEF" | head -n 20) # Grab the start for the issue body

# 3. Create GitHub Issue (requires gh cli)
echo "Creating GitHub Issue..." | gum style --foreground 212
GH_URL=$(gh issue create --title "Mission: $MISSION_TITLE" --body "$BRIEF_CONTENT" --label "agent-task")

# 4. Initialize td with the GitHub context
ISSUE_ID=$(echo "$GH_URL" | grep -oE "[0-9]+$")
td create "Mission #$ISSUE_ID: $MISSION_TITLE" --id "$ISSUE_ID"
td link "$ISSUE_ID" "$BRIEF"

# 5. Dashboard Summary
gum style --border double --margin "1 1" --padding "1 2" --foreground 120 \
    "MISSION KICKED OFF" \
    "LOCAL ID: #$ISSUE_ID" \
    "REMOTE: $GH_URL" \
    "BRIEF: $BRIEF"

if gum confirm "Assign to Substrate for implementation?"; then
    td start "$ISSUE_ID"
    echo "Agent Substrate engaged for Mission #$ISSUE_ID." | gum style --foreground 212
fi

```

---

### 3. Mission Status Dashboard: "The Triage"

To handle your requirement for a "list of stuff in various states," we can create a simple `bin/amalfa-status` command. This uses `td` to show our local pipeline and `gh` to show external status.

```bash
#!/bin/bash
# amalfa-status: High-signal overview of all stuff in-flight

echo "--- LOCAL MISSIONS (TD) ---" | gum style --bold --foreground 212
td list --format table

echo ""
echo "--- REMOTE RECORD (GITHUB) ---" | gum style --bold --foreground 212
gh issue list --label "agent-task"

```

---

### 4. Opinion: The "Bicameral" Project Management

**1. The Signal Path**
Selecting a brief in the TUI acts as the "Priming" of the system. By the time you hit "Confirm," the system has generated a permanent web link. This is crucial for **COG-5 (Systemic Limitation Awareness)**—it ensures that if the AI's local context window resets, it has a "High-Res" anchor point (the GitHub issue) to find its way back to the Brief.

**2. The Status List**
Having a list of "Stuff in various states" (Backlog, In-Progress, Handoff) fulfills the **Scottish Enlightenment** desire for systematic organization. It prevents **Conceptual Entropy** by showing you exactly where the "Stuff" is on its journey to becoming a "Thing."

**3. Minimum Friction**
Because this uses `gh` and `td` under the hood, there is no manual data entry. You choose the markdown file, and the machinery handles the cross-linking.

**Next Step:** Would you like me to create a specific "Mission" template for `mods` so it can automatically post an **Implementation Plan** as a comment on the GitHub issue immediately after you kick it off?