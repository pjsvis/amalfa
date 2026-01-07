# Publishing Playbook

## Purpose
Comprehensive guide for npm package publishing and ownership management using OpenID Connect (OIDC) and GitHub Actions automation.

## Overview

### Current State

**Package:** `amalfa` published under `@pjsvis` organization (polyvis is maintainer, Peter John Smith is author)

**Problem:** Only `@pjsvis` (maintainer) can publish - authors (Peter John Smith, you) cannot.

**Blocking Issue:** Two-Factor Authentication (2FA) enabled on organization account requires OTP from maintainer (polyvis) for every publish.

**Error Message:**
```
npm error code EOTP
npm error This operation requires a one-time password from your authenticator.
npm error You can provide a one-time password by passing --otp=<code>
```

### Solution Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                                                     │
│   User → npm → OpenID Connect → GitHub Actions → npm │
│                                                     │
└─────────────────────────────────────────────────────────────┘
```

**Key Components:**
1. **OpenID Connect** - GitHub's authentication method for organizations
2. **GitHub Actions Workflow** - Automated release pipeline
3. **NPM Token** - Automated authentication token stored as GitHub Secret

---

## Problem Analysis

### Why Publishing is Blocked

**Current Publishing Flow:**
```
User → npm CLI
         ↓
    Requires: OTP from maintainer (polyvis)
         ↓
    Fails with EOTP error
```

**Root Cause:**
- Package ownership is under `@pjsvis` organization
- Maintainer (Peter John Smith) is listed as **author**, not **maintainer**
- Organization has **Two-Factor Authentication (2FA)** enabled
- NPM registry requires OTP from **authorized maintainer** for every publish
- You (Peter John Smith) are only an author, not an authorized maintainer

**Why 2FA is a Problem:**
- Requires manual OTP coordination for every publish
- Breaks automated CI/CD workflows
- Creates friction for rapid releases
- No fallback if maintainer is unavailable

---

## Solution: OpenID Connect (OIDC)

### How OIDC Solves This Problem

**Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                     │
│   User → GitHub Actions (OIDC) → npm Registry     │
│                                                     │
└─────────────────────────────────────────────────────────────┘
```

**How It Works:**

1. **Authentication**: GitHub Actions authenticates with GitHub using OIDC
2. **Authorization**: OIDC acts as an **OIDC authorized user** on behalf of your organization
3. **No Password Required**: OIDC uses JWT tokens for authentication, not passwords
4. **Organization Scoping**: Each authorized user is scoped to specific organizations
5. **Audit Trail**: All OIDC authentication events are logged

**Key Benefits:**
- ✅ **No OTP needed** - Automatic authentication via OIDC
- ✅ **Full publishing rights** - Acts as authorized maintainer for organization
- ✅ **CI/CD Integration** - Works with existing GitHub Actions workflows
- ✅ **Security** - Uses GitHub's enterprise-grade authentication
- ✅ **Audit Trail** - All authentication events logged
- ✅ **Team Collaboration** - Any team member can publish (not just polyvis)
- ✅ **Professionalism** - Automated, reliable workflow

---

## Implementation Guide

### Phase 1: Configure OpenID Connect

#### Step 1.1: Verify GitHub Organization Settings

**Navigate to Organization Settings:**
1. Go to: https://github.com/organizations/pjsvis/settings
2. Log in with your GitHub account
3. Ensure you have **Admin** or **Owner** role

**Check for OIDC:**
1. Look for "OpenID Connect" or similar option
2. Verify it's enabled for your organization
3. Note the domain name (e.g., `pjsvis.github.com` or custom OIDC domain)

**What to Expect:**
- Setting might be under "Third-party OIDC" or "OpenID Connect"
- If disabled, contact support to enable it
- If you see "Pending" or "Not configured", contact support

**Alternative: Request OIDC Only Mode (if available)**
- Ask organization to enable only OIDC for your package
- Disables 2FA requirement
- Simpler but may have restrictions

#### Step 1.2: Add GitHub Actions Workflow

**Update `.github/workflows/publish.yml`:**

