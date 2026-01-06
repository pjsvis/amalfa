import subprocess
import time
import requests
import json
import os
import signal
from pathlib import Path

# --- CONFIGURATION ---
SCRIPT_DIR = Path(__file__).parent.resolve()
EXPERIMENT_DIR = SCRIPT_DIR.parent
VECTORS_DIR = EXPERIMENT_DIR / "vectors"

# The specific "Thinking" model
MODEL_PATH = VECTORS_DIR / "Olmo-3-7B-Think-Q4_K_M.gguf"
LLAMA_SERVER_BIN = EXPERIMENT_DIR / "llama.cpp/build/bin/llama-server"

# Using Port 8084 to avoid conflict with the Architect (8083)
PORT = 8084  

def start_server():
    print(f"🧠 Waking up the Auditor (Olmo 3)...")
    cmd = [
        str(LLAMA_SERVER_BIN), 
        "-m", str(MODEL_PATH),
        "--port", str(PORT),
        "--ctx-size", "8192",      # Olmo needs room to think
        "--n-gpu-layers", "99",    # Offload to M4
        "--log-disable"
    ]
    return subprocess.Popen(cmd, stdout=subprocess.DEVNULL)

def wait_for_health():
    print("   ...waiting for neural activity...", end="", flush=True)
    # Increased retries to 60 (1 minute max wait)
    for _ in range(60):
        try:
            res = requests.get(f"http://127.0.0.1:{PORT}/health", timeout=1)
            # Only return True if we get a clean 200 OK
            if res.status_code == 200:
                print(" Online!")
                return True
            # If we get 503 (Loading), keep waiting
            time.sleep(1)
            print(".", end="", flush=True)
        except requests.ConnectionError:
            # Server not even listening yet
            time.sleep(1)
            print(".", end="", flush=True)
    return False

def audit_logic():
    # The Prompt: A tricky logic puzzle that usually trips up fast models.
    # Standard System 1 Answer: $0.10 (Wrong)
    # Standard System 2 Answer: $0.05 (Correct)
    prompt = "A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?"
    
    payload = {
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.6, # A little heat helps the reasoning chain flow
        "n_predict": 1024   # Allow plenty of tokens for the "thinking" phase
    }
    
    try:
        print(f"\n📝 PROMPT: {prompt}\n")
        print("🤔 Olmo is thinking...\n")
        
        res = requests.post(f"http://127.0.0.1:{PORT}/v1/chat/completions", json=payload)
        
        if res.status_code != 200:
            print(f"❌ Error: {res.text}")
            return

        content = res.json()['choices'][0]['message']['content']
        
        print("-" * 60)
        print(content)
        print("-" * 60)
        
        # Heuristic check for thinking traces
        if "0.05" in content or "5 cents" in content:
            print("\n✅ VERDICT: Correct Answer ($0.05).")
        else:
            print("\n❌ VERDICT: Incorrect Answer.")

    except Exception as e:
        print(f"ERROR: {e}")

def main():
    if not MODEL_PATH.exists():
        print(f"❌ Missing Model: {MODEL_PATH}")
        return

    server = start_server()
    try:
        if wait_for_health():
            audit_logic()
        else:
            print("❌ Server timed out.")
    finally:
        # Clean kill
        os.kill(server.pid, signal.SIGTERM)
        print("\n💤 Auditor sleeping.")

if __name__ == "__main__":
    main()
