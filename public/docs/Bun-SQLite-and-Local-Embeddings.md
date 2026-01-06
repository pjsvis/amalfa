# **Engineering Architecture Report: "Resonance" Local-First CLI Stack Analysis**

## **1\. Executive Summary and Architectural Vision**

The development of "Resonance," a local-first Command Line Interface (CLI) tool designed for macOS on Apple Silicon, represents a convergence of three distinct but rapidly evolving technical frontiers: high-performance JavaScript runtimes, embedded vector search databases, and local machine learning inference. The stated objective is to deliver a seamless, single-binary application that integrates a hybrid Graph/Vector database without relying on external dependencies such as Python sidecars or user-managed system libraries. This report provides an exhaustive technical analysis of the feasibility, constraints, and optimal architectural patterns required to achieve this goal using Bun (v1.3.2+) as the primary runtime.

The core challenge identified in this analysis is the impedance mismatch between the virtualization mechanisms used by single-file executable bundlers and the operating system's native loader requirements for dynamic libraries. While Bun offers a compelling performance profile—often exceeding Node.js by orders of magnitude in startup time and I/O operations—its "single binary" compilation mode (bun build \--compile) introduces strict isolation layers that conflict with the legacy C-based loading mechanisms of SQLite extensions (sqlite-vec) and machine learning runtimes (onnxruntime-node).

Furthermore, the macOS platform imposes specific security and structural constraints on the sqlite3 library, most notably the compilation flag SQLITE\_OMIT\_LOAD\_EXTENSION, which disables dynamic extension loading in the system-provided binary. This creates a hard dependency on custom, user-supplied binaries for any application intending to utilize vector search capabilities.1 Similarly, the machine learning ecosystem for JavaScript, dominated by transformers.js, carries legacy dependencies like sharp that are brittle in non-standard runtimes like Bun, necessitating careful dependency graph pruning.3

Despite these hurdles, the analysis confirms that a robust, high-performance architecture is achievable. By adopting a "Native Extraction Pattern"—wherein bundled binary assets are identified, extracted to a temporary location at runtime, and then loaded via absolute paths—"Resonance" can bypass the limitations of the virtual filesystem while maintaining the user experience of a single executable. This report details the implementation of this pattern, the specific build configurations required to exclude problematic dependencies, and the precise API usage for overriding Bun's default SQLite linkage.

## **2\. Architectural Context: The Single-Binary Imperative**

### **2.1 The Evolution of JavaScript Runtimes on Apple Silicon**

The transition to Apple Silicon (M1/M2/M3 architectures) has fundamentally altered the performance landscape for local development tools. The ARM64 architecture favors highly optimized, native code execution paths, which aligns with Bun's design philosophy. Built on the JavaScriptCore (JSC) engine—the same engine powering WebKit and Safari—Bun is uniquely positioned to leverage macOS optimizations compared to the V8-based Node.js runtime.5 JSC optimizes for faster startup times and lower memory footprints, critical metrics for transient CLI processes.

However, this tight integration comes with trade-offs. Bun's standard library, particularly bun:sqlite, is designed to link dynamically against the host system's libraries to minimize the baseline executable size. On macOS, this means linking against /usr/lib/libsqlite3.dylib. Apple, prioritizing system stability and security (specifically System Integrity Protection, or SIP), compiles this library with the SQLITE\_OMIT\_LOAD\_EXTENSION preprocessor directive.2 This directive physically removes the code paths responsible for dlopen-ing external shared objects, rendering the standard sqlite3\_load\_extension C-API and the SQL .load command non-functional. This is not a bug in Bun, but a deliberate constraint of the macOS environment that Bun inherits by default.8

### **2.2 The Mechanics of bun build \--compile**

To understand the proposed solution, one must first dissect how bun build \--compile constructs a binary. Unlike languages like Go or Rust that compile source code to machine instructions linked statically against libraries, Bun's compilation process is closer to a "self-extracting archive" attached to an interpreter. The resulting binary consists of:

