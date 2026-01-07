# Publishing Playbook

## Purpose
Comprehensive guide for npm package publishing and ownership management using OpenID Connect (OIDC) and GitHub Actions automation.

## Overview

### Current State
- **Package**: `amalfa` published under `@pjsvis` organization (polyvis is maintainer, Peter John Smith is author)
- **Problem**: Only `@pjsvis` (maintainer) can publish - authors (Peter John Smith, you) cannot
- **Blocking Issue**: Two-Factor Authentication (2FA) enabled on the organization account
- **Error**: `npm error code EOTP` - Requires one-time password from maintainer

### Goal
Enable **self-publishing** capability for the `amalfa` package using OpenID Connect, eliminating dependency on polyvis for every release.

---

## Problem Analysis

### Why Publishing is Currently Blocked

**Architecture:**
```
┌─────────────────────────────────────────────┐
│  @pjsvis (Maintainer)                 │
│         ▲                               │
│         │                               │
│         │                               │
│         ▲                               │
│  @pjsvis (Maintainer)                │
└─────────────────────────────────────────────┘

User → npm → @pjsvis → Package Published

[Peter John Smith (Author)]
```

**The 2FA Problem:**
- NPM requires OTP from maintainer (polyvis)
- Authors (you, Peter) don't have OTP capability
- You must request OTP from polyvis every time you want to publish
- Breaks your release automation

### Why This is a Problem

1. **No Self-Control**: You depend on external party (polyvis) for every release
2. **Communication Overhead**: Must coordinate OTP requests via email/slack
3. **Single Point of Failure**: If polyvis is unavailable/unresponsive, you cannot publish
4. **Not Scalable**: Coordination overhead increases as team grows

### The Solution: OpenID Connect (OIDC)

**How OIDC Solves This:**
```
┌─────────────────────────────────────────────┐
│  You → npm → OpenID Connect           │
│         ▲                               │
│         │                               │
│         ▲                               │
│  GitHub Actions → npm                 │
└─────────────────────────────────────────────┘

User → npm → OIDC → GitHub Actions → Package Published
```

**Key Insight:** 
- OIDC allows GitHub Actions to "act as you" to publish npm packages
- GitHub Actions has a `NPM_TOKEN` with publish permissions
- No OTP required - fully automated
- **Your GitHub account is added as a trusted publisher** for the package

**Benefits:**
- ✅ Full publishing autonomy - you control releases
- ✅ No OTP coordination needed - automated via GitHub Actions
- ✅ Faster releases - no waiting for maintainer approval
- ✅ Better CI/CD integration - works with existing GitHub Actions
- ✅ Audit trail - all publishes recorded in GitHub
- ✅ Team collaboration - other team members can publish

---

## Prerequisites

### Required Access

1. **GitHub Repository Admin Access**
   - Navigate to: https://github.com/pjsvis/amalfa/settings/access
   - Ensure you have **Owner** or **Admin** role
   - Click "Add person" to add yourself as an OIDC authorized user

2. **OIDC Enabled on Organization**
   - As a maintainer, ensure the organization has OIDC enabled
   - Navigate to: https://github.com/organizations/pjsvis/settings
   - Check "OpenID Connect" is enabled
   - Note: This may require organization owner approval

3. **GitHub Actions Token (NPM_TOKEN)**
   - Must be stored in GitHub repository secrets
   - Must have write permissions to publish packages
   - Format: `NPM_TOKEN` (all caps)
   - Required for OIDC to publish on your behalf

### Verification Steps

1. **Check Current Publishing State**
   ```bash
   # View organization settings
   open https://github.com/organizations/pjsvis/settings/teams
   
   # Check trusted publishers
   npm owner ls amalfa
   ```

2. **Test GitHub Actions Workflow**
   ```bash
   # Manual trigger (for testing)
   gh workflow run publish.yml
   
   # Check workflow logs
   gh run list --workflow=publish.yml
   ```

---

## Setup Procedures

### Phase 1: Configure GitHub Repository

#### Step 1.1: Add OIDC Authorized User
```bash
# Navigate to organization access settings
open https://github.com/pjsvis/amalfa/settings/access

# Add yourself as authorized user
# Click "Add person" button
# Search for your GitHub username
# Enter: <your-github-username>
# Select role: Admin (recommended) or Maintainer
# Click "Add person" button
```

**Why this step:**
- Required for OIDC to allow GitHub Actions to publish as you
- Without this, even with correct OIDC setup, publishing will fail with permission error

