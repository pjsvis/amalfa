---
tags:
  - metadata
  - vocabulary
  - agent-driven
---
# AMALFA Setup Guide

Complete guide for setting up NPM publishing with privacy-preserving email configuration.

---

## Pre-requisites Checklist

- [ ] GitHub account exists
- [ ] Password manager ready (1Password, Bitwarden, etc.)
- [ ] Terminal open
- [ ] Git configured globally

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

### 3.1 Choose Your Method

**Option A: Web-Based Signup (Recommended)**
1. Go to: https://www.npmjs.com/signup
2. Use real email for signup (e.g., `youremail@gmail.com`)
3. Verify email via browser
4. Then change to no-reply email via CLI (see Step 4)

**Option B: CLI Signup**
```bash
npm adduser
```

### 3.2 CLI Prompts (if using Option B)

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
- **Use real email temporarily** for verification
- You'll switch to no-reply after account is verified

### 3.3 Email Verification

If you used a real email, check your inbox for the OTP and complete verification.

---

## Step 4: Switch to No-Reply Email

After account is created and verified:

```bash
# Login if needed
npm login

# Change to your GitHub no-reply email
npm profile set email "123456789+yourusername@users.noreply.github.com"

# Verify change
npm profile get
```

**Check output includes:**
```json
{
  "email": "123456789+yourusername@users.noreply.github.com",
  "email_verified": true
}
```

---

## Step 5: Enable 2FA (Highly Recommended)

```bash
# Enable 2FA for auth + publishing
npm profile enable-2fa auth-and-writes
```

**Follow prompts:**
1. Scan QR code with authenticator app (1Password, Authy, Google Authenticator)
2. Enter 6-digit code to confirm
3. **Save recovery codes** in password manager

**Verify 2FA status:**
```bash
npm profile get
```

Should show:
```json
{
  "tfa": {
    "mode": "auth-and-writes",
    "pending": false
  }
}
```

---

## Step 6: Reserve "amalfa" Package Name

### 6.1 Create Minimal Package

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
  "author": "Your Name <123456789+yourusername@users.noreply.github.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/amalfa"
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
- `repository.url`: Your actual GitHub repo URL

### 6.2 Create README

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

**GitHub:** https://github.com/yourusername/amalfa  
**Author:** @yourusername

---

_This is a placeholder package to reserve the name. v1.0.0 coming soon._
EOF
```

### 6.3 Publish Placeholder

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

### 6.4 Verify Publication

```bash
# Check NPM registry
npm view amalfa

# Visit in browser
open https://www.npmjs.com/package/amalfa
```

---

## Step 7: Security Hardening

### 7.1 Store Credentials in Password Manager

**Save these items:**
- [ ] NPM username
- [ ] NPM password
- [ ] 2FA recovery codes
- [ ] GitHub no-reply email address

### 7.2 Configure NPM Defaults

```bash
# Set default access to public (for open source)
npm config set access public

# Verify config
npm config list
```

### 7.3 Test Login Flow

```bash
npm logout
npm login
```

Enter credentials to confirm everything works with 2FA.

---

## Step 8: Prepare for v1.0 Release

### 8.1 Development Workflow

**Package lifecycle:**
```
0.0.0-reserved  →  [development]  →  1.0.0  →  1.0.1  →  ...
  (today)           (weeks 1-2)      (launch)  (patches)
```

### 8.2 When Ready to Publish v1.0

```bash
# In your actual project directory
cd ~/Documents/GitHub/amalfa

# Update version
npm version 1.0.0

# Publish release
npm publish --access public

# Create GitHub release
gh release create v1.0.0 --generate-notes
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
# Check if truly taken
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

### Issue: "No one-time password received"

**This is expected!** No-reply emails don't receive messages. That's why we:
1. Use real email during signup
2. Verify the account
3. Switch to no-reply email after verification

---

## Quick Reference Card

```bash
# Account Management
npm adduser                                  # Create account
npm login                                    # Sign in
npm logout                                   # Sign out
npm whoami                                   # Current user
npm profile get                              # Account details
npm profile set email "email@example.com"    # Change email
npm profile enable-2fa auth-and-writes       # Enable 2FA

# Publishing
npm publish --access public                  # Publish package
npm version <major|minor|patch>              # Bump version
npm view <package>                           # Check registry
npm unpublish <package@version>              # Remove version (careful!)

# Configuration
npm config set access public                 # Default to public
npm config list                              # View all config
```

---

## Checklist Summary

- [ ] Get GitHub no-reply email from https://github.com/settings/emails
- [ ] Configure git global email to no-reply address
- [ ] Create NPM account (use real email for verification)
- [ ] Change NPM email to no-reply address after verification
- [ ] Enable 2FA on NPM account
- [ ] Save credentials in password manager
- [ ] Create placeholder package.json
- [ ] Publish `amalfa@0.0.0-reserved` to reserve name
- [ ] Verify publication at npmjs.com/package/amalfa
- [ ] Configure NPM defaults (public access)
- [ ] Test login/logout flow with 2FA

---

## Status After Completion

✅ NPM account created with privacy-preserving email  
✅ Package name "amalfa" reserved  
✅ 2FA enabled for security  
✅ Ready to build and publish v1.0.0  

**Next Steps:**
1. Extract MCP server from PolyVis
2. Build AMALFA standalone package
3. Test thoroughly
4. Publish v1.0.0
5. Announce! 🚀

---

## Privacy Benefits of No-Reply Email

Using GitHub's no-reply email provides:

- **Spam Protection:** Your real email never appears in public package metadata
- **Consistency:** Same email across Git commits and NPM packages
- **Professional:** Clean separation between personal and public identity
- **Security:** Reduces attack surface for social engineering

**What's Public:**
- Your NPM username
- Your no-reply email (but it doesn't receive messages)
- Package metadata (name, version, description)

**What's Private:**
- Your real email address
- Your ability to receive unsolicited messages

---

**Last Updated:** 2026-01-06