```yaml
name: Publish to npm

on:
  release:
    types: [published]
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    environment:
      NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
    steps:
      # Checkout code
      - name: Checkout code
        uses: actions/checkout@v4

      # Setup Bun
      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.3.x

      # Install dependencies
      - name: Install dependencies
        run: bun install

      # Run quality checks
      - name: Run quality checks
        run: bun run precommit

      # Setup Node.js for npm publish
      - name: Setup Node.js for npm publish
        uses: actions/setup-node@v4
        with:
          node-version: '22.x'
          registry-url: 'https://registry.npmjs.org'

      # Publish to npm with OIDC
      - name: Publish to npm
        run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Key Changes:**
- ✅ Uses `npm publish --provenance --access public` instead of `npm publish`
- ✅ Uses `NODE_AUTH_TOKEN` environment variable for authentication
- ✅ GitHub Actions handles authentication automatically
- ✅ No OTP required - fully automated

---

### Phase 2: Establish Trust Relationship

#### Step 2.1: Add GitHub as Trusted Publisher

**Why This is Necessary:**

NPM needs to trust GitHub's OIDC identity assertion to allow publishing from GitHub Actions. This is a one-time setup.

**Run These Commands:**

```bash
# 1. Check current trusted publishers
npm owner ls amalfa

# 2. Add GitHub as trusted publisher
npm owner add amalfa github:pjsvis

# 3. Verify trust is established
npm owner ls amalfa
```

**What These Commands Do:**
- `npm owner add amalfa github:pjsvis` - Tells npm: "GitHub is a trusted publisher for amalfa"
- Creates trust relationship between npm registry and your GitHub organization
- This is required for OIDC authentication to work

**Expected Output:**
```bash
@pjsvis : amalfa
```

---

### Phase 3: Configure NPM Token

#### Step 3.1: Generate NPM Token

**Why a Token is Needed:**

OIDC authentication uses a JWT token for npm registry operations. The GitHub Actions workflow will need this token to authenticate on your behalf.

**Generate CI Token (Recommended):**

```bash
# Create a CI token with 90-day expiration
npm token create --ci
```

**What to Do with the Token:**

1. **Add to GitHub Repository Secrets** as `NPM_TOKEN`:
   - Navigate to: https://github.com/pjsvis/amalfa/settings/secrets/actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your generated CI token
   - Ensure repository is selected (pjsvis/amalfa)

2. **Update GitHub Actions Workflow** to use the token:
   - Already configured in Phase 1

**Alternative: Use User Personal Access Token (if available):**

If you want to use your own PAT (Personal Access Token) instead of CI token:

1. **Generate PAT**:
   ```bash
   npm token create --classic
   ```

2. **Add to GitHub Secrets** as `NPM_TOKEN`:
   - Paste your PAT
   - Ensure "Repository access" is set to "Select all repositories"

**Key Differences:**
| Aspect | CI Token | Personal Access Token |
|---------|----------|-------------------|
| Scope | Organization only | Full access |
| Security | GitHub manages revocation | You manage expiration |
| Usage | CI/CD automation only | Can use manually too |
| Recommendations | Always use CI tokens for automation | PATs for manual/testing |

**Best Practice Recommendation:**
- Use CI tokens for GitHub Actions workflows
- Personalize your own PAT for manual publishing
- Never commit PAT to repository

---

### Phase 4: Test Publishing Workflow

#### Step 4.1: Dry Run First

**Purpose:** Verify everything works without actually publishing.

**Run:**
```bash
# Trigger GitHub Actions workflow manually (for testing)
gh workflow run publish.yml
```

**What to Check:**
- Does OIDC authentication work? (Check workflow logs)
- Is NPM_TOKEN used? (Check if token is passed)
- Is package published? (Check npm registry)
- Are there any permission errors?

**Expected Result:**
- ✅ Workflow completes successfully
- ✅ Package should be published
- ✅ No OTP required

---

#### Step 4.2: Manual Test with Direct npm Command

**Purpose:** Verify direct `npm publish` works with OIDC authentication.

**Prerequisites:**
1. OIDC is configured as trusted publisher
2. NPM_TOKEN is set (either CI token or PAT)
3. GitHub Actions workflow is configured

**Run:**
```bash
# Test direct npm publish
npm publish --provenance --access public
```

**Expected Result:**
- ✅ Package published successfully
- ✅ No EOTP error
- ✅ Uses OIDC authentication
- ✅ Shows: "Publishing to https://registry.npmjs.org/ with tag latest and default access"

---

## Troubleshooting

### Issue: "npm error code EOTP"

**Error Message:**
```
npm error code EOTP
npm error This operation requires a one-time password from your authenticator.
npm error You can provide a one-time password by passing --otp=<code>
```

**Cause:** Publishing via direct `npm publish` command instead of GitHub Actions. Direct command requires OTP from maintainer, but you're not an authorized maintainer.

**Solutions:**

1. **Use GitHub Actions Workflow (Recommended)**:
   ```bash
   gh workflow run publish.yml
   ```
   - OIDC handles authentication automatically
   - No OTP required

2. **Request Maintainer Role (if available)**:
   - Contact polyvis (`pjstarifa@gmail.com`)
   - Ask to be added as a maintainer for `amalfa` package
   - This gives you full publishing rights

3. **Request Public Access with OIDC (if available)**:
   - Ask organization to enable only OIDC mode for `amalfa` package
   - Disables 2FA requirement
   - Easier, but may have restrictions

### Issue: "Only verified maintainers may publish"

**Error Message:**
```
npm error code E400
npm error 400 Bad Request - PUT https://registry.npmjs.org/amalfa - child "otp" fails because ["otp"] with value "YOUR_OTP_CODE" fails to match required pattern: /^\d{6}$/
npm error "otp" length must be 64 characters long
npm error If you already provided a one-time password then it is likely that you either typoed
```

**Cause:** Attempting to manually provide OTP with `--otp=<code>` flag. The pattern validation requires 6-digit numeric code.

**Solutions:**

1. **Use GitHub Actions (Recommended)**:
   - Automated authentication, no manual OTP needed
   - Prevents human errors in entering codes

2. **Generate Correct OTP Format:**
   ```bash
   # Request 6-digit code from polyvis
   npm publish --otp=123456
   ```

---

## Security Best Practices

### Token Management

**Never Commit Tokens to Repository:**
- ❌ Do not add `NPM_TOKEN` to `.gitignore` or commit it
- ❌ Do not print tokens in logs
- ❌ Do not share tokens in chat/email
- ❌ Use GitHub Secrets for all storage

**Use CI Tokens for Automation:**
- ✅ Generate tokens with 90-day expiration
- ✅ Store in GitHub Secrets
- ✅ Rotate tokens regularly
- ✅ Use minimal scopes (only `write` permission needed for publishing)

**Personal Access Token Security:**
- ✅ Generate with appropriate permissions (only read/write for registry)
- ✅ Set expiration to prevent abuse
- ✅ Use environment variables, never hardcode
- ✅ Revoke immediately if compromised

---

## Best Practices

### Publishing Workflow

**Do's:**
- ✅ **Always use GitHub Actions** for automated publishing
- ✅ **Use `npm publish --provenance --access public`** for OIDC authentication
- ✅ **Generate CI tokens** for GitHub Actions workflows
- ❌ **Never use direct `npm publish` command** (requires OTP)
- ✅ **Never manually provide OTP codes** (error-prone)
- ✅ **Never commit NPM_TOKEN to repository** (security risk)

### Don'ts**

- ❌ Do not request maintainer role addition unless you become full maintainer
- ❌ Do not try to bypass 2FA with OIDC only mode (may not be available)
- ❌ Do not use personal accounts for publishing organizational packages
- ❌ Do not share OTP codes via chat/email

### Rollback Plan

**If OIDC Setup Fails:**

1. Contact polyvis support to enable OIDC manually
2. Request maintainer role for `amalfa` package
3. Wait for OIDC configuration to propagate
4. Retry publishing setup

---

## Quick Reference

### Publishing Commands

```bash
# Automated (recommended)
gh workflow run publish.yml

