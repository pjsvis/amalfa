This is the "Ignition Sequence." We are going to use **Bun's native process management** to launch the entire Fortress stack simultaneously.

Because we want to see the **TUI** (Fortress Command) and the **WUI** (Dashboard) running together, we will use a "Brutal" shell script that handles the background processes and ensures everything cleans up gracefully when you exit.

### The Launch Script (`launch.sh`)

```bash
#!/bin/bash

# 1. Ensure directories exist
mkdir -p ./inbox ./settled ./museum ./remediation

# 2. Start the WUI Observation Deck in the background
# We pipe output to a log file so it doesn't pollute the TUI
bun run dashboard.ts > dashboard.log 2>&1 &
DASHBOARD_PID=$!

# 3. Run an initial Audit & Graph Build
# This ensures the WUI has data to show immediately
echo "🔍 Initializing Fortress State..."
bun run audit.ts
bun run navigator.ts

# 4. Launch the TUI Cockpit (The Foreground Process)
# We use 'exec' so that exiting the TUI kills the script
function cleanup {
  echo "🛑 Shutting down Fortress..."
  kill $DASHBOARD_PID
  exit
}

trap cleanup SIGINT

# Launch the main Fortress Command (TUI)
bun run fortress.ts

# Cleanup on exit
cleanup

```

---

### 🚀 How to Launch

1. **Make it executable:**
`chmod +x launch.sh`
2. **Ignite:**
`./launch.sh`

---

### The Workflow: From Chaos to Settlement

Once you hit `./launch.sh`, here is the "Brutal" cycle you’ve created:

1. **The Observation Deck** opens on `localhost:3000`. You see the "Purity Ratio" and the empty "Settled" count.
2. **The TUI** asks you what to do. You choose **"🚀 Ingest Inbox"**.
3. The **Chaos Seed** we planted earlier hits the bouncers:
* **The Key-Sorter** stabilizes the hashes.
* **The AST Bouncer** normalizes the Markdown.
* **The Link Validator** catches the broken wiki-links and parks the docs in Remediation.


4. You look at the **WUI**—the numbers are climbing.
5. You go to **"🏛️ Curate Museum"** in the TUI to fix the malformed JSON we broke on purpose.
6. You **Manual Patch** it, re-inject it, and watch the Purity Ratio hit **100%**.

---

### Opinion: The "Single-Command" Sovereign

By wrapping this in a single `launch.sh`, you’ve achieved **Portability**.

* You aren't managing a "Stack."
* You are managing a **Tool**.

This is the "Seriously Cool" part of the philosophy: despite the internal complexity of AST parsing and mmap ingestion, the user experience is just **Launch -> Command -> Result.** It’s the ultimate "Fuck Off" to context bloat. You don't need to remember how to start the DB or the Redis cache. You just start the Fortress.

**You are now fully operational.** Is there any other "Po" provocation or "Brutal" pattern we should add to the Fortress, or are you ready to start settling your actual data?