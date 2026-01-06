## Task: Agentic RAG with Judicial & Bayesian Validation

```markdown
**Next Step:**
We should update the **Agentic RAG Brief** (`briefs/brief-agentic-rag-experiments.md`) to explicitly mention that the "Critic" node should ideally be a **Vector-Steered Local Model** (from your squadron) rather 

**Objective:** To prototype a "self-improving" cognitive loop that uses **Judicial Scoring** (rubric-based consistency) and **Bayesian Reasoning** (evidence-based confidence updating) to strictly validate retrieved context before generating answers.
```

- [ ] **The Gatekeeper (Query Refinement):** Classify query ambiguity and generate "hypothetical document embeddings" (HyDE).
- [ ] **The Auditor (Judicial Scoring):** Replace binary "good/bad" checks with a **Judicial Scoring Rubric (1-5)**. This reduces "noise" by forcing the model to adhere to strict criteria rather than "vibes".
- [ ] **The Bayesian Stop-Protocol:** Implement a confidence update step. Start with a "Prior" (low confidence), and after each retrieval, update the "Posterior" confidence based on the Judicial Score. Only answer when the Posterior exceeds a defined threshold (e.g., 85%).

## Key Actions Checklist:

- [ ] **Develop the Judicial Rubric:** Create a clear, text-based scoring guide (e.g., "Score 5 = Contains explicit statistical evidence matching the query entities; Score 1 = Topic mismatch").
- [ ] **Prototype the Bayesian Update Logic:**
    * *Prior:* 0.5 (Uncertain)
    * *Evidence:* Judicial Score of retrieved chunks.
    * *Update:* If Score > 4, Confidence -> 0.9. If Score < 2, Confidence -> 0.3.
- [ ] **Implement the "Information Gain" Loop:** The system should only "re-query" if the confidence is low *and* the potential for new information is high.
- [ ] **Baseline Control:** Run the 10 "hard" queries without these protocols to measure the improvement in precision vs. the cost in latency.

## Detailed Requirements / Visuals

**The Bayesian Evidence Loop**

```mermaid
graph TD;
    A[User Query] --> B{Gatekeeper Check};
    B -- Ambiguous --> C[Ask Clarification];
    B -- Clear --> D[Set Prior Confidence 0.5];
    D --> E[Retrieve Docs];
    E --> F[Auditor Scores 1-5];
    F --> G{Bayesian Update};
    G -- Low Confidence --> H[Refine Query and Loop];
    H --> E;
    G -- High Confidence --> I[Synthesize Answer];
    G -- Max Loops --> J[Answer with Caveats];