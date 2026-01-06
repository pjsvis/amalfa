# Deep Research Prompt: Bun, SQLite Extensions, and Local Embeddings

**Context:**
We are building "Resonance", a local-first CLI tool using **Bun** (v1.3.2) on macOS (Apple Silicon). We aim to implement a **Hybrid Graph/Vector Database** in a single binary.

**Constraints:**
*   **Runtime:** Bun (Must compile to a single binary via `bun build --compile`).
*   **Database:** SQLite (Local file).
*   **Vector Search:** Ideally `sqlite-vec` (Native Extension) for performance, or a robust alternative.
*   **Embeddings:** Local generation (e.g., `all-MiniLM-L6-v2`) inside the process (no Python sidecars).

**The Problems:**
1.  **Bun & SQLite Extensions:** `bun:sqlite` throws "does not support dynamic extension loading" on macOS. We suspect `SQLITE_OMIT_LOAD_EXTENSION` is set in Bun's internal build.
2.  **Native Deps:** `better-sqlite3` fails to load in Bun (`ERR_DLOPEN_FAILED`).
3.  **Embeddings:** `@xenova/transformers` fails to install `sharp` (optional dep) reliably in Bun, breaking the build even for text-only use cases.

**Research Objectives:**
Please investigate the following and provide a technical report with code examples where possible:

### 1. Enabling SQLite Extensions in Bun
*   Is there a flag, config, or compile option to enable `loadExtension` in `bun:sqlite` on macOS?
*   Is this a known issue tracked on Bun's GitHub? What is the roadmap?
*   **Verification:** How can we load `sqlite-vec0.dylib` in a Bun script?

### 2. The Turso / LibSQL Route
*   Does the `@libsql/client` (or `libsql-stateless-easy`) driver for Bun support local file databases with extensions?
*   Does LibSQL ship with vector search built-in?
*   Can using `@libsql/client` bypass the `bun:sqlite` limitation while still being bundle-able?
* Are we likely to see any slow down with Turso compared to bun sqlite?

### 3. Reliable-Zero-Dependency Embeddings
*   How can we run quantization-ready ONNX models (like `all-MiniLM-L6-v2`) in Bun **without** heavy/broken dependencies like `sharp`?
*   Investigate `onnxruntime-node` compatibility with Bun.
*   Are there other libraries (e.g., `fast-embeddings`, `bun-plugin-tensorflow`) that are "Bun-Native"?

### 4. Recommendation
*   Given the goal of a "Single Binary" CLI, which stack is most robust *today*?
    *   A) Pure Bun (BLOB vectors + JS Cosine Similarity).
    *   B) Bun + Turso/LibSQL + Vector Extension.
    *   C) Bun + Custom SQLite wrapper.
