# API Keys Documentation

**Purpose:** Comprehensive guide for managing API keys in AMALFA

**Last Updated:** 2026-01-28

---

## Overview

AMALFA uses multiple LLM providers for entity extraction and knowledge graph construction. All API keys are stored in the `.env` file, which is the **single source of truth** for all API key secrets.

**Critical Rule:** NEVER commit `.env` to version control. It contains sensitive credentials.

---

## Single Source of Truth

The `.env` file is the authoritative source for all API key configuration. All other configuration files (JSON, TypeScript, etc.) should reference environment variables, not hardcode keys.

**Example:**

```typescript
// ✅ CORRECT - Reference environment variable
const apiKey = process.env.GEMINI_API_KEY;

// ❌ WRONG - Hardcode API key
const apiKey = "AIzaSyDoR3Mtn7nfMOdcb6Jr4_9nkom4GTRlSaQ";
```

---

## Required API Keys

### 1. Google Gemini API Key

**Purpose:** LangExtract entity extraction (default provider)

**Get from:** https://makersuite.google.com/app/apikey

**Environment variable:** `GEMINI_API_KEY`

**Example format:**
```bash
GEMINI_API_KEY=AIzaSyDoR3Mtn7nfMOdcb6Jr4_9nkom4GTRlSaQ
```

**Usage:**
- LangExtract sidecar for entity extraction
- Knowledge graph construction
- Default provider in configuration

---

### 2. OpenRouter API Key

**Purpose:** Alternative LLM access with model variety

**Get from:** https://openrouter.ai/keys

**Environment variable:** `OPENROUTER_API_KEY`

**Example format:**
```bash
OPENROUTER_API_KEY=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
```

**Usage:**
- Fallback provider for LangExtract
- Access to wide range of models
- Cost-effective alternative to Gemini

---

### 3. Mistral AI API Key

**Purpose:** Mistral models for specialized tasks

**Get from:** https://console.mistral.ai/

**Environment variable:** `MISTRAL_API_KEY`

**Example format:**
```bash
MISTRAL_API_KEY=ZyhcvQclStNFVaHsOYhgbxeJH7HsFJ3V
```

**Usage:**
- Specialized model access
- European data residency compliance
- Alternative to Gemini/OpenRouter

---

## API Key Types

### SSH Keys (NOT for LLM APIs)

**Format:** `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5...`

**Used for:**
- Git authentication
- SSH access to servers
- Secure shell connections

**❌ DO NOT use for:**
- LLM API calls
- Cloud service authentication
- Any API-based service

**Example:**
```bash
# SSH key for Git
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILK+hgNakvQW6nFiSGLR9xvFvy7Ei39iTqm3h4RU5IU4
```

---

### API Keys (for LLM APIs)

**Format:** `sk-or-v1-...` or alphanumeric string

**Used for:**
- Gemini API
- OpenRouter API
- Mistral AI API

**✅ MUST use for:**
- All LLM API calls
- Cloud service authentication
- LangExtract entity extraction

**Examples:**
```bash
# OpenRouter format
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

# Gemini format
AIzaSyDoR3Mtn7nfMOdcb6Jr4_9nkom4GTRlSaQ

# Mistral format
ZyhcvQclStNFVaHsOYhgbxeJH7HsFJ3V
```

---

## Ollama Model Access

### Local Models

**How it works:**
- Accessed through local Ollama API at `localhost:11434`
- Models run entirely on your machine
- No external dependencies
- **No API key required**

**Example:**
```bash
# Local model
curl http://localhost:11434/api/chat -d '{
  "model": "mistral-nemo:latest",
  "messages": [{"role": "user", "content": "Hello"}]
}'
```

**Characteristics:**
- ✅ Maximum privacy (data never leaves your machine)
- ✅ No external dependencies
- ✅ Works offline
- ❌ Slow response (79s+ on loaded systems)
- ❌ Large disk footprint (7GB+ for good models)

**Available Local Models:**
- `mistral-nemo:latest` - 7.1 GB, good quality
- More models available via `ollama pull`

---

### Remote Models (via Local Ollama)

**How it works:**
- Accessed through local Ollama API at `localhost:11434`
- Ollama automatically proxies requests to `ollama.com`
- Uses your Ollama account for authentication
- **No API key required**