1. **The Bun Runtime:** A stripped-down version of the Bun executable, including JSC and the libuv-like IO layer.  
2. **The Virtual Filesystem (VFS):** A concatenated blob containing the application's JavaScript source code, assets, and non-native dependencies.  
3. **The Header:** A pointer table instructing the runtime where the VFS begins.

When this binary executes, Bun intercepts file system calls (like fs.readFileSync or require). If the requested path corresponds to a file within the VFS, Bun serves the data directly from memory.10 This works seamlessly for JavaScript files. However, native add-ons (specifically .node files usually built with node-gyp or cmake-js) and dynamic libraries (.dylib) cannot be loaded this way. The operating system's kernel loader (dyld on macOS) requires a file descriptor pointing to a physical inode on the disk to map the library into the process's address space. It cannot "see" into the Bun binary's internal memory structure.12

This limitation necessitates a "Hybrid Storage Strategy" for "Resonance." While code and static assets reside in the read-only VFS, execution-critical binary components (the SQLite library, the vector extension, and the ONNX runtime binding) must be externalized to the physical disk at runtime to be usable.

### **2.3 The Hybrid Data Requirement**

"Resonance" aims to store both structural graph data and semantic vector embeddings.

* **Graph Data:** Relational data with heavy foreign key usage, best queried via recursive SQL capabilities (CTEs). SQLite 3.38+ supports standard JSON functions, allowing for flexible node storage.  
* **Vector Data:** Embedding vectors (e.g., 384-float arrays for all-MiniLM-L6-v2) used for cosine similarity search. Standard SQLite B-Tree indexing is inefficient for high-dimensional nearest neighbor search.

The sqlite-vec extension (a successor to sqlite-vss) introduces virtual tables utilizing optimized index structures (like HNSW or inverted file indexes) to perform approximate nearest neighbor (ANN) search. It is written in C and distributed as a loadable extension (vec0.dylib). Integrating this into the "Resonance" CLI is the primary interoperability challenge, as it requires a host SQLite capable of loading it.14

## **3\. Deep Analysis: Enabling SQLite Extensions in Bun**

The error message "does not support dynamic extension loading" serves as the definitive confirmation that the active SQLite build is the system-provided one. To resolve this, we must replace the engine while maintaining the high-performance interface of bun:sqlite.

### **3.1 The Database.setCustomSQLite() API**

Bun anticipates the limitation of macOS system libraries and provides an escape hatch: the Database.setCustomSQLite(path) API. This static method on the Database class instructs the runtime to ignore the system path and instead dlopen a specific shared library file provided by the user.8

Crucially, this method must be invoked **before** any database connection is instantiated. Once the SQLite symbols are loaded into the process memory, they cannot be unloaded or swapped.

TypeScript

import { Database } from "bun:sqlite";

// This path must be absolute and point to a physical file on disk.  
// It cannot point to a resource inside the bundled VFS.  
Database.setCustomSQLite("/tmp/resonance/libsqlite3.dylib");

const db \= new Database(":memory:");

Using this API allows the application to utilize a custom-compiled version of SQLite that has SQLITE\_ENABLE\_LOAD\_EXTENSION defined, effectively bypassing Apple's restrictions.

### **3.2 Sourcing the Correct Binary**

For a single-binary distribution, relying on the user to have brew install sqlite is unacceptable; it violates the zero-dependency constraint. The "Resonance" build pipeline must therefore include a pre-compiled libsqlite3.dylib (and vec0.dylib) compatible with macOS ARM64.

These binaries can be sourced from:

1. **Homebrew (Build Time Only):** Copying the dylib from a brew installation (/opt/homebrew/opt/sqlite/lib/libsqlite3.dylib) into the project's assets folder.18  
2. **Compilation from Source:** Downloading the SQLite amalgamation and compiling it with clang \-dynamiclib and specific flags (-DSQLITE\_ENABLE\_LOAD\_EXTENSION, \-DSQLITE\_ENABLE\_FTS5, \-DSQLITE\_ENABLE\_JSON1).

The latter approach is recommended for production builds to ensure deterministic behavior and to strip unnecessary features, reducing binary size.

### **3.3 The "Native Extraction" Pattern**

