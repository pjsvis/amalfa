import { join } from "node:path";
import { Hono } from "hono";
import { html } from "hono/html";
import { streamSSE } from "hono/streaming";

// State
interface StepState {
	id: string;
	name: string;
	description: string;
	status: "idle" | "running" | "completed" | "error";
	metrics: Record<string, string | number>;
	logs: string[];
}

const STEPS: StepState[] = [
	{
		id: "harvest",
		name: "1. HARVEST",
		description: "Scan corpus for candidates",
		status: "idle",
		metrics: {},
		logs: [],
	},
	{
		id: "refine",
		name: "2. REFINE",
		description: "Filter noise & stopwords",
		status: "idle",
		metrics: {},
		logs: [],
	},
	{
		id: "enrich",
		name: "3. ENRICH",
		description: "Join with LLM Sidecars",
		status: "idle",
		metrics: {},
		logs: [],
	},
	{
		id: "embed",
		name: "4. EMBED",
		description: "Generate Vectors",
		status: "idle",
		metrics: {},
		logs: [],
	},
	{
		id: "edges",
		name: "5. EDGES",
		description: "Structural Survey",
		status: "idle",
		metrics: {},
		logs: [],
	},
	{
		id: "ingest",
		name: "6. INGEST",
		description: "Load ResonanceDB",
		status: "idle",
		metrics: {},
		logs: [],
	},
];

const state = new Map<string, StepState>();
STEPS.forEach((s) => {
	state.set(s.id, s);
});

const app = new Hono();

// Endpoints
app.get("/", (c) => {
	return c.html(html`
<!DOCTYPE html>
<html>
<head>
    <title>Pipeline Monitor</title>
    <meta charset="UTF-8">
    <script src="//unpkg.com/alpinejs" defer></script>
    <style>
        :root { --bg: #050505; --fg: #ccc; --card: #111; --accent: #4f6; --dim: #555; }
        body { background: var(--bg); color: var(--fg); font-family: 'SF Mono', monospace; margin: 0; padding: 20px; font-size: 11px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 10px; }
        .card { background: var(--card); border: 1px solid #222; padding: 10px; display: flex; flex-direction: column; gap: 6px; }
        .card.running { border-color: var(--accent); box-shadow: 0 0 5px rgba(68,255,102,0.2); }
        .card.error { border-color: #f44; }
        .header { display: flex; justify-content: space-between; border-bottom: 1px solid #222; padding-bottom: 4px; }
        .title { font-weight: bold; color: #fff; }
        .status { text-transform: uppercase; font-size: 9px; padding: 1px 4px; border: 1px solid var(--dim); }
        .running .status { background: var(--accent); color: #000; border-color: var(--accent); }
        .logs { height: 60px; overflow-y: auto; background: #000; padding: 4px; color: #888; font-size: 10px; white-space: pre-wrap; margin-top: auto; }
        .metrics { display: flex; flex-wrap: wrap; gap: 8px; color: var(--accent); }
        h1 { margin-top:0; color: #fff; text-transform: uppercase; letter-spacing: 2px; font-size: 14px; }
        button { background: #222; border: 1px solid #444; color: #ccc; cursor: pointer; padding: 4px 8px; font-family: inherit; text-transform: uppercase; font-size: 10px; }
        button:hover { background: #333; color: #fff; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
    </style>
</head>
<body x-data="pipeline()">
    <div style="display:flex; justify-content:space-between; margin-bottom: 20px;">
        <h1>Golden Lexicon Pipeline</h1>
        <div><button @click="runAll()" :disabled="running">RUN ALL SEQUENCE</button></div>
    </div>
    
    <div class="grid">
        <template x-for="s in steps" :key="s.id">
            <div class="card" :class="s.status">
                <div class="header">
                    <span class="title" x-text="s.name"></span>
                    <span class="status" x-text="s.status"></span>
                </div>
                <div style="color:#666" x-text="s.description"></div>
                <div class="metrics">
                    <template x-for="(v, k) in s.metrics">
                        <span><span x-text="k"></span>: <b x-text="v"></b></span>
                    </template>
                </div>
                <div class="logs">
                    <template x-for="log in s.logs.slice(-5)">
                        <div x-text="log"></div>
                    </template>
                    <div x-show="s.status === 'idle'">Ready.</div>
                </div>
                <div style="margin-top:4px; display:flex; justify-content:end">
                    <button @click="run(s.id)" :disabled="s.status === 'running'">RUN</button>
                </div>
            </div>
        </template>
    </div>

    <!-- History Stats -->
    <div style="margin-top: 30px;">
        <h2 style="color: #fff; text-transform:uppercase; font-size: 13px; border-bottom: 1px solid #333; padding-bottom: 5px;">Ingestion History</h2>
        <table style="width:100%; text-align:left; border-collapse:collapse; color:#888;">
            <thead>
                <tr style="border-bottom:1px solid #222;">
                    <th style="padding:4px;">RUN TIME</th>
                    <th>INPUT NODES</th>
                    <th>FINAL NODES</th>
                    <th>EDGES</th>
                    <th>VECTORS</th>
                    <th>STATUS</th>
                </tr>
            </thead>
            <tbody>
                <template x-for="h in history">
                    <tr style="border-bottom:1px solid #111;">
                        <td style="padding:4px; color:#aaa;" x-text="new Date(h.timestamp).toLocaleString()"></td>
                        <td x-text="h.nodes_input"></td>
                        <td x-text="h.nodes_final" style="color:#fff;"></td>
                        <td x-text="h.edges_final"></td>
                        <td x-text="h.vectors_loaded"></td>
                        <td x-text="h.status" :style="{color: h.status==='success'?'#4f6':'#f44'}"></td>
                    </tr>
                </template>
            </tbody>
        </table>
    </div>

    <script>
        function pipeline() {
            return {
                steps: [],
                history: [],
                running: false,
                init() {
                    this.connect();
                    this.fetchHistory();
                },
                connect() {
                    const evt = new EventSource('/events');
                    evt.onmessage = (e) => {
                        const data = JSON.parse(e.data);
                        this.steps = data;
                        this.running = data.some(s => s.status === 'running');
                        // Refresh history on completion
                        if (!this.running && this.steps.some(s => s.status === 'completed')) this.fetchHistory(); 
                    };
                },
                async fetchHistory() {
                    this.history = await (await fetch('/api/history')).json();
                },
                async run(id) {
                    await fetch('/api/run/' + id, {method: 'POST'});
                },
                async runAll() {
                    await fetch('/api/run-all', {method: 'POST'});
                }
            }
        }
    </script>
</body>
</html>
    `);
});

