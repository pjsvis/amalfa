import { readdir } from "node:fs/promises";
import { spawn } from "bun";
import { Hono } from "hono";
import { streamText } from "hono/streaming";
import { FlowContainer, PageWrapper, ReadingColumn } from "./layout"; // Your UI
import { LogStream } from "./log-stream";

const app = new Hono();

// --- 1. THE DYNAMIC INDEX PAGE ---
// Automatically lists whatever is in the /scripts/tools folder
app.get("/", async (c) => {
  // Read the tools directory
  const files = await readdir("./scripts/tools");
  const tools = files.filter((f) => f.endsWith(".ts") || f.endsWith(".py"));

  return c.html(
    <PageWrapper title="Brutalisimo Tools">
      <ReadingColumn width="wide">
        <h1 className="text-xl font-bold text-neon mb-6">
          {" "}
          SYSTEM_TOOLS_REGISTRY
        </h1>

        <FlowContainer gap="normal">
          {tools.map((tool) => (
            <a
              href={`/view/${tool}`}
              className="block group"
            >
              <div className="border border-gray-800 bg-neutral-900/50 p-4 hover:border-neon transition-colors w-64 h-32 flex flex-col justify-between">
                <div className="font-mono text-white font-bold">{tool}</div>
                <div className="text-xs text-gray-500 group-hover:text-neon">
                  [ RUN_TOOL ]
                </div>
              </div>
            </a>
          ))}
        </FlowContainer>
      </ReadingColumn>
    </PageWrapper>,
  );
});

// --- 2. THE GENERIC VIEWER PAGE ---
// Renders the UI shell for ANY tool
app.get("/view/:script", (c) => {
  const scriptName = c.req.param("script");
  return c.html(
    <PageWrapper title={`Running: ${scriptName}`}>
      {/* Re-use the LogStream component we built earlier */}
      <LogStream streamUrl={`/stream/${scriptName}`} />
    </PageWrapper>,
  );
});

// --- 3. THE UNIVERSAL RUNNER ---
// Spawns the script and streams JSONL
app.get("/stream/:script", (c) => {
  const scriptName = c.req.param("script");
  // Security: Prevent directory traversal!
  if (scriptName.includes("..") || scriptName.includes("/"))
    return c.text("ACCESS DENIED", 403);

  const isPython = scriptName.endsWith(".py");
  const cmd = isPython
    ? ["python3", "-u", `./scripts/tools/${scriptName}`]
    : ["bun", `./scripts/tools/${scriptName}`];

  return streamText(c, async (_stream) => {
    const _proc = spawn(cmd, { stdout: "pipe", stderr: "pipe" });

    // ... (Insert standard streaming logic from previous turn) ...
  });
});
