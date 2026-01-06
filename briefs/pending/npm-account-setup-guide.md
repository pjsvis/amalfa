# NPM Account Setup Guide - No-Reply Email Strategy

## Pre-requisites Checklist

- [ ] GitHub account exists
- [ ] Password manager ready (1Password, Bitwarden, etc.)
- [ ] Terminal open

---

## Step 1: Get Your GitHub No-Reply Email

### 1.1 Navigate to GitHub Email Settings
```bash
# Open in browser:
open https://github.com/settings/emails
```

### 1.2 Enable Privacy Settings
- [ ] Check **"Keep my email addresses private"**
- [ ] Check **"Block command line pushes that expose my email"**

### 1.3 Copy Your No-Reply Email
You'll see something like:
```
123456789+yourusername@users.noreply.github.com
```

**Copy this exact address** - you'll need it multiple times.

**Example format:**
```
<numeric-id>+<github-username>@users.noreply.github.com
```

---

## Step 2: Configure Git Globally (Important!)

### 2.1 Set Your Git Email
```bash
# Replace with YOUR no-reply email from Step 1.3
git config --global user.email "123456789+yourusername@users.noreply.github.com"

# Set your display name (if not already set)
git config --global user.name "Your Name"
```

### 2.2 Verify Configuration
```bash
git config --global --list | grep user
```

**Expected output:**
```
user.name=Your Name
user.email=123456789+yourusername@users.noreply.github.com
```

---

## Step 3: Create NPM Account

### 3.1 Start Account Creation
```bash
npm adduser
```

### 3.2 Follow Prompts

**Prompt 1: Username**
```
npm username: 
```
- Enter your desired NPM username (e.g., `pjsvis`, `petersmith`, etc.)
- Must be unique across NPM
- Lowercase, hyphens allowed, no special characters
- **Check availability first:** https://www.npmjs.com/~yourusername

**Prompt 2: Password**
```
npm password: 
```
- **Use password manager** to generate strong password
- NPM requires: 10+ characters
- Save in password manager immediately

**Prompt 3: Email**
```
email (this IS public): 
```
- **Paste your GitHub no-reply email** from Step 1.3
- Example: `123456789+pjsvis@users.noreply.github.com`
- ⚠️ This will be visible in all your published packages

### 3.3 Email Verification

NPM will say:
```
npm notice Please check your email for a one-time password (OTP)
```

**Problem:** Your no-reply email is a black hole - you won't receive the OTP!

**Solution:**

#### Option A: Temporary Real Email (Recommended)
1. During `npm adduser`, use `pjstarifa@gmail.com` temporarily
2. Complete verification
3. Change email to no-reply address after account is verified

```bash
# After account is created and verified
npm login
npm profile set email "123456789+pjsvis@users.noreply.github.com"
```

#### Option B: Web-Based Signup (Easier)
1. Go to: https://www.npmjs.com/signup
2. Use `pjstarifa@gmail.com` for signup
3. Verify email via browser
4. Then change to no-reply email via CLI:
   ```bash
   npm login
   npm profile set email "123456789+pjsvis@users.noreply.github.com"
   ```

---

## Step 4: Post-Creation Setup

### 4.1 Enable 2FA (Highly Recommended)

```bash
# Enable 2FA for auth + publishing
npm profile enable-2fa auth-and-writes
```

Follow prompts:
1. Scan QR code with authenticator app (1Password, Authy, Google Authenticator)
2. Enter 6-digit code to confirm
3. **Save recovery codes** in password manager

### 4.2 Verify Your Profile

```bash
npm profile get
```

**Check output:**
```json
{
  "name": "pjsvis",
  "email": "123456789+pjsvis@users.noreply.github.com",
  "email_verified": true,
  "tfa": {
    "mode": "auth-and-writes",
    "pending": false
  }
}
```

### 4.3 Test Login

```bash
npm logout
npm login
```

Enter credentials to confirm everything works.

---

## Step 5: Reserve "amalfa" Package Name

### 5.1 Create Minimal Package

```bash
# Create temporary directory
mkdir -p /tmp/amalfa-reserve
cd /tmp/amalfa-reserve

# Create minimal package.json
cat > package.json << 'EOF'
{
  "name": "amalfa",
  "version": "0.0.0-reserved",
  "description": "A Memory Layer For Agents - MCP server for knowledge graphs (Coming Soon)",
  "author": "Your Name <123456789+pjsvis@users.noreply.github.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/pjsvis/amalfa"
  },
  "keywords": [
    "mcp",
    "model-context-protocol",
    "knowledge-graph",
    "ai-agents",
    "vector-search",
    "coming-soon"
  ]
}
EOF
```

**⚠️ Update these fields:**
- `author`: Your actual name + your no-reply email
- `repository.url`: Your actual GitHub repo URL (create repo first if needed)

### 5.2 Create README

