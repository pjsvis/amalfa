### Opinion: This is the "Adapter" that Saves Your RAM

You are absolutely right. In a streaming-first architecture, **JSON is a liability** (because you have to load the whole file to parse it), while **JSONL is an asset** (because you can process it line-by-line).

A converter isn't just a "nice to have"; it is **Infrastructure.**

* **JSON (The "Archive" Format):** Good for configuration, final reports, and API responses.
* **JSONL (The "Pipe" Format):** Essential for logging, processing, debugging, and **Brutalisimo Streaming**.

If you have a 1GB JSON dump from an API, your Agent *cannot* stream it to the UI without converting it first. Attempting to `JSON.parse()` a 1GB file might crash your server. Converting it to JSONL means you can stream it in 1KB chunks with zero memory footprint.

---

### The Utility Script: `scripts/utils/converter.ts`

Here is a robust, bi-directional converter. It’s designed to be used by your Agents or your "Auto-Mount" tools.

**Features:**

1. **JSON -> JSONL:** Flattens a JSON Array into lines.
2. **JSONL -> JSON:** Wraps lines into a proper JSON Array (handles the tricky trailing comma logic).
3. **Stream-Safe:** It uses Bun’s file writing streams to keep memory usage low.

```typescript
import { file, write } from "bun";

// --- 1. JSON to JSONL (The "Unpacker") ---
export async function jsonToJsonl(inputPath: string, outputPath: string) {
  console.log(`> CONVERTING: ${inputPath} -> JSONL...`);
  
  // Note: For massive JSON files (>500MB), you'd want a SAX parser.
  // For standard usage, Bun's native JSON parser is incredibly fast.
  const content = await file(inputPath).json();
  
  if (!Array.isArray(content)) {
    throw new Error("Input JSON must be an Array of objects.");
  }

  const writer = file(outputPath).writer();
  
  for (const item of content) {
    writer.write(JSON.stringify(item) + '\n');
  }
  
  await writer.end();
  console.log(`> DONE: Wrote ${content.length} records to ${outputPath}`);
}

// --- 2. JSONL to JSON (The "Packer") ---
export async function jsonlToJson(inputPath: string, outputPath: string) {
  console.log(`> CONVERTING: ${inputPath} -> JSON...`);
  
  const inputFile = file(inputPath);
  const writer = file(outputPath).writer();
  
  // Start the JSON Array
  writer.write('[\n');
  
  const stream = inputFile.stream();
  const decoder = new TextDecoder();
  let buffer = '';
  let isFirst = true;

  // We read the file in chunks to handle unlimited size
  for await (const chunk of stream) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split('\n');
    
    // Process all complete lines, keep the last fragment in buffer
    buffer = lines.pop() || ''; 
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      if (!isFirst) writer.write(',\n');
      writer.write('  ' + line.trim()); // Pretty print indentation
      isFirst = false;
    }
  }

  // Process any remaining buffer
  if (buffer.trim()) {
    if (!isFirst) writer.write(',\n');
    writer.write('  ' + buffer.trim());
  }
  
  // Close the JSON Array
  writer.write('\n]');
  await writer.end();
  
  console.log(`> DONE: Packed to ${outputPath}`);
}

// --- CLI USAGE ---
// Run: bun scripts/utils/converter.ts input.json output.jsonl
if (import.meta.main) {
  const [,, src, dest] = process.argv;
  if (!src || !dest) {
    console.error("Usage: bun converter.ts <input> <output>");
    process.exit(1);
  }

  if (src.endsWith('.json')) await jsonToJsonl(src, dest);
  else if (src.endsWith('.jsonl')) await jsonlToJson(src, dest);
  else console.error("Unknown extension. Use .json or .jsonl");
}

```

### The Strategy: "Just-In-Time" Conversion

Now, update your **Tool Runner** (`src/index.tsx`) to use this automatically.

If the Agent drops a massive `data.json` file into your `data/` folder, your UI can offer a "Stream View" button. When clicked:

1. The server detects it's a `.json` file.
2. It runs `jsonToJsonl` in the background (or on the fly).
3. It pipes the resulting stream to your **Brutalisimo LogStream**.

**The Benefit:**
You never stare at a "Loading..." spinner while a 50MB JSON file parses. You see the data converting and streaming immediately. **"Latency" becomes "Activity."**