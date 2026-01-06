# System Directives for AI Agents

**Project:** OmniView Photo Planner
**Core Philosophy:** Atmospheric Intelligence, Zero Latency (FAFCAS), High Signal-to-Noise.

## ⚠️ Prime Directives

If you are an AI agent working on this codebase, you must adhere to these rules to prevent regression.

### 1. The FAFCAS Principle (Fast)
*   **Latency is a failure.** The UI must render *immediately*.
*   **Stale-While-Revalidate:** Always show cached data first. Fetch new data in the background.
*   **Zero-Layout-Shift:** Use skeletons that perfectly match the final content dimensions.

### 2. The Signal-to-Noise Rule
*   **Data First:** The user is here for the Tide Height, not our creative writing.
*   **Visual Hierarchy:** Hard data (Numbers, Times) > Analysis (Text) > Decoration.
*   **Density:** Do not add whitespace without purpose. If the user asks for "Control Room" style, remove gaps entirely.

### 3. The Code Ecosystem
Before modifying styles, read these files:
1.  `DESIGN_PLAYBOOK.md` - For aesthetic consistency (Glassmorphism, Colors, Typography).
2.  `CSS-TIPS.md` - For layout physics (Flex/Grid behavior, Stacking Contexts).

### 4. Technical Constraints
*   **No Frameworks:** Use raw React + Tailwind. No framer-motion, no external UI libraries.
*   **Dark Mode Default:** The app is native dark mode. Light mode is a specific scientific variant ("The Laboratory").
*   **Resilience:** The app must work if the API fails. Always have a fallback (e.g., Gemini Search).

## Maintenance Log
*   **Version 1.0:** Established "Atmospheric" aesthetic and direct Open-Meteo integration.
*   **Version 1.1:** Added "Shift+D" Debug Mode for layout diagnostics.
