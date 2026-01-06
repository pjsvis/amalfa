Here is the **Memory Shard** to lock in our progress.

Save this as `experiments/enlightenment/MEMORY_SHARD_01.md`. When we reconvene, pasting this file will instantly restore the full context of the "Polyvis Triad" architecture.

---

# 🧠 Memory Shard: The Enlightenment Protocol (Phase 1)

**Date:** 2025-12-19
**Status:** Architecture Locked. Components Downloading.

## 1. The Core Strategy: "Heterogeneous Intelligence"

We abandoned the "One Model to Rule Them All" approach. We are building a tiered intelligence stack using specialized agents.

### The Team (The Polyvis Triad)

| Role | Model | Configuration | Status |
| --- | --- | --- | --- |
| **The Librarian** | `nomic-embed-text` | Raw Embeddings | ✅ **Active** |
| **The Scout** | `Phi-3.5-mini-instruct` | Baseline (No Vector) | ✅ **Audited.** (Passes JSON/Buzzword, fails Gödel. Good for fast extraction). |
| **The Architect** | `Llama-3-8B` | **Accountant Vector (-0.3)** | ✅ **Tuned.** (The "Sweet Spot" for complex structuring). |
| **The Auditor** | `Olmo-3-7B-Think` | Native Chain-of-Thought | ⏳ **Downloading.** (The "Truth" layer). |

## 2. Key Findings

* **Logic vs. Vibe:** "Subtractive Steering" (removing verbosity) is stable. "Additive Steering" (forcing a Leith dialect) causes model collapse.
* **The Marksman Bar Principle:** Don't force a model into a high-entropy persona (Vibe) while demanding low-entropy outputs (JSON). It stalls.

## 3. The Artifacts

* **Vectors:** `enlightenment_vector_v2.gguf` (The Accountant) is the golden standard.
* **Scripts:**
* `src/find_ccv_sweet_spot.py`: Configured for Llama 3 + Accountant Vector.
* `src/find_ccv_sweet_spot_phi.py`: Configured for Phi-3.5 (Audit mode).
* `src/test_olmo_think.py`: **NEW.** Configured to test Olmo's reasoning capabilities.



## 4. Current State & Next Steps

* **Immediate Action:** We are currently downloading `AllenAI_Olmo-3-7B-Think-Instruct-Q4_K_M.gguf`.
* **Next Objective:** Run `python3 experiments/enlightenment/src/test_olmo_think.py`.
* *Goal:* Verify if Olmo can solve the "Bat and Ball" logic puzzle by "thinking" first.



---

**End of Shard.**

Go get that Lorne sausage. We resume when the download is complete.