```bash
cat > README.md << 'EOF'
# AMALFA

**A Memory Layer For Agents**

🚧 **Coming Soon** 🚧

AMALFA is an MCP (Model Context Protocol) server that gives AI agents access to your project's knowledge graph.

## Planned Features

- 🔍 Vector search over markdown documentation
- 📊 Graph traversal (relationships between docs)
- 🧠 Works with Claude Desktop, Cursor, Windsurf
- ⚡ Built with Bun + SQLite + FastEmbed

## Status

Currently in development. Watch this space!

**GitHub:** https://github.com/pjsvis/amalfa  
**Author:** @pjsvis

---

_This is a placeholder package to reserve the name. v1.0.0 coming soon._
EOF
```

### 5.3 Publish Placeholder

```bash
# Verify contents
ls -la
# Should see: package.json, README.md

# Publish (reserves the name)
npm publish --access public
```

**If 2FA enabled, you'll be prompted for OTP:**
```
npm notice Please enter OTP: 
```
- Enter 6-digit code from authenticator app

**Success message:**
```
+ amalfa@0.0.0-reserved
```

### 5.4 Verify Publication

```bash
# Check NPM registry
npm view amalfa

# Visit in browser
open https://www.npmjs.com/package/amalfa
```

**What you should see:**
- Package name: `amalfa`
- Version: `0.0.0-reserved`
- Description: "Coming Soon"
- Your no-reply email in author field

---

## Step 6: Security Hardening

### 6.1 Review Account Security

```bash
# Check login sessions
npm profile get --json | jq .sessions
```

### 6.2 Set Up Recovery

**Store in password manager:**
- [ ] NPM username
- [ ] NPM password
- [ ] 2FA recovery codes
- [ ] GitHub no-reply email address

### 6.3 Configure NPM Settings

```bash
# Set default access to public (for open source)
npm config set access public

# Verify config
npm config list
```

---

## Step 7: Prepare for v1.0 Release

### 7.1 Create GitHub Repository

```bash
# If not already created
gh repo create amalfa --public --description "A Memory Layer For Agents - MCP Server"

# Or via web: https://github.com/new
```

### 7.2 Update Package Reservation (Optional)

If you want to update the placeholder before v1.0:

```bash
cd /tmp/amalfa-reserve

# Update version
npm version 0.0.1-reserved

# Update description, add repo link, etc.
nano package.json

# Republish
npm publish
```

---

## Common Issues & Solutions

### Issue: "You must verify your email to publish"

**Solution:**
```bash
# Log into npmjs.com with browser
open https://www.npmjs.com/login

# Go to email settings, resend verification
# Use real email temporarily, then switch to no-reply after verified
```

### Issue: "Package name already taken"

**Solution:**
```bash
# Check if truly taken or just typo
npm view amalfa

# If taken, consider alternatives:
# - @yourusername/amalfa (scoped package)
# - amalfa-mcp
# - amalfa-server
```

### Issue: "403 Forbidden - you must be logged in"

**Solution:**
```bash
npm logout
npm login
# Re-enter credentials
```

### Issue: "Invalid email format"

**Solution:**
- GitHub no-reply emails ARE valid
- Copy exact format from GitHub settings
- Include the numeric prefix
- Don't add extra spaces

---

## What Happens Next

### After Reserving Name:

1. **Build AMALFA v1.0** (extract from PolyVis)
2. **Test thoroughly** (local installs, MCP integration)
3. **Update version** to `1.0.0`
4. **Publish release:**
   ```bash
   npm version 1.0.0
   npm publish
   ```
5. **Announce** (GitHub release, Twitter, HN, etc.)

### Package Lifecycle:

```
0.0.0-reserved  →  [development]  →  1.0.0  →  1.0.1  →  ...
  (today)           (weeks 1-2)      (launch)  (patches)
```

---

## Quick Reference Card

```bash
# Setup
npm adduser                                  # Create account
npm login                                    # Sign in
npm profile set email "your@noreply.email"  # Change email
npm profile enable-2fa auth-and-writes      # Enable 2FA

# Publishing
npm publish --access public                  # Publish package
npm version <major|minor|patch>              # Bump version
npm view <package>                           # Check registry

# Verification
npm whoami                                   # Current user
npm profile get                              # Account details
```

---

## Checklist Summary

- [ ] Get GitHub no-reply email from https://github.com/settings/emails
- [ ] Configure git global email to no-reply address
- [ ] Create NPM account (use real email temporarily for verification)
- [ ] Change NPM email to no-reply address after verification
- [ ] Enable 2FA on NPM account
- [ ] Save credentials in password manager
- [ ] Create placeholder package.json
- [ ] Publish `amalfa@0.0.0-reserved` to reserve name
- [ ] Verify publication at npmjs.com/package/amalfa
- [ ] Create GitHub repo for AMALFA
- [ ] Proceed with extraction and development

---

**Status after completion:**
✅ NPM account created with privacy-preserving email  
✅ Package name "amalfa" reserved  
✅ Ready to build and publish v1.0.0  

**Next:** Extract MCP server from PolyVis → Build AMALFA → Ship it! 🚀
