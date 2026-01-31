---
tags:
  - metadata
  - vocabulary
  - agent-driven
  - extracted
---
# Publishing Playbook

## Purpose
Comprehensive guide for npm package publishing, release management, and OIDC automation.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                                                     │
│   User → GitHub Actions (OIDC) → npm Registry     │
│                                                     │
└─────────────────────────────────────────────────────────────┘
```

**Key Components:**
1.  **OpenID Connect (OIDC)**: Authenticates GitHub Actions as a trusted publisher.
2.  **CI Tokens**: Used in automated workflows (recommended over Personal Access Tokens).
3.  **Provenance**: Ensures supply chain security.

## Workflow

### 1. Automated Release (Recommended)
We use `scripts/release.ts` to manage the versioning and tagging process, which triggers the CI pipeline.

```bash
bun run scripts/release.ts
```

**What it does:**
1.  Bumps version in `package.json`.
2.  Updates `CHANGELOG.md`.
3.  Commits and creates a git tag (e.g., `v1.0.23`).
4.  Pushes to GitHub.
5.  **GitHub Actions** detects the tag and runs the publish job.

### 2. Manual Emergency Release
If CI is down, you can publish manually **IF** you have the correct OTP configuraton.

```bash
npm publish --provenance --access public
```
*Note: This usually requires a One-Time Password (OTP) from the package owner.*

## OIDC Setup Guide

### Phase 1: Trusted Publisher (One-Time)
Link your GitHub repository to NPM.

```bash
# 1. Check current settings
npm owner ls amalfa

# 2. Add GitHub Trust
npm owner add amalfa github:pjsvis
```

### Phase 2: GitHub Secrets
Add `NPM_TOKEN` to your repository secrets.
*   **Source**: Generate a "Automation" token in NPM settings.
*   **Destination**: GitHub Repo Settings -> Secrets -> Actions.

## Troubleshooting

### `EOTP: This operation requires a one-time password`
*   **Cause**: You are trying to publish from your local machine, but 2FA is enforced.
*   **Fix**: Use the CI workflow (`scripts/release.ts`) which bypasses this via OIDC trust.

### `E400: Only verified maintainers may publish`
*   **Cause**: Your NPM user is not an admin.
*   **Fix**: Submit a request to the organization owner.

## Security Best Practices
*   **Never commit tokens**.
*   **Rotate CI tokens** every 90 days.
*   Use **provenance** to sign builds.
