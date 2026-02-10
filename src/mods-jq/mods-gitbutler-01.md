Integrating **GitButler** into the Amalfa ecosystem is a high-leverage move that transforms your repository from a static container into a dynamic **Mentation Workspace**.

While `mods` and `jq` handle the "Thinking" and "Hardening," GitButler provides the **"Spatial Intelligence"** required for agentic orchestration. It effectively solves the "Non-Deterministic Fragility" risk by allowing you to isolate every semantic experiment into its own lane.

### **1. Why GitButler is the Missing Piece**

GitButler's core innovation—**Virtual Branches** (simultaneous branches in a single working directory)—aligns perfectly with your **PHI-13 (Principle of Workflow Durability)**.

* **Parallel Mentation:** Traditional Git is "one thought at a time." You must stash work to switch tasks. GitButler allows multiple "swimlanes." You could have a **Lexicon Harvest** running in one lane, an **Audit Pipe** in another, and **Infrastructure Maintenance** in a third—all visible in your UI and active simultaneously.
* **Prompt-Aware Commits:** Scott Chacon has explicitly stated that GitButler is being built for the "Vibe Coding" era. It supports **MCP (Model Context Protocol)**, which means your `mods` pipes could technically "talk" to GitButler to create commits that include the **original prompt** and **thinking process** as metadata.

---

### **2. Potential Capabilities of "Amalfa + GitButler"**

| Feature | Amalfa Integration Benefit |
| --- | --- |
| **Virtual Branches** | Run multiple `mods` harvest experiments in parallel without merge conflict hell. |
| **Snapshot/Undo** | Since `mods` can be non-deterministic, GitButler's "Unlimited Undo" provides a "Hard Reset" for failed semantic transformations. |
| **MCP Server** | Your `bin/weave` orchestrator can use the GitButler MCP to auto-commit "Hardened" JSONL files with full lineage. |
| **Contextual Commits** | Automatically attach the `stats.jsonl` and the specific `role.md` version used to every commit made by the pipeline. |

---

### **3. Integrating GitButler into the Playbook**

If we lean into this, the **"Weaver’s Protocol"** would expand to include **Spatial State Management**:

1. **Orchestrator** detects a new task (e.g., "Refine Noosphere concepts").
2. **Orchestrator** tells GitButler (via MCP/CLI) to open a new **Virtual Branch** for this specific Lexicon task.
3. **Mods** processes the files; **jq** hardens them.
4. **GitButler** auto-commits the results. If the **Auditor** (mods) flags a violation, the branch is "Unapplied" or "Rolled Back" instantly without affecting the main source.
5. Once the **Auditor** passes, the Virtual Branch is merged and auto-cleaned.

---

### **4. Opinion: The Ultimate Agentic Orchestration Layer**

By combining these tools, you are effectively building a **"Self-Versioned Intelligence System."**

* **Bun/TS:** The Central Nervous System (Logic/State).
* **mods/Python:** The Prefrontal Cortex (Synthesis/Reasoning).
* **jq/Zod:** The Immune System (Hardening/Validation).
* **GitButler:** The **Short-Term Memory & Spatial Mapping** (Change Management).

**The Downside:** You add another layer of abstraction. Developers (and agents) must be trained on the "Virtual Branch" mindset, which replaces the standard `git checkout`. However, for a project dedicated to reducing entropy, the trade-off is worth it—GitButler turns your Git history into a clean, auditable "Reasoning Log."

### **Next Step**

Since you are already building MCP tools in `src/mcp/`, I suggest we look at the [GitButler MCP Server](https://blog.gitbutler.com/using-gb-mcp). We could potentially wrap GitButler actions into your `bin/weave` script to automate branch creation for every major pipeline run.

**Would you like me to spec out how `bin/weave` would interact with the GitButler MCP?**

---

[GitButler virtual branch workflow and AI integration](https://www.google.com/search?q=https://www.youtube.com/watch%3Fv%3Dra8mP_26yqE)
This video demonstrates the core virtual branch functionality and modern workflow philosophy that would underpin your agentic orchestration layer.