Since Database.setCustomSQLite() requires a physical file path, and bun build \--compile bundles assets into a virtual filesystem, a runtime extraction bridge is mandatory. This pattern involves embedding the binary assets as base64 strings or raw buffers within the bundle, and then writing them to a temporary directory upon application startup.

**Mechanism:**

1. **Embed:** Configure the bundler to treat .dylib files as generic assets. In Bun, this can be done using the file loader, which usually resolves to a path. In a compile context, we need to ensure we can access the *content* of these files.  
2. **Extract:** On startup, checking for the existence of a versioned temporary directory (e.g., /tmp/resonance-v1.0.0/). If it works, skip extraction. If missing, write the buffers to disk.  
3. **Load:** Pass the resulting paths to setCustomSQLite and db.loadExtension.

Performance Implications:  
Writing 2-5MB of binary data to /tmp (usually a RAM disk or high-speed SSD on macOS) takes negligible time (milliseconds). This cost is incurred only on the first run after an update or reboot, which is an acceptable trade-off for the single-binary capability.

### **3.4 Alternative: The better-sqlite3 Dead End**

The prompt mentions that better-sqlite3 fails with ERR\_DLOPEN\_FAILED. This is a ubiquitous issue when using Node-API (N-API) modules within Bun's compiled binaries. better-sqlite3 is a native binding that links to its own bundled SQLite. While robust in Node.js, its build process (node-gyp) and loading mechanism are fragile in Bun's environment. Furthermore, bun:sqlite is benchmarked to be significantly faster (3-6x) for read operations due to Bun's ability to directly call C functions from JavaScript without the V8 C++ bridge overhead.19 Therefore, fixing better-sqlite3 is a suboptimal path compared to enabling bun:sqlite.

## **4\. Evaluation of the Turso / LibSQL Ecosystem**

LibSQL is a fork of SQLite that has garnered attention for its "Open Contribution" model and native vector search support. It is often touted as a drop-in replacement, but for a local-first, single-binary CLI, the integration introduces nuance.

### **4.1 Driver Architecture and Local Files**

The @libsql/client library is designed primarily as a network client for communicating with Turso's edge databases via HTTP or WebSockets. However, it does expose a file: protocol for accessing local databases.21

When initialized with url: "file:local.db", the @libsql/client library behaves as a wrapper. In a Node.js environment, it typically delegates to better-sqlite3 to handle the actual file operations. In a Bun environment, it attempts to use the native bun:sqlite or falls back to a Wasm implementation if native bindings fail.

**Critical Finding:** If @libsql/client utilizes bun:sqlite as its underlying driver for local files (which is the preferred high-performance path), it inherits the *exact same limitations* regarding extension loading on macOS.23 It does not magically inject the LibSQL fork of SQLite into the process unless it uses a specifically compiled native node module (like @libsql/darwin-arm64).

### **4.2 The Vector Search Capability**

LibSQL's vector search is "native" in the sense that the LibSQL core (the C library) includes the vector code. However, utilizing this in a JavaScript environment requires that the JavaScript runtime be linked against *that specific* LibSQL C library, not the system SQLite.

For the @libsql/client to support vector search locally on a file, one of two things must happen:

1. **Remote Mode:** The client sends queries to a remote Turso instance where vector search is enabled. (Violates "Local-First" constraint).  
2. **Embedded Replica / Native Mode:** The client loads a native binary (e.g., libsql.node or libsql.dylib) that contains the LibSQL core.

If we pursue the Native Mode, we return to the exact same problem as the "Native Extraction Pattern" described in Section 3\. We would need to bundle the LibSQL native binary inside the single executable and extract it at runtime so the OS loader can read it.

### **4.3 Comparison with Pure Bun**

| Feature | Pure Bun \+ sqlite-vec | LibSQL Client (Local) |
| :---- | :---- | :---- |
| **Engine** | Standard SQLite \+ Extension | LibSQL Fork |
| **Vector Search** | Via vec0 virtual table | Native datatype / function |
| **Performance** | Native FFI (Fastest) | Wrapper Overhead (Slower) |
| **Complexity** | High (Manual extraction setup) | High (Native module extraction) |
| **Dependencies** | Minimal (Manual binary control) | Heavy (NPM dependency tree) |

