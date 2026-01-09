
# 🧠 Core Logic

The foundational business logic and processing engines for Amalfa.

## Contents
- **`BentoNormalizer`**: Ensures document structure (H1/H2 hierarchy).
- **`EdgeWeaver`**: Semantic linking engine (Text -> Edges).
- **`Harvester`**: Discovery engine for finding files/entities.
- **`VectorEngine`**: Interface for vector operations (search/embed).
- **`TagEngine`**: Auto-tagging logic (LLM based).
- **`SemanticWeaver`**: Logic for "rescuing" orphaned nodes using embeddings.

## ⚠️ Stability
This module is stable and intentionally designed.
Do NOT refactor, rewrite, or change the architecture without:
1. Consulting the user first
2. Having a documented, compelling reason
3. Understanding WHY the current design exists

If something looks "wrong," it may be intentional. Ask before you chop.