# Direct (manual - requires OTP)
npm publish --provenance --access public  # Use with GitHub Actions!
```

### OIDC Status Commands

```bash
# Check OIDC status
gh api orgs pjsvis --jq '.organization.oidc_enabled'

# Verify trusted publisher relationship
npm owner ls amalfa
```

### Token Management

```bash
# Generate CI token
npm token create --ci

# Generate Personal Access Token
npm token create --classic
```

---

## Conclusion

Implementing OIDC-based publishing with GitHub Actions provides:

1. **Full Publishing Autonomy** - No dependency on polyvis for every release
2. **Professional Workflow** - Automated, auditable, reliable
3. **Enhanced Security** - Enterprise-grade authentication via OIDC
4. **Team Collaboration** - Any authorized team member can publish
5. **CI/CD Integration** - Seamless with existing GitHub Actions
6. **Audit Trail** - Complete authentication event logging

**The Result:** You can publish `amalfa` packages anytime using GitHub Actions, with no manual OTP coordination required.

**Next Steps:**
1. Configure OpenID Connect in GitHub organization settings
2. Add NPM_TOKEN secret to GitHub repository
3. Update GitHub Actions workflow to use OIDC authentication
4. Test with dry run first
5. Publish and verify

---

**Documenting:** Create `debriefs/publishing-oidc-setup.md` after successful implementation.

This document serves as the reference manual for all scripts defined in `package.json`. Since JSON files cannot contain comments, this file provides the necessary context and usage instructions for developer tooling.

## Core CLI Applications

PolyVis uses a standardized `ServiceLifecycle` for its three main applications. Each supports the following subcommands:
-   `serve` (Default): Runs in the foreground.
-   `start`: Runs in the background (Detached, PID file managed).
-   `stop`: Stops the background process.
-   `restart`: Stop + Start.
-   `status`: Checks if the service is running.

### 1. Developer Environment (`bun run dev`)
The primary entry point for development.
-   **Command**: `bun run scripts/cli/dev.ts`
-   **Usage**:
    -   `bun run dev` (or `serve`): Starts Web Server + CSS Watcher + JS Watcher in foreground.
    -   `bun run dev start`: Starts the stack in the background. Logs to `.dev.log`.
    -   `bun run dev status`: Check status.

### 2. Resonance Daemon (`bun run daemon`)
The background Vector Search service.
-   **Command**: `bun run src/resonance/daemon.ts`
-   **Usage**:
    -   `bun run daemon start`: Standard way to run the daemon (Port 3010).
    -   `bun run daemon status`: Check if running.

### 3. MCP Server (`bun run mcp`)
The Model Context Protocol server for AI Agent integration.
-   **Command**: `bun run src/mcp/index.ts`
-   **Transport**: `stdio` (Standard Input/Output)
-   **Important Note**: Because this server communicates via `stdin/stdout`, it **cannot** be effectively run in `start` (background) mode, as it will immediately encounter EOF on stdin and exit.
-   **Usage**:
    -   `bun run mcp` (or `serve`): Runs in foreground, awaiting JSON-RPC messages on stdin. Use this for testing or when connecting via an MCP Client (which spawns this process).
        > [!NOTE]
        > The MCP Server (`serve` mode) uses a relaxed Zombie Defense protocol (`checkZombies=false`) to allow it to coexist with its own wrapper scripts without triggering a self-termination.
    -   `bun run mcp start`: **NOT RECOMMENDED**. Will start and immediately exit.

## Development Standards

### Database Access
All scripts must adhere to the **Single Source of Truth** for database connections.
-   **DO NOT** use `new Database(path)`.
-   **DO NOT** manually resolve paths from `settings.json`.
-   **DO USE** `ResonanceDB.init()` for high-level graph access.
-   **DO USE** `DatabaseFactory.connectToResonance()` for raw SQL access.

```typescript
// ✅ Good
import { ResonanceDB } from "@src/resonance/db";
const db = ResonanceDB.init();

