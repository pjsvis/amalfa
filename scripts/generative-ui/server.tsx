/** @jsxImportSource hono/jsx */
/**
 * server.tsx
 * The "Pump": Hono Server + DataStar SSE Integration
 */
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { streamSSE } from 'hono/streaming';
import { ScreenRenderer } from './components';
import type { ScreenDef } from './layout-engine';
import { generateScreen } from './ai';

const app = new Hono();

// 1. Test route - direct render (no SSE)
app.get('/test', (c) => {
  const html = (<ScreenRenderer screen={MOCK_GENERATED_UI} />).toString();
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>REIFY - Direct Render Test</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  ${html}
</body>
</html>`);
});

// 2. Root HTML page (with DataStar SSE)
app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>REIFY - Generative UI Demo</title>
  <script type="module" defer src="https://cdn.jsdelivr.net/npm/@sudodevnull/datastar"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    // Manual SSE connection as fallback
    window.addEventListener('DOMContentLoaded', () => {
      const es = new EventSource('/api/reify');
      es.addEventListener('datastar-merge-fragments', (e) => {
        const data = e.data;
        if (data.startsWith('fragments ')) {
          const html = data.substring('fragments '.length);
          document.getElementById('reify-container').innerHTML = html;
        }
      });
      es.onerror = (err) => {
        console.error('SSE Error:', err);
        es.close();
      };
    });
  </script>
</head>
<body class="bg-gray-50">
  <div 
    id="reify-container" 
    class="min-h-screen"
  >
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600">Loading generative UI...</p>
      </div>
    </div>
  </div>
</body>
</html>`);
});

// 2. The Mock "Brain" (This is where Gemini would be called)
// For the POC, we return a hardcoded "Complex" UI to prove the renderer works.
const MOCK_GENERATED_UI: ScreenDef = {
  screenTitle: "Q3 Sales Analysis",
  sections: [
    {
      id: "summary",
      layout: "grid",
      title: "Key Performance Indicators",
      children: [
        { type: "StatCard", props: { title: "Total Revenue", value: "$1.2M", trend: 12, trendDirection: "up" } },
        { type: "StatCard", props: { title: "Active Users", value: "8,430", trend: 3, trendDirection: "down" } },
        { type: "StatCard", props: { title: "Conversion Rate", value: "4.2%", trend: 0.1, trendDirection: "neutral" } },
      ]
    },
    {
      id: "details",
      layout: "two-column",
      title: "Regional Breakdown",
      children: [
        { 
          type: "DataGrid", 
          props: {
            columns: ["Region", "Sales", "Lead"],
            rows: [
              { "Region": "North America", "Sales": "450k", "Lead": "J. Doe" },
              { "Region": "Europe", "Sales": "320k", "Lead": "A. Smith" },
              { "Region": "Asia-Pac", "Sales": "280k", "Lead": "K. Tanaka" },
            ]
          } 
        },
        {
          type: "ActionPanel",
          props: {
            prompt: "Divergence detected in Asian markets. Would you like to generate a deep-dive report?",
            buttons: [
              { label: "Generate Report", endpoint: "/api/reify/deep-dive", method: "POST", variant: "primary" },
              { label: "Dismiss", endpoint: "/api/reify/dismiss", method: "POST", variant: "ghost" }
            ]
          }
        }
      ]
    }
  ]
};

// 3. The Generator Route
// Client calls this via data-fetch (or on load)
app.get('/api/reify', (c) => {
  return streamSSE(c, async (stream) => {
    // A. Render the Screen Schema to HTML string
    // Note: In Hono/JSX, we can use .toString() on the component tree
    const componentTree = <ScreenRenderer screen={MOCK_GENERATED_UI} />;
    const html = componentTree.toString();

    // B. Send the DataStar SSE Event
    // Event: datastar-merge-fragments
    // Data: fragments <div id="reify-container">...</div>
    
    await stream.writeSSE({
      event: 'datastar-merge-fragments',
      data: `fragments ${html}`,
    });
    
    // Close stream
    await stream.sleep(100); // Tiny buffer
  });
});

// 4. AI Generation Endpoint (The Brain)
app.post('/api/generate', async (c) => {
  try {
    const { prompt } = await c.req.json();
    
    if (!prompt) {
      return c.json({ error: 'Prompt is required' }, 400);
    }

    console.log('🧠 Generating UI for prompt:', prompt);
    const screen = await generateScreen(prompt);
    console.log('✅ Generated screen:', screen.screenTitle);
    
    return c.json(screen);
  } catch (error) {
    console.error('❌ Generation error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// 5. Action Handlers (RPC Reflexes)
app.post('/api/reify/deep-dive', (c) => {
  // Logic: User clicked "Generate Report"
  // Response: Replace the ActionPanel with a "Processing..." message or new content
  return streamSSE(c, async (stream) => {
    await stream.writeSSE({
      event: 'datastar-merge-fragments',
      data: `fragments <div id="reify-container" class="p-4 bg-green-100 text-green-800 rounded">Report generation queued! (ID: 9942)</div>`,
    });
  });
});

export default { 
  port: 3000, 
  fetch: app.fetch 
};