#### Step 1.2: Verify OIDC Configuration
```bash
# Verify OIDC is enabled on organization
gh api orgs pjsvis --jq '.organization.oidc_enabled'
```

**Expected output:** `true`

If `false`, you need to contact polyvis to enable OIDC.

### Phase 2: Configure GitHub Actions Workflow

#### Step 2.1: Update GitHub Workflow
Update `.github/workflows/publish.yml` to use OIDC:

```yaml
name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
    
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
- ✅ Added `--provenance --access public` flag - enables OIDC authentication
- ✅ Added `NODE_AUTH_TOKEN` environment variable
- ✅ Removed OTP dependency - OIDC handles authentication

#### Step 2.2: Add NPM_TOKEN Secret
```bash
# Add NPM_TOKEN to GitHub repository secrets
# Navigate to repository settings
open https://github.com/pjsvis/amalfa/settings/secrets/actions

# Click "New repository secret"
# Secret name: NPM_TOKEN
# Secret value: <paste-your-npm-token>
# Select "Actions" as environment
# Click "Add secret"
```

**Critical Notes:**
- ⚠️ **Never commit NPM_TOKEN to repository** - this is a security risk
- ⚠️ **Generate new token** - use `npm token create --ci` or `npm token create` from CLI
- ⚠️ **Token permissions** - Give token write permissions only (not admin)
- ⚠️ **Token format** - `NPM_TOKEN` (all caps, exactly as required)
- ✅ GitHub Actions will use this token automatically via `id-token: write` permission

#### Step 2.3: Verify Workflow Configuration
```bash
# Verify workflow file
cat .github/workflows/publish.yml

# Verify NPM_TOKEN secret is set
gh secret list -a actions | grep NPM_TOKEN
```

### Phase 3: Test Publishing Process

#### Step 3.1: Manual Test Run
```bash
# Trigger workflow manually for testing
gh workflow run publish.yml

# Monitor workflow run
gh run list --workflow=publish.yml

# Check logs
gh run view -l 1
```

#### Step 3.2: Verify OIDC Authentication
```bash
# Check if OIDC is being used in authentication
gh api graphql '
query {
  organization(login: \"$login\") {
    oidcUrl: \"https://github.com/login/oauth\"
    scopes {
      include: \"admin:org:read\"
    }
  }
}
'
```

**Expected result:** Should show OIDC configuration and that it's being used for organization login.

---

## Publishing Workflow

### How OIDC Publishing Works

#### Step 1: Authentication via OIDC
1. GitHub Actions runner authenticates with GitHub via OIDC
2. Acts as an OIDC client for the organization
3. No password required - OIDC handles authentication

#### Step 2: Authorization
1. GitHub Actions checks if the user is authorized to publish the package
2. Authorization is granted if user is listed as an OIDC authorized user
3. NPM_TOKEN is used for write permissions

#### Step 3: Package Publishing
1. GitHub Actions executes `npm publish --provenance --access public`
2. NPM validates the package
3. Package is published under organization account
4. No OTP required - fully automated

### Step 4: Post-Publishing
1. GitHub Actions creates a git tag (e.g., `v1.0.21`)
2. Release notes are published to GitHub Releases
3. NPM registry is updated
4. Users can install new version via `npm install amalfa@latest`

---

## Troubleshooting

### Issue: "npm error code EOTP"
**Error Message:**
```
npm error code EOTP
npm error This operation requires a one-time password from your authenticator.
```

**Cause:** You're still using `npm publish` without the OIDC workflow. The direct npm CLI requires OTP from maintainer.

**Solution:** Use GitHub Actions workflow instead of direct npm publish command:
```bash
# Use GitHub Actions (automatic, no OTP needed)
gh workflow run publish.yml

