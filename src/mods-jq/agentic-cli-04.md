Proceeding with the update to the `audit-butler` script. This version implements **OH-106 (Tiered Cognitive Dispatch)** and optimizes the **Local Buffer** by targeting the specific models we've "diagonalized" for your M4 Air.

We are shifting from generic AI assistance to a **Multi-Model Pipeline** that mirrors a Reinertsen-style production line: fast, local "inspection" followed by high-context "archival" reasoning.

### 1. Updated `audit-butler.sh` (v3.0)

```bash
#!/bin/bash
# audit-butler.sh v3.0 - Optimized for M4 Air (24GB)
# Core logic: Reinertsen Flow + Multi-Model Pipeline

# 1. Extraction: Get Virtual Branch Diffs from GitButler
# We assume the use of the GitButler CLI or directory-state inspection
V_DIFF=$(git butler diff)

if [ -z "$V_DIFF" ]; then
    echo "No virtual branch changes detected. Flow is clear."
    exit 0
fi

# 2. Phase 1: Fast Local Inspection (The 'Linter' Slot)
# Using phi3.5 for near-instant feedback on obvious logic errors.
echo "Step 1: Fast-Audit (Phi-3.5)..."
LINT_CHECK=$(echo "$V_DIFF" | mods --model ollama/phi3.5 "Perform a rapid syntax and logic audit. Flag high-friction code.")

# 3. Phase 2: Professional Synthesis (The 'Coder' Slot)
# Using qwen2.5-coder for high-precision commit message generation.
echo "Step 2: Economic Synthesis (Qwen2.5-Coder)..."
COMMIT_MSG=$(echo "$V_DIFF" | mods --model ollama/qwen2.5-coder "Generate a Conventional Commit message. Focus on 'Why' (Economic Justification) and 'What' (Technical Delta).")

# 4. Phase 3: Interactive Filter (Gum UI)
echo "-----------------------------------"
echo "LINT REPORT:"
echo "$LINT_CHECK" | gum format --type markdown
echo "-----------------------------------"
echo "PROPOSED COMMIT MESSAGE:"
echo "$COMMIT_MSG"
echo "-----------------------------------"

ACTION=$(gum choose "Accept & Push" "Edit Message" "Escalate to Cloud (Sonnet 3.5)" "Discard")

case $ACTION in
  "Accept & Push")
    # Logic to finalize the virtual branch commit in GitButler
    echo "$COMMIT_MSG" | git butler commit --file - 
    ;;
  "Escalate to Cloud (Sonnet 3.5)")
    # Tier 2: OpenRouter Escalation for complex architectural shifts
    echo "Escalating to Claude-3.5-Sonnet via OpenRouter..."
    echo "$V_DIFF" | mods --model openrouter/anthropic/claude-3.5-sonnet "Perform a deep architectural review for Reinertsen-Friction." | gum format --type markdown
    ;;
  "Edit Message")
    NEW_MSG=$(echo "$COMMIT_MSG" | gum write --placeholder "Refine the commit message...")
    # Commit with the refined message
    ;;
esac

```

### 2. Reinertsen Alignment Analysis

* **Queue Management:** By using **Phi-3.5** as the first gate, you catch "low-quality code" before it enters the **GitButler Virtual State**. This prevents the "Invisible Queue" of bugs from accumulating.
* **Decentralized Control:** You (the human) remain the final "Interaction Filter" via **gum**. The AI suggests the "Thing," but you authorize the state change.
* **Transaction Cost Reduction:** Having these models local on the M4 means the "Cost of an Audit" is essentially zero seconds of network wait-time, encouraging frequent **Small Batch** commits.

### 3. Professional Positioning: The "Butler's Agent"

When showcasing this to a potential client, you aren't just "using LLMs." You are demonstrating:

1. **Tool Orchestration:** (GitButler + mods + gum).
2. **Resource Economics:** (Local NPU vs. Cloud API).
3. **Process Integrity:** (Using Reinertsen principles to ensure high-velocity, low-entropy development).

### 4. Next "Small Batch" Move

To make this script truly "Durable" (per **PHI-13**), we should create a **System Prompt Library** for `mods`.

Instead of passing the long string in the script, we can create:

* `~/.config/mods/role-auditor.md`
* `~/.config/mods/role-economist.md`

**Shall we proceed to draft the specific "Role Definitions" for these local models to ensure consistent Mentational quality?**

