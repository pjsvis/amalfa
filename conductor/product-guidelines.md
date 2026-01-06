# Polyvis Product Guidelines

## Content & Communication
- **Prose Style:** Technical and precise. All documentation and user-facing messages must prioritize structural accuracy and objective descriptions.
- **Terminology:** Adhere to established project metaphors (e.g., "Bento Box", "Weaving", "Neuro-Map") only when they provide functional clarity.
- **Feedback Loop:** Error messages should be explicit and technical, providing enough detail (such as specific database codes or pipeline stage failures) to allow Knowledge Engineers to diagnose issues without external documentation.

## Visual Design
- **Priority:** Data-Density over Decor. The user interface must maximize the visible area for the graph and its associated metadata. Minimize UI "chrome" and prioritize the clarity of the knowledge structure.
- **Systemic Integrity:** Use semantic design tokens exclusively. All colors, spacing, and dimensions must be derived from `theme.css`.
- **Interactivity Cues:** High-intensity processes (like graph layout or community detection) must provide clear visual feedback to the user, such as specific loading states for the affected panels.

## User Experience (UX)
- **Workflow Focus:** Design interactions that support deep analysis. Search, filtering, and subgraph isolation should be primary actions accessible with minimal clicks.
- **Contextual Awareness:** The interface should always clearly indicate the current state of the in-browser database and the scope of the displayed graph.
