# Debrief: Semantic Harvester Implementation

**Date:** 2025-12-10
**Topic:** Implementation of the Semantic Harvester (Discovery Engine)
**Participants:** @antigravity, @user

## 1. Context
The goal was to operationalize the "Air-Lock" workflow for emerging concepts. Instead of forcing users to define everything upfront, they can use `tag-[concept]` tokens as scaffolding. The Harvester then collects these, clusters them, and allows for interactive promotion into the formal Knowledge Graph.

## 2. Actions
- **Developed `Harvester.ts`:** A class to scan for `tag-` patterns, filter out known terms (checking the Lexicon), and sort them by frequency.
- **Created CLI Scripts:**
    - `harvest.ts`: Scans codebase (including briefs!) and generates `_staging.md`.
    - `promote.ts`: Interactive tool to approve terms. It adds them to the Lexicon JSON and **strips the prefix** from source files (`tag-foo` -> `foo`).
- **Verified Logic:** 
    - Verified scanning on a test file.
    - Verified regex logic for "Tag Stripping" via unit tests.
    - Confirmed `_staging.md` generation.

## 3. Outcomes
- **Discovery Loop:** The system can now "listen" to the agents/users. New concepts accumulate in Staging until they are critical mass (frequency > 1), prompting formal definition.
- **Self-Cleaning:** The promotion process automatically converts the scaffolding tags into permanent text/links, keeping the markdown clean.

## 4. Key Learnings
- **Directory Scope:** Initial scan missed the test file because `briefs` wasn't in `resonance.settings.json`. Added it.
- **Interactive Scripts:** Testing interactive CLI scripts (like `promote.ts`) with piped input in a headless environment is brittle. Unit testing the critical logic (regex replacement) is a more robust verification method.

## 5. Artifacts
- Script: `scripts/Harvester.ts`
- Script: `scripts/harvest.ts`
- Script: `scripts/promote.ts`
- Tests: `tests/harvester.test.ts`
- Brief: `briefs/3-brief-resonance-harvester.md`
