// POLYVIS REACTOR CORE
// Uses raw SSE (Server-Sent Events) to drive Datastar UI updates

console.log(`[REACTOR] Booting up...`);

// LIFECYCLE: Write PID
const PID_FILE = ".reactor.pid";
await Bun.write(PID_FILE, process.pid.toString());

const server = Bun.serve({
  port: 3050,
  async fetch(req) {
    const url = new URL(req.url);

    // 1. Serve the UI Shell
    if (url.pathname === "/") {
        return new Response(Bun.file(import.meta.dir + "/index.html"));
    }

    // 1.5 Serve Datastar Bundle
    if (url.pathname === "/datastar.js") {
        return new Response(Bun.file(import.meta.dir + "/datastar.bundle.js"), {
            headers: { "Content-Type": "application/javascript" }
        });
    }

    // 2. The Reactor Stream (SSE)
    if (url.pathname === "/feed") {
        console.log(`[REACTOR] Client connected: ${req.headers.get("user-agent")}`);

        let timer: Timer;

        const stream = new ReadableStream({
            start(controller) {
                // Helper to send Datastar-formatted SSE events
                const send = (event: string, dataLines: Record<string, string>) => {
                    let dataBlock = "";
                    for (const [key, value] of Object.entries(dataLines)) {
                        dataBlock += `data: ${key} ${value}\n`;
                    }
                    const payload = `event: ${event}\n${dataBlock}\n`;
                    controller.enqueue(new TextEncoder().encode(payload));
                };

                // SIMULATION LOOP (10Hz = 100ms)
                timer = setInterval(() => {
                    // Generate random metrics as per brief specifications
                    const cpu_temp = (Math.random() * 100).toFixed(1);
                    const ingestion_rate = Math.floor(Math.random() * 5000);

                    // Random status enum from brief: IDLE, PROCESSING, FLUSHING
                    const STATUS_VALUES = ["IDLE", "PROCESSING", "FLUSHING"];
                    const status = STATUS_VALUES[Math.floor(Math.random() * STATUS_VALUES.length)];

                    // Calculate visual height for CSS graph based on cpu_temp
                    const rod_height = `${Math.min(100, Math.max(0, parseFloat(cpu_temp)))}%`;

                    const signalJSON = JSON.stringify({
                        cpu_temp: cpu_temp,
                        ingestion_rate: ingestion_rate,
                        status: status,
                        rod_height: rod_height
                    });

                    send("datastar-merge-signals", {
                        signals: signalJSON,
                        onlyIfMissing: "false"
                    });

                }, 100);
            },
            cancel() {
                 console.log("[REACTOR] Client disconnected.");
                 clearInterval(timer);
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`[REACTOR] Online at http://localhost:${server.port}`);
