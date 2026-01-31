---
date: 2026-01-31
tags: [frontend, polyvis, dashboard, tts, docs]
agent: antigravity
status: active
---

# Implementation Plan: PolyVis Dashboard Migration

## 🎯 Context
We have a functional backend (`DashboardDaemon`) and a "Terminal Brutalist" design system (PolyVis) waiting in `_temp-files/`. We also have verified "Ghost Signature" resilience in the backend and "Text-to-Speech" capability for the frontend.

## 🚀 Objectives
1.  **Migrate UI**: Replace the temporary MVP frontend with the refined **PolyVis** assets.
2.  **Unified Documentation**: Integrate a **Docs Browser** that allows navigating `docs/architecture/*.md` and rendering the Architecture SVGs.
3.  **Voice Interface**: Implement **System Voice (Moira)** for status announcements (Ingestion Complete, Errors).
4.  **Graph Visualization**: Ensure the Sigma.js graph explorer is correctly served.

## 🛠️ Components & Implementation

### 1. Frontend Migration
*   **Source**: `_temp-files/client-side/public`
*   **Target**: `src/dashboard/public` (Clean & Replace)
*   **Action**: 
    1.  Backup existing `public/` to `public_old/`.
    2.  Copy new assets.
    3.  Update `DashboardDaemon` routes to match PolyVis structure (`index.html`, `docs.html`, `graph.html`, `assets/`).

### 2. Documentation Browser
*   **Goal**: View Markdown files (`docs/`, `briefs/`) in the browser.
*   **Logic**:
    *   **Backend**: `DashboardDaemon` serves raw markdown via `/api/docs/[path]`.
    *   **Frontend**: `docs.html` fetches MD, renders using `marked` or similar (likely already in PolyVis), and handles `![Diagram](...)` images for the architecture.
    *   **TypeScript Support**: Add basic syntax highlighting for `.ts` files if browsing code.

### 3. Text-to-Speech (TTS)
*   **Service**: `Web Speech API` (Client-Side).
*   **Persona**: **Moira** (`en-IE`) > `en-IE` > `en-GB`.
*   **Usage**:
    *   **Auto-Announce**: "System ready.", "Ingestion complete: 5 files."
    *   **Controls**: Mute toggle in the Navbar.

### 4. Graph Explorer
*   **Asset**: `graph.html` (Sigma.js).
*   **Data**: `public/resonance.db` (served via API or file).
*   **Constraint**: Ensure the graph visualizer can read the `bun:sqlite` or exported JSON format.

## 📝 User Requirements (pjsvis)
*   "Dashboard UI should be a service that runs in the background" (Done: `DashboardDaemon`).
*   "Show graph database using graphology and sigma.js" (Included in PolyVis).
*   "Browse and read rendered markdown documents" (Docs Browser).
*   "Summary page with metrics" (Home Page).
*   "Serve typescript documents" (Add viewer support).
*   "Formalise stats persistence" (Log runs to `.amalfa/runs.jsonl`).

## ✅ Definition of Done
*   [ ] Dashboard looks like PolyVis (Premium/Terminal).
*   [ ] `/docs` allows browsing Architecture & Briefs.
*   [ ] Architecture Diagrams (SVG) render correctly.
*   [ ] TTS announces "Welcome" on load (with Irish accent).
*   [ ] Graph Explorer renders the ResonanceDB nodes.
