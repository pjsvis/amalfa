#!/bin/bash

# Update review-under-100mb branch from main
# Usage: bun run update-review-branch (via package.json)

set -e # Abort on any error

echo "🔄 Switching to 'review-under-100mb'..."
git checkout review-under-100mb

echo "⬇️  Fetching origin..."
git fetch origin

echo "🔀 Merging origin/main..."
git merge origin/main

echo "⬆️  Pushing to origin..."
git push origin review-under-100mb

echo "🔙 Switching back to 'main'..."
git checkout main

echo "✅ Branch 'review-under-100mb' updated."
