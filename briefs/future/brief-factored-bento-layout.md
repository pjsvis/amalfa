### Technical Brief: The "Factored Bento" Generative UI

**Version:** 1.0 | **Type:** Architectural Specification
**Constraint:** No-Framework / Server-Side Rendering (SSR) / CSS Grid

This brief documents the "Status-to-Settings" layout pattern as a reproducible "Thing". It decouples the **Structure** (JSON Schema) from the **Presentation** (CSS) and the **Assembly** (SSR Template Literals), ensuring the layout is deterministic and lightweight.

---

### 1. The Schema (The "Thing" Definition)

To enable generative creation, we define the dashboard as a flat array of "Cards," each possessing explicit grid coordinates or span dimensions. This allows the backend to dictate the visual hierarchy.

**Principle:** Explicit Formulation. We do not rely on the browser to "guess" the layout; we define it.

```json
{
  "meta": {
    "layout_engine": "css-grid-v1",
    "theme": "ee-hub-minimal",
    "columns": 4
  },
  "zones": [
    {
      "id": "status-zone",
      "cards": [
        {
          "id": "card-01",
          "type": "monitor",
          "title": "Hub Status",
          "state": "good",
          "dims": { "w": 2, "h": 2 },
          "data": { "status": "Working", "icon": "check-circle" }
        },
        {
          "id": "card-02",
          "type": "monitor",
          "title": "Wireless",
          "state": "info",
          "dims": { "w": 2, "h": 1 },
          "data": { "ssid": "Home_WiFi_5G", "devices": 12 }
        }
      ]
    },
    {
      "id": "action-zone",
      "cards": [
         {
          "id": "card-03",
          "type": "utility",
          "title": "Guest WiFi",
          "state": "warning",
          "dims": { "w": 1, "h": 2 },
          "data": { "active": false }
        },
        {
          "id": "card-04",
          "type": "control",
          "title": "Restart",
          "dims": { "w": 1, "h": 1 },
          "data": { "action": "POST /restart" }
        },
        {
          "id": "card-05",
          "type": "control",
          "title": "Light Control",
          "dims": { "w": 1, "h": 1 },
          "data": { "action": "POST /lights" }
        },
        {
          "id": "card-06",
          "type": "anchor",
          "title": "Advanced Settings",
          "dims": { "w": 1, "h": 1 },
          "data": { "link": "/settings/advanced" }
        }
      ]
    }
  ]
}

```

---

### 2. The Visual Substrate (CSS Only)

We use modern CSS Grid to handle the "Tessellation." We avoid JavaScript for layout calculations. The complexity is offloaded to the CSS engine.

**Key Heuristic:** Deductive Minimalism. Subtract framework overhead; add native browser capability.

```css
/* The Grid Container */
.bento-dashboard {
  display: grid;
  /* The core 4-column constraint */
  grid-template-columns: repeat(4, 1fr);
  /* Auto-row height based on content, with a minimum */
  grid-auto-rows: minmax(140px, auto);
  gap: 1.5rem;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #f4f6f8;
}

/* Card Primitives */
.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid #e1e4e8;
  transition: transform 0.2s ease;
}

/* Semantic State Colors */
.card[data-state="good"] { border-top: 4px solid #007d75; } /* Teal */
.card[data-state="info"] { border-top: 4px solid #005c8f; } /* Blue */
.card[data-state="warning"] { border-top: 4px solid #ff7900; } /* Orange */

/* Generative Sizing Classes (Mapped from JSON 'dims') */
.w-1 { grid-column: span 1; }
.w-2 { grid-column: span 2; }
.w-3 { grid-column: span 3; }
.w-4 { grid-column: span 4; }

.h-1 { grid-row: span 1; }
.h-2 { grid-row: span 2; }

/* Responsive Factorization: Collapse to 2 columns on tablet, 1 on mobile */
@media (max-width: 900px) {
  .bento-dashboard { grid-template-columns: repeat(2, 1fr); }
  /* Reset large spans to fit new grid */
  .w-3, .w-4 { grid-column: span 2; } 
}
@media (max-width: 600px) {
  .bento-dashboard { grid-template-columns: 1fr; }
  .w-1, .w-2, .w-3, .w-4 { grid-column: span 1; }
}

```

---

### 3. The Assembler (SSR-JSX / Template Literals)

Since we are "No-Framework," we use a pure function to interpolate the JSON into HTML strings. This represents the **SSR (Server-Side Rendering)** layer. This code runs on the server and ships only HTML to the client.

```javascript
// The "Engine" - Pure Functional Transformation
// Input: JSON Schema -> Output: HTML String

const renderCard = (card) => {
  // Map dimensions to CSS utility classes
  const widthClass = `w-${card.dims.w}`;
  const heightClass = `h-${card.dims.h}`;
  const stateAttr = card.state ? `data-state="${card.state}"` : '';

  return `
    <article class="card ${widthClass} ${heightClass}" ${stateAttr} id="${card.id}">
      <header class="card-header">
        <h3 class="text-sm font-bold uppercase tracking-wider text-gray-500">${card.title}</h3>
      </header>
      <div class="card-body mt-4">
        ${renderContent(card)}
      </div>
    </article>
  `;
};

const renderContent = (card) => {
  // Simple switch to handle different content types
  if (card.type === 'monitor') {
    return `<div class="text-3xl font-light text-slate-800">${card.data.status || card.data.ssid}</div>`;
  }
  if (card.type === 'control') {
    return `<button class="btn-action">${card.data.action.split(' ')[0]}</button>`; // Mock action
  }
  if (card.type === 'anchor') {
     return `<span class="arrow-icon">→</span>`;
  }
  return `<div class="text-gray-400">...</div>`;
};

// Main Layout Assembler
const renderDashboard = (schema) => {
  // Flatten zones for grid placement (or keep zones if using sub-grids)
  const allCards = schema.zones.flatMap(zone => zone.cards);
  
  return `
    <section class="bento-dashboard">
      ${allCards.map(card => renderCard(card)).join('')}
    </section>
  `;
};

// --- USAGE ---
// const htmlOutput = renderDashboard(jsonData);
// response.send(htmlOutput);

```

### Summary of Benefits

1. **Low Entropy:** The complexity is contained entirely within the CSS grid definition. The HTML is flat and semantic.
2. **Reproducibility:** By storing the JSON blobs, you can perfectly recreate any historic state of the dashboard.
3. **Performance:** Zero client-side JavaScript is required for the layout to function. It renders instantly (First Contentful Paint = First Meaningful Paint).

Does this specification meet your threshold for "Complete and Reproducible"?