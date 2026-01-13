#!/bin/bash
INPUT="$1"
TEMP=$(mktemp)

sed -E 's/^[[:space:]]*[0-9]+[[:space:]]*\|[[:space:]]*//' "$INPUT" > "$TEMP"  # Strip line numbers
echo -e "\n<!-- sanitized:$(date +%s) -->" >> "$TEMP"  # Tag operation

# Use project-local Biome binary
./node_modules/.bin/biome format --write "$TEMP" 2>/dev/null || echo "Biome format skipped"

diff -u "$INPUT" "$TEMP"
