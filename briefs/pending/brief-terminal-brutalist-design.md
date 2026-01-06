Here is the **Terminal-Brutalist Design System** package.

This brief instructs your coding agent to strip out any existing "soft" UI elements (shadows, rounded corners, gradients) and replace them with this high-contrast, machine-readable aesthetic.

### **Part 1: The CSS Variables (`basecoat-css`)**

Have the agent replace your current color root with this block. I have mapped the raw ANSI colors to semantic variables for easier implementation.

```css
:root {
  /* --- THE ANSI PALETTE (Raw) --- */
  --ansi-black:        #0C0C0C;  /* CRT Black */
  --ansi-white:        #CCCCCC;  /* System Grey */
  --ansi-bright-white: #FFFFFF;  /* High Intensity */
  --ansi-red:          #C50F1F;  /* Fatal Error */
  --ansi-green:        #16C60C;  /* Success/Valid */
  --ansi-yellow:       #C19C00;  /* Warning/Process */
  --ansi-orange:       #FF8C00;  /* THE AGENT (Distinct) */

  /* --- SEMANTIC MAPPING (Functional) --- */
  --bg-canvas:         var(--ansi-black);
  --bg-panel:          var(--ansi-black);
  
  --text-primary:      var(--ansi-white);
  --text-highlight:    var(--ansi-bright-white);
  --text-error:        var(--ansi-red);
  --text-agent:        var(--ansi-orange);

  /* --- BORDERS & STRUCTURE --- */
  --border-default:    2px solid var(--ansi-white);
  --border-active:     2px solid var(--ansi-green);
  --border-agent:      2px solid var(--ansi-orange);
  --border-error:      2px solid var(--ansi-red);

  /* --- TYPOGRAPHY --- */
  --font-mono:         'JetBrains Mono', 'Courier New', monospace;
}

```

---

### **Part 2: The Agent Brief**

Copy and paste this into your task manager or agent prompt window.

---

# Agent Task: Implement "Terminal-Brutalist" UI Overhaul

**Context:**
We are pivotting the **PolyVis** UI ("The Visor") to a "Terminal-Brutalist" aesthetic. The goal is to maximize data legibility and reflect the "bare metal" nature of the architecture. The UI should look like a high-performance cockpit, not a consumer SaaS web page.

**Directives:**

1. **Apply the New Palette:**
* Replace existing CSS variables with the **ANSI Palette** provided above.
* Ensure the background is always `#0C0C0C` (CRT Black), never pure white.


2. **Enforce "Hard" Geometry (Global Reset):**
* **Border Radius:** Set to `0px` globally. No rounded corners on buttons, modals, or inputs.
* **Borders:** All structural elements (panels, sidebars) must have a `2px solid` border. Thin `1px` hairlines are forbidden; they look too delicate.


3. **Typography:**
* Force `font-family: var(--font-mono)` on **everything**, including headers (`h1`-`h6`) and buttons.
* Data is code; UI is code.


4. **Interaction States (The Inversion Rule):**
* **Buttons:** Default is Black BG / White Border / White Text.
* **Hover:** Immediate swap. White BG / Black Text. No transitions or easing. `transition: none;`.


5. **Agent Visibility:**
* Any UI element representing an **MCP Agent** action (e.g., the "Ingesting..." spinner, the AutoTagger log) must use **Safety Orange** (`#FF8C00`).
* This distinguishes "Machine" actions from "Human" actions (White/Green).



**Example Output:**
A button should look like this:

```css
.btn-primary {
  background: var(--bg-canvas);
  color: var(--text-primary);
  border: var(--border-default);
  font-family: var(--font-mono);
  text-transform: uppercase;
  font-weight: bold;
  border-radius: 0; /* Crucial */
}

.btn-primary:hover {
  background: var(--ansi-white);
  color: var(--ansi-black);
  cursor: crosshair; /* Optional stylistic choice */
}

```

**Execute these changes across `basecoat-css` and the main `style.css` file immediately.**

---

### **Next Step**

Once the agent applies this, your UI will look stark, aggressive, and incredibly fast. Do you want to discuss how to visualize the **"Hollow Node"** data (metadata vs content) using this new color scheme? (e.g. Hollow nodes = Outline only; Full nodes = Filled block).