# Brief: Unified Terminal Dashboard (CIC)

**Date**: 2026-02-04
**Target**: Phase 7 - Dynamic Discovery / Monitoring Dashboard
**Status**: DRAFT

## 1. Overview
The current Amalfa ecosystem has a functional but visually lagging Dashboard (:3013) and a high-fidelity but static Terminal Layout Engine (:8888). This proposal aims to unify them into a single **"Combat Information Center" (CIC)** that provides real-time observability into harvesting costs, graph health, and pipeline status.

## 2. Core Objectives
- **Unification**: Replace the existing Pico.css/Alpine.js dashboard with a Datastar-powered Terminal Layout.
- **Observability**: Live monitoring of LangExtract spend and Harvester progress.
- **Interaction**: Enable command-driven system management within the UI.
- **Graph Insight**: Visual representation of Pipeline C semantic coverage.

## 3. Technical Implementation
- **Framework**: Datastar (SSE-driven updates from Bun/Hono).
- **Layout**: Character-based grid (`ch` units) with explicit collision detection.
- **Data Source**: Existing `DashboardDaemon` APIs (+ new SSE endpoints for live telemetry).
- **Control**: Port `api/services` control logic to a terminal-input component.

## 4. Key Components (RHS Blocks)
1. **[TELEMETRY]**: Live harvest counters (files, errors, tokens, USD).
2. **[GRAPH]**: Node/Edge counts, Pipeline C coverage ratio, vector status.
3. **[SERVICES]**: Current PID state and control prompts.
4. **[SYSTEM]**: Logs, system stats (CPU/MEM), and version info.

## 5. Success Metrics
- Real-time spend visibility during `amalfa harvest`.
- Zero client-side JS logic for UI updates (pure Datastar).
- Unified look-and-feel matching the "Expanse-Terminal" aesthetic.
