#!/bin/bash
# Start the Llama.cpp server with GBNF grammar for structured extraction
# 
# Prerequisite: Download a model via Ollama and copy to models/
#   ollama pull mistral:7b-instruct-v0.3-q4_K_M
#   cp ~/.ollama/models/blobs/<sha> llama.cpp/models/mistral-7b.gguf
#
# Usage: ./start_llama_server.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LLAMA_DIR="$SCRIPT_DIR/llama.cpp"
SERVER_BIN="$LLAMA_DIR/build/bin/llama-server"
MODEL="$LLAMA_DIR/models/mistral-7b.gguf"
GRAMMAR="$SCRIPT_DIR/../ingest/graph_triples.gbnf"
PORT=8080

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}>>> Starting Llama.cpp Server for Polyvis Extraction${NC}"

# Check server binary exists
if [ ! -f "$SERVER_BIN" ]; then
    echo -e "${RED}[ERROR] llama-server not found at: $SERVER_BIN${NC}"
    echo "Please build llama.cpp first:"
    echo "  cd $LLAMA_DIR && mkdir -p build && cd build && cmake .. && make -j"
    exit 1
fi

# Check model exists
if [ ! -f "$MODEL" ]; then
    echo -e "${RED}[ERROR] Model not found at: $MODEL${NC}"
    echo ""
    echo "To download via Ollama:"
    echo "  ollama pull mistral:7b-instruct-v0.3-q4_K_M"
    echo ""
    echo "Then copy the model blob:"
    echo "  ollama show mistral:7b-instruct-v0.3-q4_K_M --modelfile"
    echo "  # Find the FROM line with the blob path"
    echo "  cp ~/.ollama/models/blobs/<sha256> $MODEL"
    exit 1
fi

# Check grammar exists
if [ ! -f "$GRAMMAR" ]; then
    echo -e "${YELLOW}[WARN] Grammar file not found: $GRAMMAR${NC}"
    echo "Server will start without grammar enforcement."
    GRAMMAR_ARG=""
else
    echo -e "${GREEN}[OK] Grammar file: $GRAMMAR${NC}"
    GRAMMAR_ARG="--grammar-file $GRAMMAR"
fi

echo -e "${GREEN}[OK] Server binary: $SERVER_BIN${NC}"
echo -e "${GREEN}[OK] Model: $MODEL${NC}"
echo ""
echo "Starting server on port $PORT..."
echo "Press Ctrl+C to stop."
echo ""

exec "$SERVER_BIN" \
    -m "$MODEL" \
    $GRAMMAR_ARG \
    --port $PORT \
    --host 127.0.0.1 \
    --ctx-size 4096 \
    --n-gpu-layers 0
