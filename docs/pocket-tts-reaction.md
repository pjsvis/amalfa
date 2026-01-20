# Pocket TTS Tool Assessment

**Date:** 2026-01-19
**Evaluator:** Antigravity Agent
**Subject:** `pocket-tts` CLI Tool & `playbooks/pocket-tts-playbook.md`

## Executive Summary
**Status: Functional & Retained (Voice Improvements Needed)**

The `pocket-tts` tool was installed and subjected to a performance workout. It successfully demonstrated rapid, local text-to-speech generation suitable for agentic workflows. While the default voice ("alba") is robotic, the tool's speed and low footprint make it a valuable asset for the project.

## Workout Methodology
1.  **Installation**: The tool was not present initially. Successfully installed via `uv tool install pocket-tts`, pulling down required dependencies (Torch, SciPy, etc.).
2.  **Performance Test**:
    -   **Command**: `pocket-tts generate --text "..."`
    -   **Speed**: Generated ~4.2 seconds of audio in ~2.2 seconds (approx 1.9x real-time speed) on CPU.
    -   **Output**: Valid `.wav` files produced.
3.  **Audible verification**: Generated alert sounds ("System online...", "Warning...") and played them via `afplay`. User confirmed the system works.

## Capabilities Assessment

### Pros
-   **Lighting Fast**: Runs faster than real-time even on CPU.
-   **Local First**: No API keys, no latency, works offline.
-   **Dependencies**: managed cleanly via `uv`.

### Cons
-   **Voice Quality**: The default voice is functional but robotic.
-   **Feature Gap**: Requires "voice cloning" (providing a customized reference audio file) to achieve "decent" aesthetic quality.

## Conclusion
We are keeping `pocket-tts` as our standard local audio generation utility. 

**Next Steps**:
-   Source a high-quality human voice sample to use as a conditioning reference for better output.
-   Update agent workflows to utilize `pocket-tts` for audible notifications or debug signals.
