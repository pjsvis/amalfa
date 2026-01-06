# Brief: Resonance Substrate Consolidation

## 1. Objective
To restructure the project root by consolidating all intelligence-gathering folders into a single parent directory named `/resonance`. This ensures that the Polyvis engine remains a "Plug-and-Play" tool where the `/resonance` folder acts as a swappable "Intelligence Drive" for different document sets.

## 2. Structural Transformation
The root directory will be "inverted" to separate the Application Source from the Data Substrate.

| Current Root Folder | New Consolidated Path | Role |
| :--- | :--- | :--- |
| `/briefs` | `/resonance/briefs` | Intent & Planning |
| `/debriefs` | `/resonance/debriefs` | Reality & Execution |
| `/playbooks` | `/resonance/playbooks` | Protocols & Methodology |
| `/docs` | `/resonance/docs` | Standard Reference |
| `/inference` | `/resonance/inference` | Machine-Generated Insights |
| `resonance.db` | `/resonance/resonance.db` | The Knowledge Graph State |

## 3. Implementation Plan: `resonance-tidy.ts`
A consolidation script will be developed to automate this migration without breaking existing logic.

* **Step 1: Settings Update**: The script will read `polyvis.settings.json` and update all relative paths to point inside the new `/resonance` parent.
* **Step 2: Physical Migration**: Move the existing directories into the new substrate container.
* **Step 3: Verification**: Ensure the `Ingestion Pipeline` and `Resonance MCP Server` correctly identify the new paths.

## 4. Operational Benefits
* **Context Isolation**: Facilitates managing multiple "Cases" or "Repos" by simply swapping the `/resonance` folder.
* **Git Efficiency**: Simplifies `.gitignore` management by targeting the high-churn `/resonance` folder for database and inference exclusion.
* **Clean Lab**: Keeps `/src` and `/scripts` dedicated to engine development, making it easier for contributors to navigate the codebase without wading through document archives.

## 5. The "Two-Level" Rule Maintenance
By nesting these folders, we preserve the **Two-Level Rule** (Collection → Item) while effectively adding a high-level namespace. The graph remains a "Flat" Bucket structure (e.g., `collection:debriefs`), while the file system remains tidy.