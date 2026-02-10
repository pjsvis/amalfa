# Playbook: Agentic CLI Flow (mods + gum + gitbutler)

## Purpose

To provide a standardized protocol for AI agents to perform high-velocity, low-entropy development within the **GitButler** virtual branch ecosystem, utilizing **mods** for tiered cognition and **gum** for human-in-the-loop validation.

## Context & Prerequisites

* **Hardware:** Optimized for **M4 Air (24GB)**; favors local **Ollama** models for Small Batch tasks.
* **Tools:** `git-butler` (CLI), `mods`, `gum`, and `ollama` must be in the `$PATH`.
* **State:** A GitButler virtual branch must be active with uncommitted changes.

## The Protocol

### 1. State Extraction (The "Stuff" Phase)

Agents must extract the current delta without creating a formal commit.

1. Run `git butler diff --json` to capture the current virtual state as structured "Stuff".
2. If the output is empty, terminate the protocol (Flow Clear).

### 2. Tiered Cognitive Dispatch (OH-106)

Apply the appropriate model based on task complexity to manage **Cost of Delay**.

1. **Tier 1 (Audit):** Pipe the diff to `mods --role auditor` using a local model (e.g., `phi3.5`) for a rapid friction check.
2. **Tier 2 (Synthesis):** If the audit passes, pipe the diff to `mods --role economist` (e.g., `qwen2.5-coder`) to generate a **Stochastic Utility** commit message.

### 3. Interaction Filtering (The "Gum" Gate)

Never bypass the **Human in the Loop**.

1. Display the generated "Thing" (Commit Message) using `gum format`.
2. Use `gum choose` to present the following options to the user:
* **Accept:** Proceed with the commit.
* **Escalate:** Re-run the synthesis using a cloud model (e.g., `sonnet`) via OpenRouter if local output is "Grumpy".
* **Refine:** Open a `gum write` buffer for manual edits.
* **Abort:** Terminate the current batch.



### 4. Finalization (The "Thing" Phase)

1. Upon "Accept," execute the commit within the virtual branch: `git butler commit -m "[Generated Message]"`.
2. Issue a **Locus Tag** to mark the completion of the batch.

## Standards & Patterns

* **Atomic Batches:** If the diff exceeds 50 lines, the agent MUST flag a "Large Batch Warning".
* **Local-First:** Always attempt local **Ollama** processing before escalating to cloud providers to minimize transaction costs.
* **Transparency:** All AI-generated claims must be substantiatied by the diff (Artifact as Proof).

## Validation (Success Criteria)

* The virtual branch delta is successfully committed to the GitButler history.
* The commit message follows the "Economic Justification" structure (OH-104).
* The process was completed without incurring unnecessary cloud API costs for trivial tasks.

---

### Maintenance

This playbook implements **OH-107 (Mentational Role-Standardization)**. If the `mods` roles are updated, this protocol must be re-validated.

**Would you like me to persist this as `agentic-cli-flow-playbook.md` in your `playbooks/` directory?**