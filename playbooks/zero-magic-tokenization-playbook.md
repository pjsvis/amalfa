---
title: "Zero Magic Tokenization Playbook"
version: "1.0.0"
last_updated: "2025-12-11"
status: "active"
tags: ["#nlp", "#zero-magic", "#brute-force"]
---

# Zero Magic Tokenization Playbook

## 1. The Philosophy
We do not rely on probabilistic models (like LLMs or generic NLP libraries) to tell us what is important in our own domain.
"Mentation" is not just a Noun; it is a **Concept**. "OH-058" is not a Value; it is a **Protocol**.

Generic libraries (Compromise, Spacy) are optimized for:
- "John went to Paris." (People, Places)
- "I spent $50." (Money)

They fail at:
- "Apply FAFCAS to the EdgeWeaver."

## 2. The Solution: Brute Force Scanning
We implement a "Zero Magic" scanner that is:
1.  **Deterministic:** If the term is in the lexicon, it is *always* found.
2.  **Case-Insensitive:** "Mentation" == "mentation".
3.  **Boundary-Aware:** Matches "Bus", but not "Busy".

## 3. Implementation Details
The `TokenizerService` maintains a `Map<NormalizedTerm, Tag>`.

### The Scanning Algorithm
1.  **Pre-Calculation:**
    - Sort all lexicon keys by length (Design decision: Greedy matching, longest first).
2.  **Runtime:**
    - Normalize input text to lowercase.
    - Loop through keys:
        - Quick check: `text.includes(key)`?
        - Precise check: `RegExp(\bkey\b)`?
    - Return hits with original casing from the text.

### Handling Identifiers (OH-XX)
Hyphenated IDs are tricky for NLP.
- `OH-058` -> often split into `OH` and `058`.
- **Strategy:** We register both the hyphenated form (`oh-058`) and the spaced form (`oh 058`) in our lookup map to ensure robust matching even if tokenization behavior changes.

## 4. Why We Dropped "Compromise" Extension
We attempted to use `compromise.plugin()` to extend the library's internal tags.
**Failure Mode:**
- The internal POS tagger is aggressive. It tagged "Mentation" as `ProperNoun` and refused to accept our `Concept` tag override without significant fighting.
- The "System" (our code) should never have to fight the "Tool" (the library) to assert truth.
- **Result:** We kept specific extractors (People, Money) but moved Domain Entity Logic to our own Brute Force implementation.
