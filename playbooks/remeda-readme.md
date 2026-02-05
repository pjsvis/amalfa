This `README.md` serves as the "Manifesto" for your architecture. It’s designed to be read by both humans and AI Agents to ensure everyone respects the "Brutal" constraints that keep the system resilient.

---

# The Brutal Ingestion Toolkit (BIT)

### Bun • TypeScript • Remeda • JSONL

A "Good Parts" approach to high-performance data engineering. This toolkit treats data as an immutable stream, errors as first-class citizens, and the hardware as a high-speed lathe.

## 🛠 The "Brutal" Core Principles

### 1. The Bouncer Pattern (Early Return)

We do not wrap logic in massive `if/else` blocks. We validate at the gate and "bounce" invalid data immediately. This flattens the code and narrows types early.

### 2. The Result Monad (`to()`)

Exceptions are not for flow control. All async operations and risky parses are wrapped in the `to()` helper. This returns a `[error, data]` tuple, forcing explicit handling of failures.

### 3. JSONL over JSON

We do not parse massive JSON arrays. We stream JSON Lines. This keeps memory usage constant () regardless of file size.

### 4. Zero-Copy I/O (`mmap`)

We exploit Bun’s native `mmap` capabilities to treat files as memory-mapped byte arrays. This bypasses the overhead of traditional buffered reading.

---

## 🏗 System Architecture

### Data Flow

1. **Source:** A JSONL file on disk.
2. **Scanner:** `Bun.mmap` scans bytes for newline delimiters.
3. **Bouncer:** The line is passed to `to(JSON.parse)`.
4. **Pipeline:** Valid data enters a `R.pipe()` for transformation.
5. **Sinks:**
* **Success:** High-speed write via `FileSink`.
* **Parked:** Exceptions are written to a separate JSONL file for later recovery.



---

## 📂 Toolkit Structure

| File | Purpose |
| --- | --- |
| `utils.ts` | The `to()` wrapper, hashing, and type guards. |
| `ingest.ts` | The mmap-powered main ingestion engine and CLI. |
| `recover.ts` | The "Repair Station" for processing parked exceptions. |
| `bench.ts` | Memory and throughput profiling via `bun:jsc`. |

---

## 🤖 Instructions for AI Agents (The Playbook)

When modifying this repository, you **MUST** adhere to the following:

* **Strict I/O:** Never use `node:fs`. Use `Bun.file()` and `Bun.write()`.
* **No Sync:** Never use `writeFileSync`. Use `FileSink` for high-frequency writes.
* **Piping:** Use `R.pipe` for any sequence of 2+ data transformations.
* **Immutability:** Do not mutate objects. Return new objects via Remeda utilities.
* **Idempotency:** Every record must generate a deterministic `idempotency_key` via `Bun.hash()`.

---

## 🚀 Getting Started

**Run Ingestion:**

```bash
bun ingest.ts raw_data.jsonl

```

**Run Recovery:**

```bash
bun recover.ts raw_data.exceptions.jsonl

```

**Monitor:**
Open `http://localhost:3000` to watch the bouncers work in real-time.

---

## Opinion: Why This Works

By externalizing state into processable chunks and treating the computer as a stream processor, we eliminate the "Fragile Process" problem. This system is **Interruptible**, **Repeatable**, and **Atomic**. If the process dies, the data is safe. If the data is bad, the process lives.

---

### One final tip for your team:

Since you are now using `mmap`, remind your team that the `input.jsonl` file should stay put while the script is running. Because `mmap` points directly at the disk bytes, moving or deleting the file mid-run will cause a "Bus Error." It's the only "brutal" part of `mmap`—you're touching the hardware now.

**Would you like me to generate a `github-action.yml` that runs your Bun test suite on every push to ensure no one breaks the "Brutal" rules?**