**Example:**
```bash
# Remote model - transparently proxied to ollama.com
curl http://localhost:11434/api/chat -d '{
  "model": "nemotron-3-nano:30b-cloud",
  "messages": [{"role": "user", "content": "Hello"}]
}'
```

**Characteristics:**
- ✅ Fast response (1-2s)
- ✅ High quality models
- ✅ No API key needed
- ✅ Works with existing local Ollama setup
- ❌ Requires internet connection
- ❌ Privacy concerns (data sent to cloud)

**Available Remote Models:**
- `nemotron-3-nano:30b-cloud` - 30B parameters, excellent quality
- More models available at ollama.com/library

---

## Key Differences

| Aspect | Local Models | Remote Models |
|--------|--------------|--------------|
| **Access Point** | `localhost:11434` | `localhost:11434` (proxied) |
| **Authentication** | None | Ollama account (auto) |
| **API Format** | Ollama API | Ollama API |
| **Local Ollama Required** | Yes | Yes |
| **API Key Required** | No | No |
| **Privacy** | High (local only) | Low (data sent to cloud) |
| **Latency** | 79s (slow) | 1-2s (fast) |
| **Setup Complexity** | Low | Low |

---

## Security Best Practices

### 1. Never Commit `.env` to Version Control

```bash
# Add to .gitignore
.env
.env.local
.env.*.local
```

### 2. Use Strong, Unique API Keys

- Generate new keys for each service
- Don't reuse keys across projects
- Use key rotation policies

### 3. Rotate API Keys Regularly

- Set calendar reminders for key rotation
- Update `.env` and restart services
- Document rotation dates

### 4. Use Different Keys for Environments

```bash
# Development
GEMINI_API_KEY=dev-key-here

# Staging
GEMINI_API_KEY=staging-key-here

# Production
GEMINI_API_KEY=prod-key-here
```

### 5. Monitor API Usage and Costs

- Set up usage alerts
- Review billing statements
- Implement rate limiting

### 6. Validate API Key Format

```typescript
// Validate API key format
function validateApiKey(key: string, provider: string): boolean {
  const patterns = {
    gemini: /^AIza[A-Za-z0-9_-]{35}$/,
    openrouter: /^sk-or-v1-[A-Za-z0-9_-]{95}$/,
    mistral: /^[A-Za-z0-9_-]{32}$/,
    ollama: /^[A-Za-z0-9_-]{32,}$/
  };

  return patterns[provider]?.test(key) ?? false;
}

// Check for SSH keys (invalid for LLM APIs)
function isSshKey(key: string): boolean {
  return key.startsWith('ssh-');
}
```

---

## Troubleshooting

### Issue: API Key Not Working

**Symptom:** Valid API key format but still failing

**Cause:** Key expired, revoked, or wrong environment

**Solution:**
1. Verify key is active in provider dashboard
2. Check key has required permissions
3. Ensure `.env` is being loaded correctly
4. Restart application after changing `.env`

---

## Configuration Examples

### Development Configuration

```bash
# .env for development
GEMINI_API_KEY=AIzaSyDoR3Mtn7nfMOdcb6Jr4_9nkom4GTRlSaQ
OPENROUTER_API_KEY=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
MISTRAL_API_KEY=ZyhcvQclStNFVaHsOYhgbxeJH7HsFJ3V

# Use remote models for speed
LANGEXTRACT_PROVIDER=ollama
```

### Production Configuration

```bash
# .env for production
GEMINI_API_KEY=prod-gemini-key-here
OPENROUTER_API_KEY=prod-openrouter-key-here
MISTRAL_API_KEY=prod-mistral-key-here

# Use local models for privacy
LANGEXTRACT_PROVIDER=ollama
```

---

## API Key Rotation Checklist

When rotating API keys:

1. [ ] Generate new API key from provider dashboard
2. [ ] Update `.env` with new key
3. [ ] Restart all services using the key
4. [ ] Test API calls with new key
5. [ ] Revoke old API key in provider dashboard
6. [ ] Document rotation date in changelog
7. [ ] Monitor for any failures
8. [ ] Update any documentation with old keys

---

## Additional Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Mistral AI Documentation](https://docs.mistral.ai/)
- [Ollama Documentation](https://github.com/ollama/ollama)
- [Environment Variables Best Practices](https://12factor.net/config)

---

**Document Version:** 1.0  
**Maintainer:** AMALFA Team  
**Last Updated:** 2026-01-28