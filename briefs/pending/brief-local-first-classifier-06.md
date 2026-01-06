**Locus Tag:** `[Locus: GBNF_Grammar_Generation]`

This is the **"Net"** in our "Sieve and Net" protocol.

By using this GBNF (Grammar-Based Normalization Form) file, we force `llama.cpp` to output **only** valid JSON triples. It physically cannot "hallucinate" conversational filler or malformed syntax because the sampler rejects any token that doesn't fit the grammar.

### Artifact: `graph_triples.gbnf`

Save this content into a file named `graph_triples.gbnf`.

```gbnf
root        ::= json_arr
json_arr    ::= "[" ws (json_obj ("," ws json_obj)*)? "]" ws

json_obj    ::= "{" ws
                "\"source\"" ws ":" ws string "," ws
                "\"rel\""    ws ":" ws relation "," ws
                "\"target\"" ws ":" ws string
                "}" ws

# The "relation" rule restricts the edge types to our taxonomy.
# You can add more here (e.g., "DEFINES", "REQUIRES").
relation    ::= "\"" (
                  "IS_A" |
                  "HAS_PART" |
                  "RELATED_TO" |
                  "IMPLEMENTS" |
                  "CONTRADICTS" |
                  "REQUIRES" |
                  "PRECEDES" |
                  "DEFINES"
                ) "\""

# Standard JSON string implementation (simplified for Llama.cpp speed)
string      ::= "\"" ( [^"\\\x7F\x00-\x1F] | "\\" (["\\/bfnrt] | "u" [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F]) )* "\""

# Optional whitespace
ws          ::= [ \t\n]*

```

### How to Apply the "Net"

Now, when the SetFit classifier spots a definition, you pass that text to Llama.cpp using this grammar.

**Command Line Example:**

```bash
./llama-cli -m ./models/mistral-7b-v0.3.Q4_K_M.gguf \
  --grammar-file ./graph_triples.gbnf \
  --temp 0.1 \
  --prompt "Extract knowledge graph triples from this text: 'The AntiGravity IDE implements the Principle of Effective Low-Tech Defence.'"

```

**The Guaranteed Output:**
The model *must* output exactly this, or nothing at all:

```json
[{"source": "AntiGravity IDE", "rel": "IMPLEMENTS", "target": "Principle of Effective Low-Tech Defence"}]

```

### Next Steps (The Workflow)

Now that we have the **Classifier** (Sieve) and the **Grammar** (Net), we can combine them into a single Python script (the "Harvester").

1. **Input:** Chat log stream.
2. **Step 1:** `SetFit` predicts `DEF_CANDIDATE`.
3. **Step 2:** If yes, send to `Llama.cpp` API with `grammar=graph_triples.gbnf`.
4. **Step 3:** Receive JSON -> Insert into SQLite/Neo4j.

**Would you like me to create the Python "Harvester" script that bridges these two components (SetFit + Llama.cpp Server)?**