**Verdict:** Adopting @libsql/client for a strictly local file use case adds a layer of abstraction without solving the fundamental binary distribution problem. It introduces network-focused dependencies (like undici or ws) that are unnecessary for a CLI tool operating on a local file. The pure Bun approach offers finer control over the exact binary loaded.

## **5\. Reliable Zero-Dependency Embeddings**

The "Resonance" CLI must transform user queries into vector embeddings (e.g., using all-MiniLM-L6-v2) locally. The dominant library, @xenova/transformers (now migrated to @huggingface/transformers), presents dependency challenges in the Bun environment.

### **5.1 The sharp Dependency Issue**

transformers.js is a multi-modal library designed to handle text, audio, and vision. To support vision models, it includes sharp—a high-performance image processing library based on libvips—as a dependency.3

**The Failure Mode:** sharp relies on platform-specific native binaries (.node addons) that are downloaded during installation (npm install). In Bun, specifically on Apple Silicon, the interaction between Bun's package manager and sharp's install scripts has been historically flaky, leading to ERR\_DLOPEN\_FAILED or segmentation faults when the runtime tries to load the image processing bindings, even if the user only intends to process text.4

The Resolution Strategy:  
Since "Resonance" is a text-focused tool, sharp is entirely optional. We can rigorously exclude it from the build:

1. **Configuration:** Update bun build to explicitly mark sharp as external or mock it.  
2. **Runtime Check:** Ensure the code never calls vision-related pipelines (e.g., image-classification), which would trigger the lazy loading of sharp.

### **5.2 ONNX Runtime in Bun**

The inference engine beneath transformers.js is onnxruntime-node. This is a Node.js wrapper around the Microsoft ONNX Runtime C++ library.

* **Compatibility:** onnxruntime-node is compatible with Bun via Bun's implementation of the Node-API (N-API).  
* **The Loading Problem:** Like SQLite, onnxruntime-node ships with a native binary: onnxruntime\_binding.node and a shared library libonnxruntime.dylib.12  
* **Compile Limitation:** When bun build \--compile runs, it does not link these binaries. It treats them as assets. If the code simply does require('onnxruntime-node'), it will fail inside the executable because the N-API loader cannot load the .node file from the virtual filesystem.

**Solution:** The "Native Extraction Pattern" must also be applied here. The .node binding and its dependent .dylib must be written to the temporary directory alongside the SQLite library.

### **5.3 Lightweight Alternatives: fastembed-js**

fastembed-js is a port of the Qdrant fastembed library. It is significantly more lightweight than transformers.js because it focuses solely on text embedding models.26

* **Pros:** Smaller dependency tree, focused API, supports quantized models out of the box.  
* **Cons:** It typically relies on onnxruntime-node as well, meaning the binary extraction problem remains identical.  
* **Recommendation:** fastembed-js is preferred over transformers.js for this specific use case due to its lower logical overhead, even though the structural build complexity is similar. It avoids the sharp issue entirely.

## **6\. Detailed Implementation Strategy: The "Native Extraction" Pattern**

The following section provides the concrete implementation details for the "Option A" recommendation: Pure Bun with Native Extraction.

### **6.1 Dependency and Asset Preparation**

The project structure must explicitly manage the native assets. We assume the following directory structure:  
/project-root  
/assets  
libsqlite3.dylib (Custom build: \+Extension, \-OmitLoadExtension)  
vec0.dylib (sqlite-vec extension)  
onnxruntime\_binding.node (From onnxruntime-node package)  
libonnxruntime.dylib (From onnxruntime-node package)  
/src  
index.ts  
NativeLoader.ts

### **6.2 The Bootstrapper (NativeLoader.ts)**

This module is responsible for "hydrating" the native environment. It checks if the application is running as a compiled binary and, if so, extracts the embedded assets to a temporary location.

TypeScript

// src/NativeLoader.ts  
import { write, file, constants } from "bun";  
import { join } from "path";  
import { tmpdir } from "os";  
import { chmodSync } from "fs";

