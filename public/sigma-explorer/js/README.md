# PolyVis Lexicon Service: Compliance & Usage

**Component:** Client-Side SQLite Wrapper
**Architecture:** Static WASM (Serverless)
**Protocol:** Weaponised Happy Path [OH-075]

## 1. Objective
To provide a decoupled "Service Layer" that manages the `ctx.db` SQLite connection, isolating the data logic (SQL) from the view logic (Alpine.js).

## 2. Dependencies
* **sql.js (v1.8.0+)**: Must be loaded in the global scope before `LexiconService.init()` is called.
* **ctx.db**: The binary SQLite file must exist at the root `/public/ctx.db`.

## 3. The Contract (API)
The `window.LexiconService` object exposes exactly two public methods. Do not access `LexiconService.db` directly from the UI.

### `async init()`
* **Input:** None.
* **Output:** `Promise<boolean>` (True if success, False if failed).
* **Usage:** Must be called in the Alpine `init()` lifecycle hook.

### `search(query)`
* **Input:** `string` (The user input).
* **Output:** `Array<Object>` (Clean JSON objects).
* **Behavior:**
    * Empty string returns full list (or default set).
    * Wildcard matching (`%query%`) applies to both `name` and `definition` columns.
    * Returns empty array `[]` if no matches or DB error.

## 4. Implementation Checklist (Compliance)
* [ ] **Factored Design:** Does the code separate SQL logic from DOM manipulation?
* [ ] **Transformation:** Does the service handle the conversion of `sql.js` raw arrays into usable Objects?
* [ ] **Error Handling:** Does `init()` catch network errors (e.g., 404 on `ctx.db`) without crashing the app?
* [ ] **Parameter Binding:** Are queries using binding parameters (`$term`) to prevent injection/formatting errors?

## 5. Usage Example (Alpine.js)
```html
<script src="/js/lexicon-service.js"></script>

<div x-data="{ 
    ready: false, 
    results: [], 
    async init() { 
        this.ready = await LexiconService.init(); 
        this.results = LexiconService.search(''); 
    } 
}">
    <template x-if="ready">
        </template>
</div>