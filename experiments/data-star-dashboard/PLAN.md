# Data Star Reactor Experiment Plan

**Context**: We are building a "Hollow Node" dashboard where the specific UI state is driven entirely by the server using `bun` and `datastar`.

**Goal**: Verify that we can drive a high-frequency (10Hz) dashboard with zero client-side logic using Server-Sent Events (SSE).

## 1. Environment Setup
- [x] Initialize Bun project in `experiments/data-star-dashboard`.
- [x] Install `@gavriguy/datastar-sdk`.
- [x] Create `tsconfig.json` for proper TypeScript support.

## 2. Frontend Implementation (`index.html`)
- [x] Create `index.html`.
- [x] **Architecture**: Implement the "Slab & Grid" layout (Header, Grid, Footer).
- [x] **Library**: Import Datastar from CDN (`https://cdn.jsdelivr.net/gh/starfederation/datastar/bundles/datastar.js`).
- [x] **Signal Definitions**: Add `data-signals` to the root container:
    - `ingest_rpm`: 0
    - `memory_usage`: 0
    - `agent_status`: "INIT"
    - `visual_width`: "0%"
- [x] **Bindings**:
    - Bind `data-text="$ingest_rpm"` to a metric card.
    - Bind `data-text="$memory_usage"` to a metric card.
    - Bind `data-text="$agent_status"` to a status display.
    - Bind `data-bind-style-width="$visual_width"` to the "CSS Graph" bar.
- [x] **Connection**: Add `data-on-load="@get('/feed')"` to the body to initiate the SSE stream.

## 3. Backend Implementation (`reactor.ts`)
- [ ] Create `reactor.ts`.
- [ ] **Server**: Setup `Bun.serve({ port: 3000 })`.
- [ ] **Static Route**: Serve `index.html` on `/`.
- [ ] **SSE Route**: Serve the stream on `/feed`.
- [ ] **The "Core" Loop**:
    - Set up a `setInterval` (e.g., 100ms).
    - Generate random simulation data.
    - Use `ServerSentEventGenerator` to send `datastar-merge-signals` events.
    - Include logic to close the interval on client disconnect.

## 4. Execution & Verification
- [ ] Run `bun run reactor.ts`.
- [ ] Open `http://localhost:3000`.
- [ ] **Verify**:
    - Dashboard loads with the correct layout.
    - Numbers update rapidly without page reload.
    - The "CSS Graph" bar animates smoothly.
    - No client-side JS other than the Datastar library is running.
