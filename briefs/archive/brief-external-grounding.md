# Project Brief: External Grounding & Schema Upgrade

**Objective:**
To transform the Knowledge Graph from a closed "Dictionary" into an open "Navigational Hub" by adding support for external references (URLs, DOIs, Source Code Links) to all nodes.

**Constraint Checklist:**
* **Schema:** Must use strict JSON Schema validation.
* **Database:** Store references as a JSON string within SQLite (No new tables, just new columns).
* **UI:** Links must be accessible via interaction (click/hover) in the Sigma Explorer.

---

## 1. Schema Architecture

We will move from a flat text definition to a structured object that includes `external_refs`.

**File:** `schemas/conceptual-lexicon.schema.json`

**Change Specification:**
Add the `external_refs` property to the `lexiconEntry` definition:

```json
"external_refs": {
  "description": "A list of external grounding resources (URLs, Citations, Code).",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "label": {
        "description": "Human-readable link text (e.g., 'Wikipedia', 'Source Code').",
        "type": "string"
      },
      "url": {
        "description": "The fully qualified URI.",
        "type": "string",
        "format": "uri"
      },
      "type": {
        "description": "The nature of the reference.",
        "type": "string",
        "enum": ["source", "citation", "implementation", "example"]
      }
    },
    "required": ["label", "url", "type"]
  }
}
````

-----

## 2\. Ingestor Logic (ETL)

**File:** `scripts/build_db.ts`

**Step A: Database Migration**
Update the `CREATE TABLE` statement for `nodes` to include a new column.

  * **Old:** `id TEXT PRIMARY KEY, label TEXT, type TEXT, definition TEXT`
  * **New:** `id TEXT PRIMARY KEY, label TEXT, type TEXT, definition TEXT, external_refs TEXT`

**Step B: Processing Logic**

1.  Read the new `external_refs` array from the source JSON.
2.  Serialize the array using `JSON.stringify()`.
3.  Update the `INSERT` statement to bind this JSON string to the new column.
      * *Fallback:* If no refs exist, store an empty array `[]` or `null`.

-----

## 3\. UI Implementation (Sigma Explorer)

**File:** `public/sigma-explorer/js/app.js`

**Objective:** When a node is clicked, show its definition *and* its external links.

**Logic:**

1.  **Retrieve Data:** The `nodes` query in `app.js` must now select `external_refs`.
2.  **Store Attribute:** Add `external_refs` to the Sigma graph node attributes during the loading phase.
3.  **Interaction Handler:**
      * Update `renderer.on("clickNode", ...)`
      * Instead of just logging to console or highlighting, populate a **Details Panel** (DOM element).

**Mockup of Details Panel Logic:**

```javascript
const refs = JSON.parse(attributes.external_refs || "[]");
const linksHtml = refs.map(ref => 
  `<a href="${ref.url}" target="_blank" class="ref-link type-${ref.type}">${ref.label}</a>`
).join("");

document.getElementById("node-details").innerHTML = `
  <h3>${attributes.label}</h3>
  <p>${attributes.definition}</p>
  <div class="refs">${linksHtml}</div>
`;
```

-----

## 4\. Definition of Done

1.  **Schema Validates:** `bun run scripts/build_db.ts` passes with valid JSON data containing URLs.
2.  **DB Verifiable:** Opening `ctx.db` reveals JSON data in the `external_refs` column.
3.  **UI Functional:** Clicking a node in Sigma Explorer displays clickable links that open in a new tab.

<!-- end list -->


