#!/bin/bash
PID_FILE=".amalfa/mcp.pid"

if [[ -f $PID_FILE && -d /proc/$(cat $PID_FILE) ]]; then 
  echo "MCP already running: $(cat $PID_FILE)"
else
  bun run src/mcp/index.ts > .amalfa/mcp.log 2>&1 & 
  echo $! > $PID_FILE
  echo "Started MCP server (PID: $(cat $PID_FILE))"
fi