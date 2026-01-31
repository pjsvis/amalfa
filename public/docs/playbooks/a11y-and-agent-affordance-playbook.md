# Accessibility (A11y) & Agent Affordance Playbook

**Status:** Active
**Context:** PolyVis UI Architecture
**Principle:** "If an Agent can't read it, it doesn't exist."

## The Core Philosophy: The Blind Agent
Coding Agents (like the one building this project) do not "see" pixels; they read the DOM.
* **Visuals** are for Humans.
* **Semantics** are for Agents (and Screen Readers).

We treat **Accessibility** not as a compliance burden, but as the **Native API** for our own automation.

---

## 1. The "Mystery Meat" Ban (Labelling)
**Problem:** An icon-only button (`<button><icon/></button>`) is invisible to an agent scanning for "Menu" or "Close".
**Rule:** Every interactive element must have a text label.
* **Visible Text:** Preferred.
* **Invisible Text:** `aria-label` is mandatory if no visible text exists.

```html
<button class="icon-btn">
  <i data-lucide="menu"></i>
</button>

<button class="icon-btn" aria-label="Toggle Sidebar">
  <i data-lucide="menu"></i>
</button>