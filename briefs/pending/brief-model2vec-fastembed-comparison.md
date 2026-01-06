# Agent Task: The "FAFCAS" Protocol (Model2Vec vs FastEmbed)

[Ref: make sentence transformers smaller and faaster](https://medium.com/coding-nexus/make-sentence-transformers-50-smaller-and-500-faster-with-model2vec-ad2b1fb002aa)

**Context:**
We are benchmarking a potential migration from `fastembed` to `model2vec` for the **PolyVis** architecture.

* **Goal:** drastic reduction in payload size and ingestion time without sacrificing edge quality.
* **Constraint:** All embeddings must undergo **FAFCAS Normalization** (L2 Normalization) to enable fast scalar product retrieval instead of expensive cosine distance calculations.

## Experiment Requirements

Write a script (Python preferred for this test) that performs an `A/B` comparison on a sample set of local Markdown files.

### 1. The Pipeline

For both models (Baseline: `fastembed`, Challenger: `model2vec`), the pipeline is:

1. **Ingest:** Read raw text from Markdown.
2. **Embed:** Generate raw vectors.
3. **FAFCAS:** Normalize all vectors to Unit Length ().
* *Note: Ensure `numpy.linalg.norm` is used.*


4. **Store:** Keep in memory.

### 2. The Metrics

Calculate and display the following for both models:

* **A. "Fast As F*ck" (Speed & Size):**
* **Model Load Time:** (ms)
* **Embedding Velocity:** (docs/sec)
* **Physical Size:** (MB on disk for the model files)
* **Vector Payload:** (MB for the resulting embedding array)


* **B. "Cool As Sh*t" (Edge Quality):**
* Compute the **Dot Product** (Scalar Product) for all document pairs.
* *Since vectors are normalized, Dot Product == Cosine Similarity.*
* **Distribution Analysis:**
* Mean Similarity Score.
* Variance (Standard Deviation).
* **Edge Count:** How many pairs have a score ?





### 3. Output Format

Print a comparison table to `stdout`:

```text
| Metric | FastEmbed (Current) | Model2Vec (Target) | Improvement |
| :--- | :--- | :--- | :--- |
| Model Size (MB) | ... | ... | ... |
| Vectors (MB) | ... | ... | ... |
| Ingest Time (s) | ... | ... | ... |
| Edge Count (>0.8) | ... | ... | ... |
| Variance | ... | ... | ... |

```

### 4. Implementation Notes

* **Model2Vec Source:** Use `minishlab/potion-base-8M` (or similar distilled model) as the challenger.
* **FastEmbed Source:** Use `BAAI/bge-small-en-v1.5` (or your current default) as the baseline.
* **PolyVis Alignment:** Explicitly comment on whether `model2vec` produced *fewer* or *more* edges at the 0.80 threshold. We need to know if the "static" nature of the model collapses the vector space (everything looks the same) or expands it (better separation).

