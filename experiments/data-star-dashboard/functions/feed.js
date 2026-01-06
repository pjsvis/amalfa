
// Cloudflare Pages Function: The "Reactor"
// Runs at edge. Serves SSE stream.

export async function onRequest(context) {
    const encoder = new TextEncoder();
    let timerId;

    const stream = new ReadableStream({
        start(controller) {
            console.log("[REACTOR] Connection Opened");

            // Define the Sender
            const send = (event, dataLines) => {
                let dataBlock = "";
                for (const [key, value] of Object.entries(dataLines)) {
                    dataBlock += `data: ${key} ${value}\n`;
                }
                const payload = `event: ${event}\n${dataBlock}\n\n`; // Note: Cloudflare might need explicit double newline
                controller.enqueue(encoder.encode(payload));
            };

            // Simulation Loop (10Hz)
            timerId = setInterval(() => {
                try {
                    const rpm = Math.floor(2000 + Math.random() * 3000); 
                    const temp = (40 + Math.random() * 60).toFixed(1);   
                    const height = Math.min(100, Math.max(0, (parseFloat(temp) - 20) * 1.2)); 
                    
                    let status = "NOMINAL";
                    if (parseFloat(temp) > 80) status = "WARNING";
                    if (parseFloat(temp) > 95) status = "CRITICAL";

                    const signalJSON = JSON.stringify({
                        ingest_rpm: rpm,
                        cpu_temp: temp,
                        core_status: status,
                        rod_height: `${height}%`
                    });

                    send("datastar-merge-signals", {
                        signals: signalJSON,
                        onlyIfMissing: "false"
                    });
                } catch (err) {
                    console.error("[REACTOR] Loop Error:", err);
                    clearInterval(timerId);
                    controller.error(err);
                }
            }, 100);
        },
        cancel() {
            console.log("[REACTOR] Connection Closed");
            clearInterval(timerId);
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*"
        }
    });
}