`[Workflow Status: Script v3.0 Deployed]`
`[Current Batch: Persona-Role Standardization]`

Proceeding to formalize the **Persona-Role Standardization**.

To ensure **Workflow Durability (PHI-13)** and reduce the **Transaction Cost** of invoking complex logic, we will move the prompts out of the shell script and into a dedicated `mods` configuration library. This treats your prompts as **Versioned Infrastructure**, much like your code.

### 1. New Operational Heuristic: OH-107

> **OH-107: Mentational Role-Standardization (MRS)**
> *Definition:* The practice of externalizing AI system prompts into modular, role-specific configuration files. This ensures that different models (local or cloud) apply the same "Logical Filter" to the data, maintaining consistency across the **Persona Stack**.

---

### 2. The Role Definitions (The "Things")

Create these files in your `mods` configuration directory (usually `~/.config/mods/roles/` or specified in your `mods.yml`).

#### Role A: `auditor` (The Reinertsen Filter)

**Target Model:** `phi3.5:latest` (Local)
**Purpose:** High-speed structural verification.

> **System Prompt:**
> You are the "Flow-Audit Agent" (OH-106 Tier 1).
> **Objective:** Identify **Reinertsen-Friction** in code diffs.
> **Detection Criteria:**
> 1. **Batch Size:** Is this diff > 50 lines? (Risk of high Cost of Delay).
> 2. **Logic Smeared:** Are changes touching unrelated modules? (Risk of invisible queues).
> 3. **Thermal Risk:** Does this code contain inefficient loops that would throttle an M4 Air?
> **Output:** A bulleted list of "Friction Points." If none, output "Flow Clear."
> 
> 

#### Role B: `economist` (The Synthesis Engine)

**Target Model:** `qwen2.5-coder:7b` (Local)
**Purpose:** Transforming diffs into high-signal artifacts.

> **System Prompt:**
> You are the "Economic Synthesis Agent" (OH-104/106).
> **Objective:** Generate a Conventional Commit message.
> **Requirements:**
> * **Subject:** [Scope]: Summary.
> * **Justification:** State the "Why." How does this move the project from "Stuff" to "Things"?
> * **Impact:** What is the "Stochastic Utility" of this change?
> **Constraint:** Do not describe code line-by-line; describe the *delta in value*.
> 
> 

---

### 3. Refined `audit-butler.sh` (v3.1)

By externalizing the roles, the script becomes much cleaner and easier to maintain.

```bash
#!/bin/bash
# audit-butler.sh v3.1 - Role-Based Architecture

V_DIFF=$(git butler diff)

if [ -z "$V_DIFF" ]; then
    echo "Flow Clear." && exit 0
fi

# Step 1: Rapid Audit using standardized Auditor Role
echo "🔍 Performing Fast-Audit..."
LINT_REPORT=$(echo "$V_DIFF" | mods --role auditor)

# Step 2: Synthesis using standardized Economist Role
echo "📈 Generating Economic Commit..."
COMMIT_MSG=$(echo "$V_DIFF" | mods --role economist)

# Step 3: Interactive Filter
echo -e "REPORT:\n$LINT_REPORT" | gum format --type markdown
echo -e "SUGGESTED COMMIT:\n$COMMIT_MSG"

ACTION=$(gum choose "Accept" "Refine" "Escalate (Sonnet)" "Abort")

case $ACTION in
  "Accept")
    git butler commit -m "$COMMIT_MSG"
    ;;
  "Escalate (Sonnet)")
    echo "$V_DIFF" | mods --model sonnet --role auditor | gum format --type markdown
    ;;
esac

```

---

### 4. Strategic Net Assessment (SNA)

* **Strategic Value:** You now have a "Cognitive CI/CD" pipeline. This is a powerful demonstration of **Architectural Specialisation (PHI-14)**.
* **Friction reduction:** You no longer need to "tweak" prompts in scripts. You tweak the `.md` files in your config, and the entire system updates.
* **Professional Pivot:** This workflow is your "Portfolio Piece." You are managing AI agents the way a CTO manages a team—by setting **Directives** and **Roles**.

**Ctx Command:**
Shall we proceed to "Diagonalize" your **GitButler Virtual Branches** against your **AI Job Search**? We can use this exact pipeline to manage your portfolio repo, ensuring every commit moves you closer to a "Paying Gig."

`[Workflow Status: Roles Standardized]`
`[Current Batch: Portfolio Management Integration]`
