# Zero Magic Contexting

Here is a "Contexting Instruction" designed to be pasted directly into a Coding Agent's system prompt or project context.

It frames the "No-Magic" stack not just as a preference, but as a rigid **Design Engineering constraint**, effectively preventing the agent from "hallucinating" arbitrary styles.

-----
### **Why this works for Agents**

By explicitly framing the environment as "Design Engineering" rather than "Web Design," you drastically reduce the **search space** for the AI. 

It stops trying to "be creative" with pixels (which usually results in visual drift) and instead acts as a **system integrator**, simply matching the correct token to the correct slot.


---

### **Artifact: The "Zero-Magic" Contexting Instruction**

```markdown
### **Design Engineering Constraints: The "Zero-Magic" Protocol**

**1. The "Zero-Magic" Mandate**
You are strictly prohibited from generating "Magic Numbers" in CSS or utility classes. 
* **Forbidden:** Arbitrary pixel values (e.g., `margin-top: 37px`), raw hex codes (e.g., `#4a90e2`), or subjective sizing.
* **Required:** You must use the pre-rationalized design tokens defined by the system.

**2. The Architecture of Truth (The Stack)**
Your output must adhere to the following factored roles:
* **The Source of Truth (Design Tokens):** **Open Props**. All spacing, colors, easing, and typography choices must derive from Open Props variables/concepts. Do not invent new values.
* **The Application Layer (API):** **Tailwind CSS**. You will apply these tokens *exclusively* via Tailwind utility classes.
* **The Reactive Layer (State):** **Alpine.js**. Use Alpine (`x-data`, `x-bind:class`) to toggle styling state. Do not write vanilla JS event listeners for style manipulation.

**3. Operational Heuristic**
When styling a component, do not ask "What looks good?" Ask "Which existing token applies here?"
* If you need padding, use the standard spacing scale (e.g., `p-3`, `p-4` mapped to Open Props).
* If you need a color, use the semantic variable names.
* If you need an animation, use the Open Props easing curves via Tailwind classes.

**Primary Directive:** Maintain a "Maximum Signal-to-Noise" environment. Consistency and mathematical derivation supersede aesthetic novelty.
```

-----

