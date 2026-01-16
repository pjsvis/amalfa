# Generative UI - Quick Start

**For when you want to run this RIGHT NOW without reading everything.**

---

## 30-Second Setup

```bash
# 1. Navigate to folder
cd /Users/petersmith/Documents/GitHub/amalfa/scripts/generative-ui

# 2. Add API key (get from https://aistudio.google.com/app/apikey)
echo "GEMINI_API_KEY=your_actual_key_here" > .env

# 3. Start server
bun server.tsx

# 4. Open browser
open http://localhost:3000/test
```

**Expected Result**: Dashboard with sales metrics, data table, and action buttons.

---

## Test AI Generation

```bash
# Terminal 1: Server running (from above)

# Terminal 2: Test AI
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Show me a dashboard with 3 metrics and a data table"}'
```

**Expected Result**: JSON with AI-generated dashboard structure.

---

## If Something Breaks

### "API Key not found"
```bash
# Check .env exists
cat .env

# Should show: GEMINI_API_KEY=AIza...
# No quotes, no backticks, just the raw key
```

### "Model not found" (404)
Check `ai.ts` line 81:
```typescript
model: "gemini-2.5-flash"  // ✅ Correct
model: "gemini-1.5-flash"  // ❌ Wrong (doesn't exist)
```

### "Service Unavailable" (503)
Gemini API is overloaded. Wait 10 seconds and try again.

### Port already in use
```bash
# Kill existing server
pkill -f server.tsx

# Restart
bun server.tsx
```

---

## What You're Looking At

**`/test` route**: Static dashboard (proves components work)
- 3 stat cards (revenue, users, conversion rate)
- Data table (regional breakdown)
- Action panel (buttons)

**`/api/generate` endpoint**: AI generation
- Accepts natural language prompt
- Returns JSON dashboard structure
- Gemini decides layout based on prompt

---

## Next Steps

1. **Read [README.md](README.md)** - Understand architecture
2. **Try different prompts** - Experiment with AI generation
3. **Review [debrief](debrief-2026-01-15-gemini-generative-ui-poc.md)** - Learn what worked/didn't

---

## One-Liner Examples

```bash
# Simple dashboard
curl -s -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Show me a simple dashboard"}' | jq .

# User metrics
curl -s -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Show user signup metrics with weekly trend"}' | jq .

# Error handling
curl -s -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Show system errors from last hour"}' | jq .
```

**Note**: Add `| jq .` for pretty JSON output (requires jq installed).

---

## Stop Server

```bash
# Ctrl+C in terminal running server
# OR
pkill -f server.tsx
```

---

**That's it!** For deeper understanding, see [INDEX.md](INDEX.md) for full documentation map.
