---
date: 2026-02-01
tags:
  - design
  - ui
  - industrial
  - density
  - css
agent: antigravity
environment: local
---

# Industrial Design Playbook

## Purpose
To define the **Amalfa Industrial Aesthetic**: a set of design principles prioritizing information density, zero waste, and functional minimalism over marketing fluff. This playbook guides the creation of internal tools, dashboards, and developer interfaces.

## Core Philosophy: "The Btop Standard"
Reference: *btop* (System Monitor).
*   **Density is a Virtue:** Use every pixel. If there is a void, fill it with data or expand the content.
*   **Zero Waste:** Padding is for readability, not for luxury. Margins are for separation, not for "breathability".
*   **Monospace First:** Data is code. Use `SF Mono`, `Fira Code`, or `Courier` by default.

## Principles

### 1. The Mosaic Rule (Geometry Matches Data)
*   **Problem:** Tables creates vertical voids when columns have uneven data lengths (e.g., Short Term vs Long Definition).
*   **Solution:** Use **Grids** and **Tiles**.
*   **Pattern:** A Tile wraps its content. A Grid adapts to the screen width.
*   **CSS:** `display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1px;`.

### 2. Browser Affordances
Do not reinvent the wheel.
*   **Zoom:** Do not build zoom controls. The browser has `Cmd +/-`.
*   **Search:** Do not build complex fuzzy search if `Cmd+F` (native find) or a simple Regex filter suffices.
*   **Scroll:** Native scrolling is faster and smoother than virtual scrolling (unless >10k items). A modern browser handles 1,000 DOM nodes effortlessly.

### 3. Hollow vs. Solid
*   **Visual Semantics:** Use visual states to indicate data quality.
*   **Hollow State:** Dimmed, dashed borders, italic text (Missing metadata).
*   **Solid State:** Bright, solid borders, bold text (Verified/Enriched).
*   **Color coding:** Use consistent semantic colors (e.g., Matrix Green for active, Dim Grey for inactive, Orange for warning).

### 4. The "Turducken" Anti-Pattern
*   **Don't:** Stuff empty space with useless charts just to make it look "busy".
*   **Do:** If you have empty space, **Change the Layout** (e.g., switch from List to Grid) or **Show More Context** (Provenance, Source Paths).

## Style Guide (Quick Ref)
*   **Background:** `#000` or `#0d1117`.
*   **Foreground:** `#ccc` (Primary), `#4f6` (Accent/Success), `#555` (Dim).
*   **Font Size:** `10px` - `12px` (High density).
*   **Borders:** `1px solid #333`.
*   **Gap:** `1px` (for Grid separation).

## Implementation Checklist
- [ ] Does the UI enable a "God View" (high density oversight)?
- [ ] Are there large black voids? If yes, Refactor Layout.
- [ ] Am I scrolling too much for too little info? If yes, Increase Density.
- [ ] Is it "Pretty" or is it "Functional"? prioritize Functional.
