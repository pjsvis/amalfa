### Brief: Prefix-Aware Substrate Mapping (RESONANCE)

**Status:** Proposed  
**Context:** Multi-Repo Flexibility / Structural Grounding  
**Metaphor:** The Adaptive Lens

#### 1\. Objective

To refine the **RESONANCE** engine's ingestion logic so it can handle both "Sovereign" root folders (embedded in software projects) and "Consolidated" sub-folders (pure document analysis) with equal precision. The goal is to ensure the 3D Graph remains clean and deterministic, regardless of the physical substrate location.

#### 2\. The Problem: "Path Shimmering"

Currently, the `StructureWeaver` extracts the "Bucket" (Collection) name from the top-level directory.

  * **Embedded Mode:** `briefs/my-feature.md` → Bucket: `Briefs`.
  * **Consolidated Mode:** `resonance/briefs/my-feature.md` → Bucket: `Resonance`.
    This creates "shimmering" where the graph topology changes based on the folder depth, breaking the **Two-Level Rule** (Collection → Item).

#### 3\. Execution Plan: Prefix-Aware Logic

We will implement a `substrate_root` parameter in our configuration. If a path begins with this prefix, the engine will "strip" it before calculating the Bucket identity.

1.  **Normalization:** The `StructureWeaver` will check `settings.paths.docs.root`.
2.  **Strip Prefix:** If a file path starts with the designated root (e.g., `resonance/`), it is ignored for bucket naming.
3.  **Deterministic Mapping:** `resonance/briefs/plan.md` becomes `briefs/plan.md` in the engine's mind, placing it correctly in the `Briefs` collection.

-----

#### 4\. The JSON Schema Strategy

To ensure `polyvis.settings.json` remains the "Source of Truth" without becoming a source of errors, we will generate a strict JSON Schema.

**Step: Schema Generation (`scripts/schema/gen-settings-schema.ts`)**

  * **Purpose:** To provide IDE auto-completion and validation for the "Triangle of Truth" mappings.
  * **Constraint:** The schema will enforce the `mappings` tuple structure (e.g., `[string, string]`) and validate that all `sources` exist in the defined `paths`.
  * **Safety:** This prevents "Ghost Buckets" where a user typos a folder name in the settings, causing the ingestion daemon to skip it silently.

-----

#### 5\. Updated "Triangle of Truth" Settings Structure

The schema will validate this deterministic structure:

```json
{
  "$schema": "./schemas/polyvis.settings.schema.json",
  "paths": {
    "sources": {
      "experience": {
        "substrate_root": "resonance",
        "directories": ["briefs", "debriefs", "docs"],
        "mappings": [
          ["briefs", "brief"],
          ["debriefs", "debrief"],
          ["docs", "reference"]
        ]
      }
    }
  }
}
```

#### 6\. Opinion: The "Zero-Tax" Refactor

By making the engine prefix-aware and validating it with a JSON schema, we remove the "Structure Tax." Users don't have to change their habits; the engine adapts its "Lens" to find the resonance in the folders exactly where they lie. This fulfills the **Optimal Simplicity [OH-041]** principle while maintaining the **Due Diligence** required for forensic-grade analysis.