app.get("/events", (c) => {
	return streamSSE(c, async (stream) => {
		while (true) {
			const data = Array.from(state.values());
			await stream.writeSSE({
				data: JSON.stringify(data),
				event: "message",
			});
			await stream.sleep(500);
		}
	});
});

// Receiver API
app.post("/api/step/:id/:action", async (c) => {
	const id = c.req.param("id");
	const action = c.req.param("action");
	const body = await c.req.json();

	const s = state.get(id);
	if (!s) return c.json({ error: "Not found" }, 404);

	if (action === "start") {
		s.status = "running";
		s.logs = [];
		s.metrics = {};
	} else if (action === "update") {
		if (body.metrics) s.metrics = { ...s.metrics, ...body.metrics };
	} else if (action === "log") {
		if (body.message) s.logs.push(body.message);
	} else if (action === "complete") {
		s.status = "completed";
		if (body.metrics) s.metrics = { ...s.metrics, ...body.metrics };
	} else if (action === "error") {
		s.status = "error";
		if (body.error) s.logs.push(`ERR: ${body.error}`);
	}

	return c.json({ ok: true });
});

// Runner
import { spawn } from "bun";

async function runScript(id: string) {
	const s = state.get(id);
	if (!s || s.status === "running") return;

	let scriptPath = "";
	if (id === "harvest") scriptPath = "src/pipeline/lexicon/01-harvest.ts";
	if (id === "refine") scriptPath = "src/pipeline/lexicon/02-refine.ts";
	if (id === "enrich") scriptPath = "src/pipeline/lexicon/03-enrich.ts";
	if (id === "embed") scriptPath = "src/pipeline/lexicon/04-embed.ts";
	if (id === "edges") scriptPath = "src/pipeline/lexicon/05-survey-edges.ts";
	if (id === "ingest") scriptPath = "src/pipeline/lexicon/06-ingest.ts";

	if (!scriptPath) return;

	s.status = "running";
	s.logs.push("Spawning process...");

	const proc = spawn(["bun", "run", scriptPath], {
		stdout: "inherit",
		stderr: "inherit",
	});

	await proc.exited;
	if (proc.exitCode !== 0) {
		s.status = "error";
		s.logs.push(`Process exited with code ${proc.exitCode}`);
	}
}

app.post("/api/run/:id", async (c) => {
	const id = c.req.param("id");
	runScript(id);
	return c.json({ started: true });
});

app.get("/api/history", async (c) => {
	const file = Bun.file(join(process.cwd(), ".amalfa/pipeline-history.jsonl"));
	if (!(await file.exists())) return c.json([]);
	const text = await file.text();
	// Parse JSONL
	try {
		const rows = text
			.trim()
			.split("\n")
			.filter(Boolean)
			.map((line) => JSON.parse(line));
		return c.json(rows.reverse()); // Newest first
	} catch (_e) {
		return c.json([]);
	}
});

app.post("/api/run-all", async (c) => {
	(async () => {
		for (const step of STEPS) {
			const s = state.get(step.id);
			if (s) s.status = "idle"; // Reset status logic?
		}
		for (const step of STEPS) {
			await runScript(step.id);
			const s = state.get(step.id);
			if (s?.status === "error") break;
		}
	})();
	return c.json({ started: true });
});

// Start
export default {
	port: 3014,
	fetch: app.fetch,
};
