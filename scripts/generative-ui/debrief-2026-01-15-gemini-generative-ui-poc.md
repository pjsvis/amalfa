---
date: 2026-01-15
tags: [generative-ui, gemini, proof-of-concept, server-side-rendering, hono, ai-integration]
agent: sisyphus
environment: local
---

## Debrief: Gemini-Powered Server-Side Generative UI Prototype

## Accomplishments

- **Fixed API Key Format Issue:** Identified and resolved trailing backticks in `.env` file that caused Gemini API authentication failures. Verified key format through direct curl testing.

- **Corrected Gemini Model Selection:** Discovered that `gemini-1.5-flash` was unavailable on v1beta API. Tested available models via API and selected `gemini-2.5-flash` which successfully generated UI definitions.

- **Simplified Schema Validation Strategy:** Initially attempted to define full nested Gemini schema validation but encountered issues with empty OBJECT properties. Pivoted to removing `responseSchema` from Gemini config and relying on post-generation Zod validation instead. This proved more reliable and maintainable.

- **Updated System Prompt with Strict Constraints:** Enhanced system prompt to explicitly specify valid enum values for button variants (`default`, `primary`, `destructive`, `ghost`, `outline`) and HTTP methods, preventing Gemini from hallucinating invalid values like "secondary".

- **Validated End-to-End Flow:** Successfully generated complete dashboard UI from natural language prompt "Show me a simple dashboard", producing:
  - 3-column stat cards (Total Sales, New Customers, Avg Order Value) with trend indicators
  - DataGrid with 4 rows of transaction data
  - ActionPanel with 3 buttons (View Orders, Export Report, Update Settings)
  - All components rendered correctly via Hono JSX

- **Proved Components Work:** Verified `/test` route renders all component types (StatCard, DataGrid, ActionPanel, MarkdownViewer) with proper Tailwind styling and structure.

## Problems

- **Gemini Schema Validation Too Strict:** Gemini's `responseSchema` parameter requires explicit properties for all nested OBJECT types, making it impractical for discriminated union component schemas where different types have different props. Attempting to define a union of all possible props led to validation errors.
  - **Resolution:** Removed `responseSchema` from Gemini config and relied solely on Zod validation after JSON parsing. This trades compile-time guarantees for runtime flexibility but proved more practical for complex nested schemas.

- **Model Version Confusion:** Initial model name `gemini-1.5-flash` returned 404 errors. The API naming scheme changed between versions.
  - **Resolution:** Used direct API call (`/v1beta/models?key=...`) to list available models, discovered `gemini-2.5-flash` was the correct identifier.

- **503 Service Overload Errors:** Gemini API occasionally returns 503 (Service Unavailable) due to load.
  - **Resolution:** Implemented fallback error UI in catch block. Future enhancement would add retry logic with exponential backoff.

- **Variant Enum Mismatch:** Initial system prompt didn't explicitly constrain button variants, causing Gemini to generate "secondary" which wasn't in our Zod schema.
  - **Resolution:** Updated system prompt with explicit list: "For 'variant', use ONLY: 'default', 'primary', 'destructive', 'ghost', or 'outline'". Added "CRITICAL" emphasis to ensure compliance.

## Lessons Learned

- **Validate API Keys Early:** When integrating external APIs, test authentication with minimal curl requests before building complex integrations. This saved hours of debugging schema issues when the root cause was key format.

- **Model Availability is Not Documentation:** Official SDK examples may reference models that aren't available on all API versions. Always verify available models through the API's list endpoint rather than trusting documentation or examples.

- **Schema Validation Trade-offs:** Gemini's strict schema validation is powerful but brittle for complex nested structures. For prototype/POC work, runtime validation (Zod) after generation is more flexible and easier to iterate on. Production systems might want stricter compile-time guarantees.

- **LLM Prompt Engineering for Enums:** When using discriminated unions or enums, explicitly list ALL valid values in the system prompt with emphasis markers like "ONLY" or "CRITICAL". LLMs will hallucinate plausible but invalid values (e.g., "secondary" for button variants) if not constrained.

- **Server-Side JSX is Production-Ready:** Hono's JSX implementation works flawlessly for server-side rendering. No hydration mismatches, no client-side JavaScript required. Components render as pure HTML with Tailwind classes, making it ideal for AI-generated UIs where security and simplicity matter.

- **Disposable Database Philosophy Applies to Prompts:** The ability to regenerate UI from prompts means the rendered HTML is disposable. The prompt is the source of truth. This mirrors Amalfa's "database as cache" philosophy—the UI is just a materialized view of the generative intent.

## Technical Artifacts

**Working Configuration:**
- Model: `gemini-2.5-flash`
- Validation: Zod post-generation (no Gemini responseSchema)
- Components: StatCard, DataGrid, ActionPanel, MarkdownViewer
- Transport: Manual EventSource SSE
- Server: Hono on Bun

**Key Files:**
- `scripts/generative-ui/ai.ts` - Gemini integration
- `scripts/generative-ui/server.tsx` - Hono server with routes
- `scripts/generative-ui/components.tsx` - React-like component library
- `scripts/generative-ui/.env` - API key configuration

**Test Commands:**
```bash
# Start server
cd /Users/petersmith/Documents/GitHub/amalfa/scripts/generative-ui
bun server.tsx

# Test component rendering
curl http://localhost:3000/test

# Test AI generation
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Show me a dashboard"}'
```

## Next Steps

1. **Integrate AI into Main Route:** Replace mock data in `/api/reify` with live AI generation
2. **Add User Input Form:** Let users enter prompts in browser instead of curl
3. **Implement Loading States:** Show "Generating..." spinner while waiting for Gemini
4. **Add Retry Logic:** Handle 503 errors with exponential backoff
5. **Explore Use Cases:** Discuss potential applications beyond dashboards (see next session)

## Verification Proof

Server running at `http://localhost:3000`:
- ✅ `/test` route renders full dashboard with all component types
- ✅ `/api/generate` endpoint returns valid ScreenDef JSON
- ✅ Gemini generates 3-section dashboard (stats, data, actions) from single prompt
- ✅ Zod validation passes for generated structures
- ✅ No TypeScript errors, clean build

**Generated Dashboard Example:** "Overview Dashboard" with Total Sales ($12,450 ↑12.5%), New Customers (245 ↑5.2%), Avg Order Value ($55.20 ↓1.8%), Recent Orders table with 4 transactions, and Quick Actions panel with 3 buttons.

---

**Status:** Prototype complete and validated. Core generative UI proof-of-concept works end-to-end from natural language → Gemini → JSON → Hono JSX → HTML → Browser.
