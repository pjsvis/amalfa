# Brief: Vital Signs — The Data MRI & Iron Dome Defense

**Locus Tag:** `[Locus: Vital_Signs]`
**Related Heuristics:** `OH-041` (Simplicity), `OH-090` (Sieve and Net), `OH-040` (Factored Design), `OH-085` (Markdown Formatting)

## Problem Statement
We operate in an environment of "Information Denial-of-Service." Adversaries (legal opponents or bad actors) and unbridled AI systems can generate massive volumes of unstructured data to overwhelm human analysis.
* **The "Needle in the Haystack" Fallacy:** Traditional search assumes the user knows what the needle looks like.
* **The "Slop" Crisis:** High volumes of low-value, AI-generated, or redundant content ("chaff") obscure the valuable signal ("wheat").
* **Blind Ingestion:** Standard indexing treats every file as equal, wasting compute on garbage.

## Proposed Solution: The "Vital Signs" Protocol
Before deep indexing, the system performs a rapid, high-altitude scan to generate a `vital-signs.json` artifact. This acts as a "Data MRI," providing immediate structural awareness. This artifact powers a **Static-First Dashboard** (Hono/UnPoly) that allows users to assess quality, identify gaps, and filter noise before committing to deep reading.

### Core Capabilities

1.  **The Sieve ("Iron Dome" Defense):**
    * **Redundancy Check:** Identifies near-duplicate clusters (e.g., 500 copies of the same disclaimer).
    * **Entropy/Slop Detection:** Uses text entropy and vocabulary richness metrics to flag likely AI-generated boilerplate.
    * **Action:** Auto-tag these as `[Status: Low_Signal]` to allow instant filtering via AlpineJS.

2.  **The Skeleton (Temporal & Structural):**
    * **Temporal Histogram:** Visualizes document distribution over time to establish the "heartbeat" of the corpus.
    * **Gap Analysis:** Automatically highlights suspicious silences (e.g., "Data Void" in Q3 2023).

3.  **The Map (Community Detection):**
    * Uses the Vector-Graph hybrid to identify semantic communities (e.g., "Finance," "HR," "Patents").
    * **Representative Sampling:** Selects the 3 "Centroid" documents that best explain each community for rapid verification.

4.  **Fractal Scaling (The "Seven Piles" Strategy):**
    * **Recursive Logic:** To handle infinite scale, the system processes sub-folders recursively (Map-Reduce pattern).
    * **Aggregation:** Sub-reports are aggregated into a Master Report.
    * **Cross-Piling:** A lightweight post-processing pass identifies "Boundary Spanner" nodes that link distinct piles.

## Technical Architecture (Static-First)

The implementation adheres to the FAFCAS principle by avoiding client-side framework bloat.

* **Runtime:** **Bun**.
* **Server & Rendering:** **Hono**. Serves pre-rendered JSX/HTML based on the static `vital-signs.json`.
* **Navigation:** **UnPoly**. Handles page transitions and "sidebar-to-detail" navigation by fetching HTML fragments (SPA feel, MPA architecture).
* **Interactivity:** **AlpineJS**. Manages local view state (e.g., "Hide Slop" toggle) without server roundtrips.
* **Visualization:** **Sigma.js**. Implemented as an isolated "Graph Island" within the static layout.

## Success Metrics
* **Time-to-Insight:** < 5 minutes for a 10GB dump to generate the Dashboard artifact.
* **Reduction Ratio:** Ability to confidently classify >40% of a raw dump as "Chaff" without human review.
* **Defensive Reliability:** The system successfully identifies known "traps" (e.g., missing dates, contradictory dates) in a control dataset.

## Artifact Definition: `vital-signs.json`
A single, portable JSON file containing:
1.  `meta`: Corpus stats and processing time.
2.  `coherence`: Density scores and "Slop" ratios.
3.  `temporal`: Distribution data and identified gaps.
4.  `communities`: List of clusters with labels, colors, and representative docs.
5.  `risks`: High-entropy clusters and boundary spanner nodes.

