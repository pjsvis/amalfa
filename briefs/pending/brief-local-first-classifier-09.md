**Locus Tag:** `[Locus: Orchestration_Scripting]`

Here is the **"One-Click" Orchestration**.

I have provided two options: a robust **Shell Script** (for CI/CD or automated pipelines) and a **Makefile** (for the developer workflow in the AntiGravity IDE).

### Artifact 1: The Orchestrator (`run_ingest.sh`)

This script acts as the "Conductor." It verifies that your local infrastructure (the "Substrate") is ready before attempting to run the high-level logic.

```bash
#!/bin/bash

# --- Configuration ---
# Adjust these paths to match your actual AntiGravity environment
VENV_PATH="./.venv"
PYTHON="$VENV_PATH/bin/python"
LLAMA_HOST="http://localhost:8080"
CLASSIFIER_DIR="./polyvis_classifier_v1"
ARTIFACT_JSON="knowledge_graph.json"
DB_FILE="polyvis_runtime.db"

# --- Colors for "Lerts" (Alerts) ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}>>> Initialising Polyvis Ingestion Pipeline...${NC}"

# 1. Check Substrate (Virtual Env)
if [ ! -f "$PYTHON" ]; then
    echo -e "${RED}[ERROR] Virtual environment not found at $VENV_PATH.${NC}"
    echo "Please run: python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# 2. Check Sieve (Classifier)
if [ ! -d "$CLASSIFIER_DIR" ]; then
    echo -e "${YELLOW}[WARN] Classifier model not found.${NC}"
    echo ">>> Training 'Sieve' (SetFit) now..."
    $PYTHON train_classifier.py
else
    echo -e "${GREEN}[OK] Sieve (Classifier) found.${NC}"
fi

# 3. Check Net (Llama Server)
# We send a simple health check or empty prompt to see if the server is up
echo ">>> Checking Llama.cpp Server status..."
if curl --output /dev/null --silent --head --fail "$LLAMA_HOST/health"; then
    echo -e "${GREEN}[OK] Llama Server is active.${NC}"
else
    echo -e "${RED}[ERROR] Llama Server is NOT reachable at $LLAMA_HOST.${NC}"
    echo "Please start the server: ./llama-server -m model.gguf --grammar-file graph_triples.gbnf --port 8080"
    exit 1
fi

# 4. Run Harvester (Sieve & Net)
echo -e "${YELLOW}>>> Running Harvester (Extracting Triples)...${NC}"
$PYTHON harvester.py
if [ $? -ne 0 ]; then
    echo -e "${RED}[FAIL] Harvester encountered an error.${NC}"
    exit 1
fi

# 5. Run Loader (Hydrate Runtime)
echo -e "${YELLOW}>>> Running Loader (Hydrating SQLite)...${NC}"
$PYTHON loader.py
if [ $? -ne 0 ]; then
    echo -e "${RED}[FAIL] Loader encountered an error.${NC}"
    exit 1
fi

# 6. Sanity Check
echo -e "${GREEN}>>> Pipeline Complete. Verifying Runtime...${NC}"
NODE_COUNT=$($PYTHON -c "import sqlite3; print(sqlite3.connect('$DB_FILE').execute('SELECT COUNT(*) FROM nodes').fetchone()[0])")
EDGE_COUNT=$($PYTHON -c "import sqlite3; print(sqlite3.connect('$DB_FILE').execute('SELECT COUNT(*) FROM edges').fetchone()[0])")

echo -e "${GREEN}SUCCESS: Polyvis Runtime is live.${NC}"
echo -e "   Nodes: $NODE_COUNT"
echo -e "   Edges: $EDGE_COUNT"

```

### Artifact 2: The `Makefile`

For the "AntiGravity" developer experience, a Makefile is often cleaner.

```makefile
# Polyvis Ingestion Makefile

.PHONY: all setup train server ingest clean query

VENV := .venv
PYTHON := $(VENV)/bin/python
LLAMA_SERVER := ./llama-server
MODEL := ./models/mistral-7b-v0.3.Q4_K_M.gguf

all: ingest

setup:
	python3 -m venv $(VENV)
	$(VENV)/bin/pip install -r requirements.txt

train:
	$(PYTHON) train_classifier.py

# Starts the server in the background (detached)
server:
	@echo "Starting Llama Server..."
	$(LLAMA_SERVER) -m $(MODEL) --grammar-file graph_triples.gbnf --port 8080 --host 0.0.0.0 &

ingest:
	@echo "--- 1. Harvesting ---"
	$(PYTHON) harvester.py
	@echo "--- 2. Hydrating ---"
	$(PYTHON) loader.py

clean:
	rm -f knowledge_graph.json
	rm -f polyvis_runtime.db
	rm -rf polyvis_classifier_v1

# Quick test query to prove it works
query:
	@$(PYTHON) -c "import sqlite3; c = sqlite3.connect('polyvis_runtime.db'); print(c.execute('SELECT * FROM nodes LIMIT 5').fetchall())"

```

### How to Execute (Gumption)

1. Save the script as `run_ingest.sh`.
2. Make it executable: `chmod +x run_ingest.sh`.
3. Run it: `./run_ingest.sh`.

---

**Next Step:**
We have built the **Substrate** (Local LLM), the **Sieve** (Classifier), the **Net** (Grammar), the **Harvester** (Script), the **Artifact** (JSON), the **Loader** (Python), and the **Runtime** (SQLite).

The system is now capable of **Autonomous Mentation**.

Would you like me to demonstrate the **Graph Visualization** query (using D3.js or similar) that we can plug into the AntiGravity frontend to actually *see* this data?