// ✅ Good (Raw)
import { DatabaseFactory } from "@src/resonance/DatabaseFactory";
const sqlite = DatabaseFactory.connectToResonance();
```

## Build & Maintenance Scripts

### Data Pipeline
-   `bun run build:data`: Runs the Ingestion Pipeline (`src/resonance/cli/ingest.ts`). Rebuilds the Knowledge Graph from source markdown files.
-   `bun run build:css`: Compiles Tailwind/PostCSS assets.
-   `bun run build`: Runs both data and asset builds.

### Watchers
-   `bun run watch:css`: Watches for CSS changes and rebuilds.
-   `bun run watch:js`: Watches for frontend JS changes (hot reload not yet implemented, rebuilds only).

### Testing & Verification
-   `bun run test`: Runs the test suite.
-   `bun run verify`: Runs `scripts/verify/simple_search_test.ts` to validate Vector Search.

## Zombie Defense
All standard CLIs (`dev`, `daemon`, `mcp`) automatically integrate **Zombie Defense**.
-   **Behavior**: On startup, they scan for "Ghost" processes (holding locked files) or duplicate instances of themselves.
-   **Identity Awareness**: The defense protocol scans PIDs. To prevent "friendly fire" (a process killing itself), it explicitly excludes its own PID (`process.pid`) and parent PID (`process.ppid`) from the duplicate list.
-   **Auto-Cleanup**: If a stale PID file exists but the process is dead, it cleans the file. If the process is alive, it aborts (to prevent double-runs).

> [!CAUTION]
> **The Locked Trio**: Valid processes hold locks on three files: `resonance.db`, `resonance.db-shm`, and `resonance.db-wal`.
> If a "Zombie" process retains these locks, any new process attempting to start will crash with `Disk I/O Error`.
> **Rule**: You must clear zombies off the road before depressing the accelerator.
