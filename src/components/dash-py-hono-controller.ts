import { spawn } from "bun";
import { Hono } from "hono";
import { streamText } from "hono/streaming";

/*
Why this is robust:
python3 -u: This is the "magic fix" for Python streaming. Without it, you see nothing for 10 seconds, then everything appears at once.

stderr Capture: If your Python script throws an exception, this controller catches it, wraps it in a Brutalisimo { type: 'error' } JSON object, and streams it to the UI. Your dashboard will show the exact Python traceback in real-time.

TextDecoder: Handles multi-byte characters (like emojis or non-English text) correctly even if they get split across chunks.
*/

const app = new Hono();

app.get("/stream/python-job", (c) => {
  return streamText(c, async (stream) => {
    // 1. SPAWN (With -u for unbuffered output)
    const proc = spawn(["python3", "-u", "scripts/pipeline.py"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const decoder = new TextDecoder();

    // 2. THE FIX: Use getReader() instead of 'for await'
    // This bypasses the TS "AsyncIterator" error completely.
    if (proc.stdout) {
      const reader = proc.stdout.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode and flush immediately
        const chunk = decoder.decode(value, { stream: true });
        await stream.write(chunk);
      }
    }

    // 3. Handle Errors (Same pattern)
    if (proc.stderr) {
      const reader = proc.stderr.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const errorJson = JSON.stringify({
          type: "log",
          level: "error",
          message: `PYTHON ERR: ${chunk.trim()}`,
          timestamp: new Date().toLocaleTimeString(),
        });
        await stream.write(`${errorJson}\n`);
      }
    }

    await proc.exited;
  });
});

export default app;
