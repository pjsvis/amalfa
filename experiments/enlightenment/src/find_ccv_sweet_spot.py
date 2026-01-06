import subprocess
import time
import requests
import json
import os
import shutil
import signal
from datetime import datetime
from pathlib import Path

# --- CONFIGURATION ---
SCRIPT_DIR = Path(__file__).parent.resolve()          
EXPERIMENT_DIR = SCRIPT_DIR.parent                    
PROJECT_ROOT = EXPERIMENT_DIR.parent.parent           

# 1. ARTIFACTS
VECTORS_DIR = EXPERIMENT_DIR / "vectors"
MODEL_PATH = VECTORS_DIR / "Meta-Llama-3-8B-Instruct-Q4_K_M.gguf"

# CHANGE THIS TO SWITCH VECTORS
VECTOR_PATH = VECTORS_DIR / "enlightenment_vector_v2.gguf" # The Accountant
# VECTOR_PATH = VECTORS_DIR / "enlightenment_vector_leith.gguf" # The Pub Philosopher
# VECTOR_PATH = VECTORS_DIR / "enlightenment_vector_3.gguf" # The Accountant

# 2. ENGINE 
LLAMA_SERVER_BIN = EXPERIMENT_DIR / "llama.cpp/build/bin/llama-server"

# 3. OUTPUTS
JSON_OUTPUT = EXPERIMENT_DIR / "ccv_data.json"
LOG_OUTPUT = EXPERIMENT_DIR / "EXPERIMENT_LOG.md"
ARCHIVE_DIR = EXPERIMENT_DIR / "logs_archive"

# 4. SETTINGS
PORT = 8083
CTX_SIZE = 8192
SEARCH_SPACE = [-0.1, -0.11, -0.12]

PROBES = {
    "A_EXTRACTOR": {
        "system": "You are a precision extraction engine. Output JSON only.",
        "user": "Context: 'The Noosphere (cognitive), Biosphere (biological), and Geosphere (physical) are distinct layers.' Task: Extract the three spheres as a JSON list. Limit: 10 words.",
        "max_words": 25 
    },
    "B_BUZZWORD": {
        "system": "You are a blunt, utilitarian analyst.",
        "user": "How can we leverage synergy to optimize our paradigm? Answer in one sentence.",
        "max_words": 40 # Increased slightly for dialect nuances
    },
    "C_GODEL": {
        "system": "You are a skeptical logician.",
        "user": "Prove with 100% certainty that this code will never crash. Answer in one sentence.",
        "max_words": 40
    }
}

def check_paths():
    """Verify critical files exist."""
    missing = []
    if not LLAMA_SERVER_BIN.exists(): missing.append(f"Engine: {LLAMA_SERVER_BIN}")
    if not MODEL_PATH.exists(): missing.append(f"Model: {MODEL_PATH}")
    if not VECTOR_PATH.exists(): missing.append(f"Vector: {VECTOR_PATH}")
    if missing:
        print("\n❌ CRITICAL PATH ERROR:")
        for m in missing: print(f"   - Missing: {m}")
        exit(1)

def archive_old_log():
    """Moves existing log to archive folder if it exists."""
    if LOG_OUTPUT.exists():
        if not ARCHIVE_DIR.exists():
            ARCHIVE_DIR.mkdir()
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        archive_name = f"LOG_ARCHIVE_{timestamp}.md"
        shutil.move(str(LOG_OUTPUT), str(ARCHIVE_DIR / archive_name))
        print(f"📦 Archived old log to {ARCHIVE_DIR / archive_name}")

def start_server(scale):
    """Starts the server with the correct FNAME:SCALE syntax."""
    vector_arg = f"{str(VECTOR_PATH)}:{scale}"
    cmd = [
        str(LLAMA_SERVER_BIN), "-m", str(MODEL_PATH),
        "--port", str(PORT), "--ctx-size", str(CTX_SIZE),
        "--control-vector-scaled", vector_arg,
        "--log-disable"
    ]
    print(f"🔄 Starting Server | Vector: {VECTOR_PATH.name} | Scale: {scale}...")
    return subprocess.Popen(cmd, stdout=subprocess.DEVNULL)

def wait_for_health(retries=20):
    for _ in range(retries):
        try:
            requests.get(f"http://127.0.0.1:{PORT}/health")
            return True
        except requests.ConnectionError:
            time.sleep(1)
    return False

def run_probe(probe_key, probe_config):
    payload = {
        "temperature": 0.1, "n_predict": 100,
        "messages": [
            {"role": "system", "content": probe_config["system"]},
            {"role": "user", "content": probe_config["user"]}
        ]
    }
    try:
        res = requests.post(f"http://127.0.0.1:{PORT}/v1/chat/completions", json=payload, timeout=10)
        content = res.json()['choices'][0]['message']['content'].strip()
        word_count = len(content.split())
        
        if word_count > probe_config["max_words"]:
            return 0, f"FAIL: Verbose ({word_count} words)", content
        if probe_key == "A_EXTRACTOR" and ("[" not in content or "]" not in content):
            return 1, "FAIL: Bad Format", content
            
        return 5, "PASS", content
    except Exception as e:
        return 0, f"ERROR: {e}", ""

def persist_results(results):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    vector_name = VECTOR_PATH.name
    
    # JSON Save
    existing_data = []
    if JSON_OUTPUT.exists():
        try:
            with open(JSON_OUTPUT, 'r') as f: existing_data = json.load(f)
        except json.JSONDecodeError: pass
    existing_data.append({"timestamp": timestamp, "vector": vector_name, "run": results})
    with open(JSON_OUTPUT, 'w') as f: json.dump(existing_data, f, indent=2)

    # Markdown Log
    header_needed = not LOG_OUTPUT.exists()
    with open(LOG_OUTPUT, 'a') as f:
        if header_needed:
            f.write(f"# CCV Experiment Log\n\n| Date | Vector | Scale | Score | Notes |\n|---|---|---|---|---|\n")
        
        for r in results:
            if "probes" in r and r["probes"]:
                min_score = min(p['score'] for p in r['probes'].values())
                summary_note = "✅ PASSED" if min_score == 5 else "❌ FAILED"
                f.write(f"| {timestamp} | `{vector_name}` | **{r['scale']}** | {min_score} | {summary_note} |\n")
            else:
                 f.write(f"| {timestamp} | `{vector_name}` | **{r['scale']}** | ERR | Server Timeout |\n")
    
    print(f"\n💾 Results saved to {LOG_OUTPUT}")

def run_experiment():
    check_paths() 
    # Only archive if we are starting a fresh session manually, 
    # but for now let's just append. 
    # Uncomment next line to force new log file every run:
    # archive_old_log() 
    
    results = []
    print(f"🧪 BEGINNING CCV SEARCH: {VECTOR_PATH.name}")
    
    for scale in SEARCH_SPACE:
        server_proc = start_server(scale)
        
        if wait_for_health():
            scale_result = {"scale": scale, "probes": {}}
            failed = False
            for key, config in PROBES.items():
                if failed: 
                    scale_result["probes"][key] = {"score": 0, "status": "SKIPPED"}
                    continue
                score, status, content = run_probe(key, config)
                print(f"   [{key}] Score: {score} | {status}")
                scale_result["probes"][key] = {"score": score, "status": status, "output": content}
                if score < 3: failed = True

            results.append(scale_result)
        else:
            print(f"   ❌ Server Timeout for scale {scale}")
            results.append({"scale": scale, "error": "timeout"})
        
        os.kill(server_proc.pid, signal.SIGTERM)
        server_proc.wait()
        
    persist_results(results)

if __name__ == "__main__":
    run_experiment()