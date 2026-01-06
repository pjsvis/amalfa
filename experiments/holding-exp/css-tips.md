# CSS Engineering Wisdom

To master UI, do not memorize properties. Understand the physical laws of the browser.

## 1. The CSS Physics: Mental Models

### The Law of the Box
Everything is a box. Even text is a series of inline boxes.
*   **Padding** is fat (internal).
*   **Border** is skin.
*   **Margin** is personal space (external).
*   *Wisdom:* When sizing fails, usually `box-sizing: border-box` is missing (Tailwind adds this by default).

### The Law of the Parent (Flex/Grid)
The parent controls the geometry; the children simply fill it.
*   **Flexbox** is for *Lines* (Rows or Columns). It pushes things in one direction.
*   **Grid** is for *Areas* (2D Surface). It defines a map coordinates system.
*   *Wisdom:* Never try to size a child explicitly (`width: 50%`) if you can simply tell the parent how to treat it (`flex: 1` or `grid-cols-2`).

### The Law of the Stacking Context (Z-Index)
`z-index` is not a global value; it is relative to the "Stacking Context".
*   If a parent has `opacity < 1` or `transform`, it creates a new "layer" (Context).
*   A child inside that layer with `z-index: 9999` will still be *under* a neighbor with `z-index: 10` if the neighbor is in a higher layer.
*   *Wisdom:* Keep your Z-indexes low (1, 2, 3). If you need 9999, your HTML structure is wrong.

## 2. The "Fix It" Protocol (Debugging)

When layout breaks, do not guess. Follow this algorithm.

**1. The "Red Border" Trick**
If a gap implies a ghost element or incorrect size, apply this to the CSS (or add the class `* { outline: 1px solid red }`):
```css
* { outline: 1px solid red !important; opacity: 1 !important; visibility: visible !important; }
```
This reveals the true boundaries of every invisible container.

**2. The Overflow Trap**
*   **Symptom:** The page scrolls horizontally, or a flex child pushes its parent too wide.
*   **Cause:** Flex children generally refuse to shrink below their content size.
*   **Fix:** Add `min-width: 0` (or `min-w-0` in Tailwind) to the flex child. This gives it permission to shrink.

**3. The Height Paradox**
*   **Symptom:** `height: 100%` does nothing.
*   **Cause:** A percentage height requires an explicit height on the parent. If the parent is `auto` (default), 100% of "auto" is undefined.
*   **Fix:** Trace the height all the way up the tree to `html, body { height: 100% }` or use `h-screen` (viewport height).

## 3. The Architecture of Simplicity (Best Practices)

To ensure your code improves over time rather than rotting:

### Composition over Configuration
*   **Bad (Configuration):**
    `<Card title="Hello" showButton={true} buttonText="Click" buttonAction={fn} />`
    *Why:* Every new feature requires a new prop. The component becomes a monster.
*   **Good (Composition):**
    `<Card><Title>Hello</Title><Button onClick={fn}>Click</Button></Card>`
    *Why:* The Card doesn't care what is inside. You can add an Image, a Graph, or a Video without changing the Card code.

### The "Content First" Principle
Do not design empty boxes. Design for the content *at its worst*.
*   What happens if the title is 200 characters?
*   What happens if the image fails to load?
*   What happens if the data is zero?
*   *Wisdom:* Build your UI with "Long Text" and "Missing Data" from day one.

### Tokens over Magic Numbers
Never write `margin: 17px`.
*   Use a scale (4, 8, 16, 24, 32).
*   In Tailwind: `p-4` (1rem), `p-6` (1.5rem).
*   *Wisdom:* Consistency looks like Quality. Even a bad design looks professional if the spacing is mathematically consistent.
