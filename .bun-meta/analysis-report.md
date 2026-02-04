# Bundle Analysis Report
**Date:** 2026-02-02T14:33:25.433Z
**Source:** /Users/petersmith/Dev/GitHub/amalfa/meta.json

## Summary

| Metric | Value |
|--------|-------|
| Input Files | 611 |
| Total Input | 13.15 MB |
| Total Output | 3.77 MB |
| Compression | 28.6% |
| External Packages | 100 |

## Import Breakdown

| Type | Files | Size |
|------|-------|------|
| External | 100 | 2638.0 KB |
| Local | 511 | 10825.9 KB |

## Largest Inputs

| Size | Path |
|------|------|
| 8098.6 KB | node_modules/@anush008/tokenizers-darwin-universal/tokenizers.darwin-universal.node |
| 1736.1 KB | node_modules/@huggingface/transformers/dist/transformers.node.mjs |
| 367.0 KB | meta.json |
| 174.0 KB | node_modules/graphology/dist/graphology.mjs |
| 75.2 KB | node_modules/zod/v4/core/schemas.js |
| 71.0 KB | node_modules/@modelcontextprotocol/sdk/dist/esm/types.js |
| 62.9 KB | node_modules/path-scurry/dist/esm/index.js |
| 61.2 KB | node_modules/@modelcontextprotocol/sdk/node_modules/zod/v4/core/schemas.js |
| 59.8 KB | node_modules/sharp/lib/output.js |
| 56.0 KB | node_modules/lru-cache/dist/esm/index.js |

## External Dependencies

- `fs`
- `path`
- `child_process`
- `fs/promises`
- `bun:sqlite`
- `url`
- `bun`
- `readline`
- `events`
- `os`
- `https`
- `stream`
- `crypto`
- `process`
- `module`
- `diagnostics_channel`
- `worker_threads`
- `./tokenizers.android-arm64.node`
- `@anush008/tokenizers-android-arm64`
- `./tokenizers.android-arm-eabi.node`
- `@anush008/tokenizers-android-arm-eabi`
- `./tokenizers.win32-x64-msvc.node`
- `@anush008/tokenizers-win32-x64-msvc`
- `./tokenizers.win32-ia32-msvc.node`
- `@anush008/tokenizers-win32-ia32-msvc`
- `./tokenizers.win32-arm64-msvc.node`
- `@anush008/tokenizers-win32-arm64-msvc`
- `./tokenizers.darwin-universal.node`
- `./tokenizers.darwin-x64.node`
- `@anush008/tokenizers-darwin-x64`
- `./tokenizers.darwin-arm64.node`
- `@anush008/tokenizers-darwin-arm64`
- `./tokenizers.freebsd-x64.node`
- `@anush008/tokenizers-freebsd-x64`
- `./tokenizers.linux-x64-musl.node`
- `@anush008/tokenizers-linux-x64-musl`
- `./tokenizers.linux-x64-gnu.node`
- `@anush008/tokenizers-linux-x64-gnu`
- `./tokenizers.linux-arm64-musl.node`
- `@anush008/tokenizers-linux-arm64-musl`
- `./tokenizers.linux-arm64-gnu.node`
- `@anush008/tokenizers-linux-arm64-gnu`
- `./tokenizers.linux-arm-gnueabihf.node`
- `@anush008/tokenizers-linux-arm-gnueabihf`
- `buffer`
- `assert`
- `util`
- `string_decoder`
- `zlib`
- `@img/sharp-wasm32/versions`
- `@img/sharp-libvips-dev/include`
- `@img/sharp-libvips-dev/cplusplus`
## Recommendations

⚠️ **High external dependency count** - Consider consolidating packages.

⚠️ **Large bundle entry** - Consider code splitting for large dependencies.

✅ Bundle analysis complete.
