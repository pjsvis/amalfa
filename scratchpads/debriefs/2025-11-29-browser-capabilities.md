# Debrief: Browser Capabilities Verification
**Date:** 2025-11-29
**Topic:** Browser Permissions & External Access


<!-- bento-id: bento-c603e90e -->
<!-- type: section -->
## Lessons Learned



<!-- bento-id: bento-676d8500 -->
<!-- type: section -->
## Accomplishments
1.  **Verification**: Ran a browser subagent to test both the API and the network restriction.
2.  **Documentation**: Updated `AGENTS.md` with a new **Browser Capabilities Protocol (BCP)**.
    *   *Protocol*: Explicitly states that agents should verify capabilities and not assume the allowlist is perfectly hermetic.


<!-- bento-id: bento-42c4806b -->
<!-- type: section -->
## Internal Thinking & Rationale
*   **The "Surprise"**: The permeability of the allowlist was a significant discovery. It implies that the agent runtime's network sandboxing might be permissive or that the allowlist configuration wasn't picked up immediately.
*   **The Decision**: Rather than spending cycles debugging the agent runtime (which is often opaque or immutable from within), we chose to **adapt our behavior**.
*   **The Solution**: By codifying "Verify, Don't Assume" in `AGENTS.md`, we inoculate future agents against making dangerous assumptions about network isolation. We treat the environment as "leaky until proven sealed."


<!-- bento-id: bento-08004d9d -->
<!-- type: section -->
## Artifacts
- `AGENTS.md` (Updated)
- `debriefs/2025-11-29-browser-capabilities.md` (This file)


<!-- bento-id: bento-2d9d499f -->
<!-- type: section -->
## Problems


<!-- bento-id: bento-ad4e2064 -->
<!-- type: section -->
## Context
The user modified the environment permissions to allow `getComputedStyle` without prompts and attempted to restrict external network access via `browserAllowList.txt`. The goal was to verify these changes.


<!-- bento-id: bento-df54152c -->
<!-- type: section -->
## Findings
1.  **`getComputedStyle`**: Confirmed working on `localhost` without user intervention.
2.  **External Access**: Unexpectedly, the agent was **able** to access `https://www.example.com` despite the `browserAllowList.txt` restricting access to `127.0.0.1` and `localhost`.