# Manual trigger
gh workflow run publish.yml --manual-triggers
```

### Issue: "You cannot publish over the previously published versions"
**Cause:** npm detects that you're trying to publish a version that exists on the registry.

**Solution:** Always increment the version number before publishing:
```bash
# Use release script (automated version bump)
bun run scripts/release.ts patch   # 1.0.20 → 1.0.21
```

### Issue: "2FA enabled on organization - OTP required"
**Cause:** Organization has Two-Factor Authentication enabled, but you're trying to publish with OIDC (which bypasses 2FA).

**Solutions:**
1. **Request OIDC only mode** (if available): Ask organization to enable OIDC without 2FA
2. **Request full publishing permissions**: Ask to be added as Admin with OIDC enabled
3. **Use browser login for manual OTP**: Still need OTP but can authenticate via browser

### Issue: "Package ownership - Only maintainers can publish"
**Cause:** Package is owned by `@pjsvis` organization, you're not listed as a maintainer.

**Solutions:**
1. **Request maintainer role**: Ask polyvis to add you as a maintainer
2. **Request ownership transfer**: Ask polyvis to transfer package ownership to your account
3. **Use OIDC workflow**: OIDC publishing bypasses maintainer requirement

### Issue: "OIDC not configured on organization"
**Cause:** Organization doesn't have OpenID Connect enabled.

**Solutions:**
1. **Enable OIDC**: Contact organization owner or admin
2. **Check settings**: Navigate to organization OIDC settings
3. **GitHub documentation**: Follow GitHub's guide on enabling OIDC

### Issue: "NPM_TOKEN missing or has wrong permissions"
**Cause:** GitHub Actions secret not set or doesn't have write permissions.

**Solutions:**
1. **Add NPM_TOKEN secret**: Follow Phase 2.2 steps
2. **Check permissions**: Ensure token has `write` permission for packages
3. **Generate new token**: Create CI token with appropriate scope
4. **Regenerate secret**: Delete old secret and add new one

---

## Best Practices

### Publishing Workflow

✅ **Always use GitHub Actions for releases**
- Provides audit trail
- Enables CI/CD integration
- No OTP coordination needed
- Works with existing `.github/workflows/publish.yml`

✅ **Never commit NPM_TOKEN to repository**
- Always use GitHub Secrets
- Generate CI tokens with `npm token create --ci`
- Only give write permissions to Actions (not admin)

✅ **Version Management**
- Use `scripts/release.ts` for automated version bumping
- Always commit version changes with changelog
- Tag releases consistently (e.g., `v1.0.21`)

✅ **Testing Before Publishing**
- Run `bun test` to ensure all tests pass
- Use `npm publish --dry-run` to test without actually publishing
- Run `bun run validate-config` to check configuration

### Security

🔒 **Token Management**
- Use personal access tokens (PATs) with minimal permissions
- Prefer CI tokens over user tokens for automated workflows
- Rotate tokens regularly
- Never commit tokens to repository
- Use repository secrets, never check in code

🔒 **OIDC Security**
- OIDC adds enterprise-grade security without 2FA overhead
- Works with GitHub's identity providers (Google, Microsoft, etc.)
- Provides audit trail of all authentication events
- Reduces risk of account compromise

### Maintenance

📊 **Release Automation**
- Use GitHub Actions for automated publishing
- No manual OTP requests needed
- Release process is fully auditable in GitHub
- Faster time-to-release

📝 **Documentation Updates**
- Keep `CHANGELOG.md` updated with each release
- Document any breaking changes in README.md
- Update `.github/workflows/publish.yml` as procedures evolve

---

## Quick Reference

### Publishing Commands
```bash
# Automated publishing (recommended)
gh workflow run publish.yml

# Manual publishing (for testing)
gh workflow run publish.yml --manual-triggers

# Check publishing status
npm owner ls amalfa
npm view amalfa
```

### Publishing Checklist
Before publishing, verify:
- [ ] GitHub repository has Owner or Admin access for OIDC
- [ ] NPM_TOKEN secret is set in GitHub Secrets
- [ ] Organization has OIDC enabled
- [ ] GitHub Actions workflow is configured correctly
- [ ] Version number has been incremented in package.json
- [ ] All tests pass (`bun test`)
- [ ] Configuration validation passes (`bun run validate-config`)
- [ ] CHANGELOG.md is updated with release notes
- [ ] No uncommitted changes remain
- [ ] Repository is on main branch and in sync with origin

---

## Conclusion

Implementing OIDC-based publishing with GitHub Actions enables **full publishing autonomy** for the `amalfa` package. This eliminates dependency on polyvis for every release and provides a more secure, automated workflow.

**Next Steps:**
1. Contact polyvis to request maintainer role and OIDC authorized user status
2. Configure OIDC on organization account
3. Set up NPM_TOKEN secret in GitHub repository
4. Test GitHub Actions workflow with `--dry-run` or `--manual-triggers`
5. Once validated, use GitHub Actions for all future releases

**Success Criteria:**
- ✅ Publishing works without requiring OTP from polyvis
- ✅ Release process is fully automated via GitHub Actions
- ✅ Full audit trail in GitHub Actions logs
- ✅ Version management is consistent with automated workflow
- ✅ Security is improved with OIDC authentication