// Import assets as Blobs using Bun's file loader  
// These imports will be replaced by the bundler with internal pointers  
import libSqliteBlob from "../assets/libsqlite3.dylib" with { type: "file" };  
import vecExtensionBlob from "../assets/vec0.dylib" with { type: "file" };  
// Note: ONNX binaries would be imported similarly

export class NativeLoader {  
  private static tempDir: string;

  /\*\*  
   \* Ensures all native binaries are present on the physical filesystem.  
   \* Returns the absolute paths to the libraries.  
   \*/  
  static async ensureAssets(): Promise\<{ sqlitePath: string; vecPath: string }\> {  
    // 1\. Generate a stable temp path based on version to allow caching  
    // In a real app, use a hash of the binary or a version string  
    const version \= "v1.0.0";  
    const tempPath \= join(tmpdir(), \`resonance-${version}\`);  
      
    // Create directory if it doesn't exist  
    // Bun.write automatically creates dirs if implicit, but good to be explicit  
    // We use a lockfile pattern or simple existence check  
    this.tempDir \= tempPath;

    // 2\. Define target paths  
    const sqlitePath \= join(tempPath, "libsqlite3.dylib");  
    const vecPath \= join(tempPath, "vec0.dylib");

    // 3\. Extract SQLite Library if missing  
    if (\!(await file(sqlitePath).exists())) {  
      console.log("Extracting SQLite runtime...");  
      await write(sqlitePath, libSqliteBlob);  
      // Ensure executable permissions if necessary (mostly for executables, less for libs)  
      chmodSync(sqlitePath, 0o755);  
    }

    // 4\. Extract Vector Extension if missing  
    if (\!(await file(vecPath).exists())) {  
      console.log("Extracting Vector extension...");  
      await write(vecPath, vecExtensionBlob);  
      chmodSync(vecPath, 0o755);  
    }

    return {  
      sqlitePath,  
      vecPath  
    };  
  }  
}

### **6.3 The Application Entry Point (index.ts)**

The main application flow must await the loader before initializing services.

TypeScript

// src/index.ts  
import { Database } from "bun:sqlite";  
import { NativeLoader } from "./NativeLoader";

async function main() {  
  console.log("Initializing Resonance...");

  // 1\. Bootstrap native environment  
  const nativePaths \= await NativeLoader.ensureAssets();

  // 2\. Override Bun's default SQLite  
  // This MUST happen before \`new Database()\`  
  Database.setCustomSQLite(nativePaths.sqlitePath);

  // 3\. Initialize Database  
  const db \= new Database("resonance.db");

  // 4\. Load the vector extension  
  // Note: loadExtension expects the path to the library  
  db.loadExtension(nativePaths.vecPath);

  // 5\. Verification  
  const version \= db.prepare("SELECT vec\_version()").get();  
  console.log(\`Resonance DB Online. Vector Engine: ${JSON.stringify(version)}\`);

  // Application logic follows...  
}

main().catch(console.error);

### **6.4 The Build Configuration**

To make this work, the build script must map the .dylib and .node extensions to the file loader, which tells Bun "embed this file as a Blob, don't try to parse it."

TypeScript

// build.ts  
await Bun.build({  
  entrypoints: \["./src/index.ts"\],  
  outdir: "./dist",  
  minify: true,  
  compile: true, // Generate single binary  
  target: "bun",  
  loader: {  
    ".dylib": "file", // Embed native libs as files  
    ".node": "file",  // Embed node addons as files  
  },  
  // Explicitly exclude sharp to prevent build errors  
  external: \["sharp", "vscode"\],   
});

## **7\. Comparative Analysis Table**

The following table summarizes the trade-offs between the investigated stacks for the specific goal of a "Single Binary CLI."

| Feature | A) Pure Bun \+ Extraction | B) Bun \+ Turso/LibSQL | C) Bun \+ Custom Node-API |
| :---- | :---- | :---- | :---- |
| **Binary Size** | Medium (\~50-80MB) | Medium (\~60MB) | Large (Bundle overhead) |
| **Performance** | **High** (Native FFI, minimal overhead) | **Medium** (Wrapper overhead) | **High** (Native C++) |
| **Vector Support** | **Full** (via sqlite-vec) | **Native** (LibSQL core) | **Full** (Custom link) |
| **Maintenance** | **Moderate** (Asset management) | **Low** (Managed lib) | **High** (C++ maintenance) |
| **Single Binary** | **Feasible** (via Extraction) | **Difficult** (Hidden native deps) | **Difficult** (N-API loading) |
| **Complexity** | **High Setup / Low Runtime** | **Low Setup / High Runtime Risk** | **High Setup / High Complexity** |

## **8\. Final Recommendation**

**The recommended stack for "Resonance" is Option A: Pure Bun (BLOB vectors \+ Native Extraction).**

This approach is the "most robust today" because it relies on explicit, controllable mechanisms (file writing and absolute path loading) rather than implicit, "black box" behavior of third-party wrappers like @libsql/client or better-sqlite3, which hide their native dependency logic and often fail in bundled environments.

By manually managing the libsqlite3.dylib and vec0.dylib assets, the "Resonance" team gains:

1. **Determinism:** You control exactly which version of SQLite is running on the user's machine, eliminating system library version mismatches.  
2. **Performance:** You utilize bun:sqlite, which is currently the fastest SQLite driver for JavaScript.  
3. **Simplicity:** The extraction code is less than 50 lines of TypeScript, compared to the thousands of lines of code in a wrapper library that might not fully support the file: protocol or bundled environments.

This architecture successfully circumvents the macOS SQLITE\_OMIT\_LOAD\_EXTENSION limitation and the single-binary virtual filesystem constraints, delivering a high-performance, local-first database experience.

#### **Works cited**

1. bun:sqlite on macOS still shows SQLite 3.37.0 in Bun 1.3.3 · Issue \#24957 \- GitHub, accessed on December 8, 2025, [https://github.com/oven-sh/bun/issues/24957](https://github.com/oven-sh/bun/issues/24957)  
2. How do you load extensions in sqlite built into emacs?, accessed on December 8, 2025, [https://emacs.stackexchange.com/questions/79956/how-do-you-load-extensions-in-sqlite-built-into-emacs](https://emacs.stackexchange.com/questions/79956/how-do-you-load-extensions-in-sqlite-built-into-emacs)  
3. \`Segmentation fault (core dumped)\` when using Transformers.js · Issue \#4619 · oven-sh/bun, accessed on December 8, 2025, [https://github.com/oven-sh/bun/issues/4619](https://github.com/oven-sh/bun/issues/4619)  
4. In bun 1.3.4, sharp paackage is failing at build · Issue \#25395 \- GitHub, accessed on December 8, 2025, [https://github.com/oven-sh/bun/issues/25395](https://github.com/oven-sh/bun/issues/25395)  
5. Bun — A fast all-in-one JavaScript runtime, accessed on December 8, 2025, [https://bun.com/](https://bun.com/)  
6. JavaScript Evolution: Why Bun Is More Than Just Fast | by Burhan Khan | Medium, accessed on December 8, 2025, [https://medium.com/@burhan-khan/javascript-evolution-why-bun-is-more-than-just-fast-5a9732c1de1e](https://medium.com/@burhan-khan/javascript-evolution-why-bun-is-more-than-just-fast-5a9732c1de1e)  
7. Compile-time Options \- SQLite, accessed on December 8, 2025, [https://sqlite.org/compile.html](https://sqlite.org/compile.html)  
8. Database.loadExtension method | bun:sqlite module, accessed on December 8, 2025, [https://bun.com/reference/bun/sqlite/Database/loadExtension](https://bun.com/reference/bun/sqlite/Database/loadExtension)  
9. \`bun:sqlite\`: segfault when calling \`.loadExtension()\` when \`sqlite3\_load\_extension\` is not available · Issue \#5756 \- GitHub, accessed on December 8, 2025, [https://github.com/oven-sh/bun/issues/5756](https://github.com/oven-sh/bun/issues/5756)  
10. Bundler \- Bun, accessed on December 8, 2025, [https://bun.com/docs/bundler](https://bun.com/docs/bundler)  
11. Single-file executable \- Bun, accessed on December 8, 2025, [https://bun.com/docs/bundler/executables](https://bun.com/docs/bundler/executables)  
12. onnxruntime-node native binding not found when packaging with pkg — need official way to load from custom path \- Stack Overflow, accessed on December 8, 2025, [https://stackoverflow.com/questions/79791807/onnxruntime-node-native-binding-not-found-when-packaging-with-pkg-need-officia](https://stackoverflow.com/questions/79791807/onnxruntime-node-native-binding-not-found-when-packaging-with-pkg-need-officia)  
13. onnxruntime-node in packaged electron app \- Stack Overflow, accessed on December 8, 2025, [https://stackoverflow.com/questions/76256928/onnxruntime-node-in-packaged-electron-app](https://stackoverflow.com/questions/76256928/onnxruntime-node-in-packaged-electron-app)  
14. Custom PHP Binaries with sqlite-vec SQLite Extension \- Ben Bjurstrom, accessed on December 8, 2025, [https://benbjurstrom.com/sqlite-vec-php](https://benbjurstrom.com/sqlite-vec-php)  
15. Trying out SQLite extensions on macOS \- Simon Willison: TIL, accessed on December 8, 2025, [https://til.simonwillison.net/sqlite/trying-macos-extensions](https://til.simonwillison.net/sqlite/trying-macos-extensions)  
16. How sqlite-vec Works for Storing and Querying Vector Embeddings | by Stephen Collins | Medium, accessed on December 8, 2025, [https://medium.com/@stephenc211/how-sqlite-vec-works-for-storing-and-querying-vector-embeddings-165adeeeceea](https://medium.com/@stephenc211/how-sqlite-vec-works-for-storing-and-querying-vector-embeddings-165adeeeceea)  
17. SQLite \- Bun, accessed on December 8, 2025, [https://bun.com/docs/runtime/sqlite](https://bun.com/docs/runtime/sqlite)  
18. sqlite-vec/examples/simple-bun/demo.ts at main \- GitHub, accessed on December 8, 2025, [https://github.com/asg017/sqlite-vec/blob/main/examples/simple-bun/demo.ts](https://github.com/asg017/sqlite-vec/blob/main/examples/simple-bun/demo.ts)  
19. bun:sqlite module | API Reference, accessed on December 8, 2025, [https://bun.com/reference/bun/sqlite](https://bun.com/reference/bun/sqlite)  
20. Quick Guide: Bun \+ SQLite Setup \- OpenReplay Blog, accessed on December 8, 2025, [https://blog.openreplay.com/quick-guide-bun-sqlite-setup/](https://blog.openreplay.com/quick-guide-bun-sqlite-setup/)  
21. SQLite \- Drizzle ORM, accessed on December 8, 2025, [https://orm.drizzle.team/docs/get-started-sqlite](https://orm.drizzle.team/docs/get-started-sqlite)  
22. Reference: LibSQLVector Store | Vectors | Mastra Docs, accessed on December 8, 2025, [https://mastra.ai/reference/vectors/libsql](https://mastra.ai/reference/vectors/libsql)  
23. Turso with local db file \- Deno, accessed on December 8, 2025, [https://questions.deno.com/m/1162288335088259164](https://questions.deno.com/m/1162288335088259164)  
24. Install \`sharp\` to Use Built-In Image Optimization \- Next.js, accessed on December 8, 2025, [https://nextjs.org/docs/messages/install-sharp](https://nextjs.org/docs/messages/install-sharp)  
25. Sharp is not working with "Bun build \--compile" \#4283 \- GitHub, accessed on December 8, 2025, [https://github.com/lovell/sharp/issues/4283](https://github.com/lovell/sharp/issues/4283)  
26. Supported Models \- FastEmbed, accessed on December 8, 2025, [https://qdrant.github.io/fastembed/examples/Supported\_Models/](https://qdrant.github.io/fastembed/examples/Supported_Models/)  
27. Anush008/fastembed-js: Library to generate vector embeddings in NodeJS \- GitHub, accessed on December 8, 2025, [https://github.com/Anush008/fastembed-js](https://github.com/Anush008/fastembed-js)