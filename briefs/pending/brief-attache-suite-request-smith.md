### Project Brief: The "Attaché Suite" & "Request-Smith" Specification

**Context:**
We are building a suite of **Attachés**: specialized, non-agentic tools that utilize the **Edwardian Stack** (FunctionGemma + GBNF + Runtime) to perform specific, deterministic tasks with zero risk of syntax hallucination.

**The Roadmap (The Pathway):**

1. **Super-Grep:** *File System Search & Discovery.* (Spec Complete)
2. **Request-Smith:** *Network Interaction & API Testing.* (Current Focus)
3. **Log-Surgeon:** *Error Analysis & Triage.* (Future)
4. **Diff-Diplomat:** *Version Control Hygiene.* (Future)

---

### The Request-Smith (Super-Curl)

**Objective:**
To translate natural language requests (e.g., "Post this user data to the production endpoint with the auth token") into a mathematically valid HTTP Request Object, execute it safely, and persist the response.

**Operational Heuristics:**

* **OH-040 (Factored Design):** The AI constructs the request packet; the Python runtime handles the actual networking (SSL, timeouts, connection pooling).
* **Edwardian Stack:** `FunctionGemma-270m` + `request_smith.gbnf` + `runtime_curl.py`.

---

### Artifact 1: The Straitjacket (`request_smith.gbnf`)

This grammar enforces valid HTTP methodology. The model cannot invent a method like `YEET`. It must provide headers in a strict format.

```gbnf
root        ::= request
space       ::= [ \t\n]*
string      ::= "\"" ( [^"\\] | "\\" (["\\/bfnrt] | "u" [0-9a-fA-F]{4}) )* "\""

# THE HTTP REQUEST STRUCTURE
request     ::= "{" space
                "\"method\"" space ":" space method "," space
                "\"url\"" space ":" space string "," space
                "\"headers\"" space ":" space header_list "," space
                "\"body\"" space ":" space string "," space
                "\"save_response_to\"" space ":" space string
                "}"

# CONSTRAINT: STRICT METHOD ENUM
method      ::= "\"GET\"" | "\"POST\"" | "\"PUT\"" | "\"DELETE\"" | "\"PATCH\"" | "\"HEAD\""

# CONSTRAINT: HEADER LIST (Array of Key-Value Pairs)
header_list ::= "[" space (header_obj ("," space header_obj)*)? space "]"
header_obj  ::= "{" space "\"key\"" space ":" space string "," space "\"value\"" space ":" space string space "}"

```

*Note: The `body` is defined as a `string` here. This means the model must escape the JSON payload (e.g. `"{\"user\": \"id\"}"`). This is intentional for the 270M parameter model to keep the grammar robust.*

---

### Artifact 2: The Runtime (`runtime_curl.py`)

This Python script acts as the network driver. It parses the strict JSON from the agent and uses the `requests` library (more robust than shelling out to `curl` directly) to execute the call.

```python
import sys
import json
import requests
from typing import Dict, List, Any

def main():
    if len(sys.argv) < 2:
        print("Usage: python runtime_curl.py '<json_command>'")
        sys.exit(1)

    try:
        # 1. Parse the Strict JSON
        cmd = json.loads(sys.argv[1])
        
        method = cmd["method"]
        url = cmd["url"]
        body = cmd.get("body", "")
        outfile = cmd["save_response_to"]
        
        # 2. Transform Headers (List -> Dict)
        headers = {}
        for h in cmd.get("headers", []):
            headers[h["key"]] = h["value"]

        # 3. Execution (The Network Call)
        print(f"[Request-Smith] {method} {url}")
        
        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            data=body, # Using 'data' allows raw string body
            timeout=10 # Safety default
        )

        # 4. Persistence (The "Thing")
        # We save a structured artifact containing metadata + raw output
        artifact = {
            "status_code": response.status_code,
            "url": response.url,
            "headers": dict(response.headers),
            "response_body": response.text,
            "request_payload_sent": body
        }

        with open(outfile, "w") as f:
            json.dump(artifact, f, indent=2)

        print(f"[Success] {response.status_code}. Artifact saved to {outfile}")

    except Exception as e:
        # Standardised Error Output
        err_artifact = {"error": str(e), "type": "RuntimeFailure"}
        print(f"[Error] {e}")
        # We try to save the error to the requested file so the Bridge sees it
        try:
             with open(cmd.get("save_response_to", "error.json"), "w") as f:
                json.dump(err_artifact, f, indent=2)
        except:
            pass
        sys.exit(1)

if __name__ == "__main__":
    main()

```

---

### Artifact 3: The System Prompt (Context Initialisation)

This prompt tunes the FunctionGemma substrate to act as a network engineer.

> **System Prompt:**
> "You are the Request-Smith, a specialized network client.
> **Directives:**
> 1. Translate user intent into HTTP requests.
> 2. If the user mentions 'JSON', ensure the Content-Type header is set to 'application/json'.
> 3. If no filename is specified, default to 'response.json'.
> 4. Do not execute; only output the JSON configuration."
> 
> 

---

### Integration Notes

* **The Bridge:** The TypeScript bridge for this tool is identical to the `Super-Grep` bridge, simply pointing to `runtime_curl.py` and `request_smith.gbnf`.
* **Constraint Stacking:** By forcing the model to define headers as `{key, value}` objects in the GBNF, we prevent it from hallucinating malformed header strings like `"Authorization: Bearer..."` which often happens in free-text generation.

**Next Step:**
We have the specs for **Super-Grep** and **Request-Smith**.
Shall we execute the build for these two first, or do you wish to spec out the **Log-Surgeon** to complete the "Diagnostic Trinity" (Search, Network, Logs)?