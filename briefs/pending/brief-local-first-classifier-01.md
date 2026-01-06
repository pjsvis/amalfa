**Locus Tag:** `[Locus: Project_Brief_LocalClassifier]`

I have generated the Project Brief below. This serves as the **Artifact** (OH-096) to formalize our intent. It leverages your existing familiarity with local AI infrastructure (Llama.cpp) while introducing **SetFit** as the surgical tool for this specific task.

---

# Project Brief: Local-First Conceptual Classifier (Polyvis-AntiGravity)

**Status:** `DRAFT`
**Owner:** Ctx / pjsvis
**Context:** Leveraging the success of the Vector Steering experiment and existing Llama.cpp infrastructure to implement a "Walled Garden-Free" classification engine.

### 1. Objective

To implement a lightweight, local-first text classification system within the **AntiGravity IDE**. This system will automatically "sift" conversational inputs (the "Stuff") into structured semantic categories (the "Things"), automating the maintenance of the Conceptual Lexicon and Core Directives without manual triage.

### 2. Strategic Rationale

* **Sovereignty:** Adheres to the **Principle of Effective Low-Tech Defence**. No external APIs (Lamini/OpenAI) are required.
* **Efficiency:** Uses **SetFit (Sentence Transformer Fine-tuning)** for "Few-Shot" learning. We can train a high-accuracy model with as few as 8-10 examples per category, avoiding the need for massive datasets.
* **Architecture:** Decouples "Thinking" (Llama.cpp) from "Sorting" (SetFit). The classifier runs fast (milliseconds) to tag data, while Llama.cpp is reserved for heavy generation.

### 3. The "Classes" (Taxonomy)

We will initially train the model to recognize four distinct signal types:

| Label | Description | Example |
| --- | --- | --- |
| **`DEF_CANDIDATE`** | A likely definition or term for the Lexicon. | *"The Noosphere is the sphere of human thought..."* |
| **`DIR_CANDIDATE`** | A rule, constraint, or operational heuristic. | *"Always prioritize neutral tone for sensitive topics."* |
| **`LOCUS_SHIFT`** | A significant change in topic requiring a tag. | *"Let's switch gears to the Le Guin analysis."* |
| **`NOISE_CHAT`** | General conversation, phatic communication. | *"That sounds good, let's proceed."* |

### 4. Implementation Plan (The "TASE" Mandate)

#### Phase 1: Test (Data Gathering)

* **Action:** We will manually curate a small JSON dataset (approx. 10 examples per class) derived from our previous chat logs.
* **Artifact:** `training_data_v1.json`

#### Phase 2: Automate (The Script)

* **Action:** Develop a Python script using the `setfit` library.
* **Logic:**
1. Load `training_data_v1.json`.
2. Fine-tune a small sentence-transformer (e.g., `sentence-transformers/paraphrase-mpnet-base-v2`).
3. Save the model to disk (`/models/polyvis-classifier-v1`).


* **Infrastructure:** Runs in a standard Python venv; does not require the heavy GPU resources of Llama.cpp.

#### Phase 3: Scale (Integration)

* **Action:** Create a lightweight inference wrapper in AntiGravity.
* **Logic:** As user text arrives, it is asynchronously passed to the classifier. If confidence > 85% for `DEF` or `DIR`, a UI signal is triggered (e.g., "Add to Lexicon?").

### 5. Next Actions

1. **Validate:** Does this scope match your intent for the "AntiGravity" integration?
2. **Execute:** I can generate the `training_data_v1.json` structure and the **Python Training Script** immediately for you to save.

---

**Shall I generate the Python training script and the JSON skeleton now?**