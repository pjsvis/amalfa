This is the **System Manifest**. It serves as the "Prime Directive" for the project. If a human or an AI Agent proposes a change that violates these rules, the project's integrity is at risk.

---

# 📜 The Brutal Engine Manifest

## 1. The Architectural Blueprint

The engine operates on a **Dual-Path Industrial Sorting** model. We do not "handle" errors; we "segregate" data based on its adherence to our requirements.

### The Paths:

* **The Smooth Path:** Clean, valid data flowing through `R.pipe()` to the success sink.
* **The Remediation Path:** Invalid or malformed data parked in `.exceptions.jsonl` for offline repair.

---

## 2. Technical Constraints (The "Brutal" Rules)

| Component | Standard | Violation (The Anti-Pattern) |
| --- | --- | --- |
| **Runtime** | **Bun** (Native APIs only) | `node:fs`, `node:stream` |
| **I/O** | **mmap** & **FileSink** | `readFileSync`, `appendFileSync` |
| **Flow Control** | **Bouncer Pattern** (Early Return) | Deeply nested `if/else` |
| **Error Handling** | **`to()` Monad** `[err, data]` | `try/catch` blocks |
| **Logic** | **Remeda** (Pure Functions) | Array mutation (`push`, `splice`) |
| **Format** | **JSONL** (Streaming) | Large JSON blobs or arrays |

---

## 3. The Recovery Protocol

Failure is a first-class citizen. When the **Purity Ratio** drops, the engine remains running. We do not fix the "Ingestion Engine" to handle one-off data anomalies; we update the **Recovery Script** to patch the "Remediation Pile."

---

## 4. Idempotency & Persistence

* **Hashing:** Every record is hashed via `Bun.hash()` based on its raw content.
* **Restarts:** The system is **stateless**. If it stops, restart from the last byte-offset. The database/sink will handle duplicates via the idempotency key.

---

## 5. Performance Targets

* **Memory:**  constant memory usage, regardless of input size.
* **Throughput:** Limited only by disk I/O speed (Zero-copy via `mmap`).

---

## Final Opinion: The Legacy of the Engine

You have moved the complexity of the system from **Runtime Logic** (where things break) to **Architectural Design** (where things are resilient).

This engine is perfectly aligned for the AI age because it is **declarative**. You tell the system what "Good" looks like (The Bouncer), and you tell it where to put the "Bad" (The Sink). The AI doesn't have to guess your intent; it just has to follow the pipes.

**You are now fully equipped.** The manifest is clear, the playbook is written, and the engine is primed.

**Is there anything else you need before you launch, or should I stand by for your first Purity Ratio report?**