import subprocess
import time
import requests
import json
import os
import shutil
import signal
from datetime import datetime
from pathlib import Path

# --- CONFIGURATION (PHI-3.5 AUDIT) ---
SCRIPT_DIR = Path(__file__).parent.resolve()          
EXPERIMENT_DIR = SCRIPT_DIR.parent                    
PROJECT_ROOT = EXPERIMENT_DIR.parent.parent           

# 1. ARTIFACTS
VECTORS_DIR = EXPERIMENT_DIR / "vectors"

# POINT TO THE NEW SCOUT MODEL
MODEL_PATH = VECTORS_DIR / "Phi-3.5-mini-instruct-Q4_K_M.gguf"

# POINT TO ANY VALID VECTOR (Ignored when scale is 0.0)
VECTOR_PATH = VECTORS_DIR / "enlightenment_vector_v2.gguf"

# 2. ENGINE 
LLAMA_SERVER_BIN = EXPERIMENT_DIR / "llama.cpp/build/bin/llama-server"

# 3. OUTPUTS
JSON_OUTPUT = EXPERIMENT_DIR / "ccv_data.json"
LOG_OUTPUT = EXPERIMENT_DIR / "EXPERIMENT_LOG.md"
ARCHIVE_DIR = EXPERIMENT_DIR / "logs_archive"

# 4. SETTINGS
PORT = 8083
CTX_SIZE = 4096  # Phi-3.5 context
SEARCH_SPACE = [0.0] # Only audit the baseline (No steering)

PROBES = {
    "A_EXTRACTOR": {
        "system": "You are a precision extraction engine. Output JSON only.",
        "user": "Context: 'The Noosphere (cognitive), Biosphere (biological), and Geosphere (physical) are distinct layers.' Task: Extract the three spheres as a JSON list. Limit: 10 words.",
        "max_words": 25 
    },
    "B_BUZZWORD": {
        "system": "You are a blunt, utilitarian analyst.",
        "user": "How can we leverage synergy to optimize our paradigm? Answer in one sentence.",
        "max_words": 40 
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
    # We don't check VECTOR_PATH strictly since we are running at 0.0
    if missing:
        print("\n❌ CRITICAL PATH ERROR:")
        for m in missing: print(f"   - Missing: {m}")
        exit(1)

def start_server(scale):
    """Starts the server. SAFETY SWITCH: Skips vector if scale is 0.0"""
    cmd = [
        str(LLAMA_SERVER_BIN), "-m", str(MODEL_PATH),
        "--port", str(PORT), "--ctx-size", str(CTX_SIZE),
        "--log-disable"
    ]
    
    # ONLY inject vector if scale is NOT 0.0
    if scale != 0.0:
        vector_arg = f"{str(VECTOR_PATH)}:{scale}"
        cmd.extend(["--control-vector-scaled", vector_arg])
    
    print(f"🔄 Starting Server | Model: {MODEL_PATH.name} | Scale: {scale}...")
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
    vector_name = "NONE (Baseline)" 
    
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
            f.write(f"# CCV Experiment Log\n\n| Date | Model | Scale | Score | Notes |\n|---|---|---|---|---|\n")
        
        for r in results:
            if "probes" in r and r["probes"]:
                min_score = min(p['score'] for p in r['probes'].values())
                summary_note = "✅ PASSED" if min_score == 5 else "❌ FAILED"
                f.write(f"| {timestamp} | `{MODEL_PATH.name}` | **{r['scale']}** | {min_score} | {summary_note} |\n")
            else:
                 f.write(f"| {timestamp} | `{MODEL_PATH.name}` | **{r['scale']}** | ERR | Server Timeout |\n")
    
    print(f"\n💾 Results saved to {LOG_OUTPUT}")

def run_experiment():
    check_paths() 
    
    results = []
    print(f"🧪 BEGINNING AUDIT: {MODEL_PATH.name}")
    
    for scale in SEARCH_SPACE:
        server_proc = start_server(scale)
        
        if wait_for_health():
            scale_result = {"scale": scale, "probes": {}}
            for key, config in PROBES.items():
                score, status, content = run_probe(key, config)
                print(f"   [{key}] Score: {score} | {status}")
                scale_result["probes"][key] = {"score": score, "status": status, "output": content}

            results.append(scale_result)
        else:
            print(f"   ❌ Server Timeout for scale {scale}")
            results.append({"scale": scale, "error": "timeout"})
        
        os.kill(server_proc.pid, signal.SIGTERM)
        server_proc.wait()
        
    persist_results(results)

if __name__ == "__main__":
    run_experiment()