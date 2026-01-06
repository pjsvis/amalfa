#!/usr/bin/env bash
# scripts/cleanup-repo-artifacts.sh
# 
# Purpose: Remove large artifacts and generated files from git history
# WARNING: This rewrites git history. Coordinate with team before running.
#
# Usage:
#   ./scripts/cleanup-repo-artifacts.sh
#
# What it does:
# 1. Removes database files (*.db, *.sqlite)
# 2. Removes large PDFs (research papers)
# 3. Removes built bundles (dist/*.bundle.js)
# 4. Removes test artifacts
# 5. Cleans up git history and reclaims space

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧹 Git Repository Cleanup Script${NC}"
echo ""
echo "This script will remove the following from git history:"
echo "  - Database files (*.db, *.sqlite, *.db-wal, *.db-shm)"
echo "  - Large PDF research papers"
echo "  - Built JavaScript bundles"
echo "  - Test artifacts"
echo ""
echo -e "${RED}⚠️  WARNING: This rewrites git history!${NC}"
echo "   - All team members will need to re-clone or reset"
echo "   - Open PRs may need to be recreated"
echo "   - Only run on feature branches or with team coordination"
echo ""

# Check if we're on a safe branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" = "main" ]; then
    echo -e "${RED}❌ Error: Cannot run on 'main' branch${NC}"
    echo "   Switch to a feature branch first:"
    echo "   git checkout -b cleanup/remove-artifacts"
    exit 1
fi

echo -e "${YELLOW}Current branch: $current_branch${NC}"
echo ""
read -p "Do you want to proceed? (yes/no): " -r
echo ""
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "Aborted."
    exit 0
fi

echo -e "${GREEN}📊 Analyzing current repository state...${NC}"
echo ""
echo "Git object count before cleanup:"
git count-objects -vH
echo ""

# Backup current state
echo -e "${GREEN}💾 Creating backup branch...${NC}"
git branch "backup-before-cleanup-$(date +%Y%m%d-%H%M%S)" || true
echo ""

# Files to remove from history
FILES_TO_REMOVE=(
    # Database files
    "*.db"
    "*.db-wal"
    "*.db-shm"
    "*.sqlite"
    "*.sqlite-wal"
    "*.sqlite-shm"
    
    # Specific large files
    "backups/db/*"
    "public/resonance.db.pre-hollow-node"
    "canary-persistence.db"
    "test-graph-integrity.db-wal"
    "_misc/bento_ledger.sqlite"
    "bento_ledger.sqlite"
    
    # Large PDFs
    "experiments/enlightenment/representational-engineering.pdf"
    "docs/2310.08560v2.pdf"
    
    # Built bundles
    "experiments/data-star-dashboard/dist/datastar.bundle.js"
    "**/dist/*.bundle.js"
    "**/dist/*.min.js"
)

echo -e "${GREEN}🔥 Removing artifacts from git history...${NC}"
echo ""

# Use git filter-repo if available, otherwise fall back to filter-branch
if command -v git-filter-repo &> /dev/null; then
    echo "Using git-filter-repo (recommended)"
    
    # Build path arguments
    PATH_ARGS=()
    for pattern in "${FILES_TO_REMOVE[@]}"; do
        PATH_ARGS+=(--path-glob "$pattern")
    done
    
    git filter-repo --force --invert-paths "${PATH_ARGS[@]}"
    
else
    echo "Using git filter-branch (slower, consider installing git-filter-repo)"
    echo "  Install: brew install git-filter-repo"
    echo ""
    
    # Build index-filter command
    REMOVE_CMD="git rm -rf --cached --ignore-unmatch"
    for pattern in "${FILES_TO_REMOVE[@]}"; do
        REMOVE_CMD="$REMOVE_CMD '$pattern'"
    done
    
    git filter-branch --force \
        --index-filter "$REMOVE_CMD" \
        --prune-empty \
        --tag-name-filter cat \
        -- --all
fi

echo ""
echo -e "${GREEN}🗑️  Cleaning up git garbage...${NC}"

# Remove backup refs from filter-branch
rm -rf .git/refs/original/ 2>/dev/null || true

# Expire reflog and run aggressive garbage collection
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo "Git object count after cleanup:"
git count-objects -vH
echo ""

# Calculate space saved
echo -e "${GREEN}📦 Repository size comparison:${NC}"
du -sh .git
echo ""

echo -e "${YELLOW}📋 Next steps:${NC}"
echo ""
echo "1. Verify the cleanup didn't break anything:"
echo "   bun run dev start"
echo "   bun test"
echo ""
echo "2. If everything works, force push:"
echo "   git push --force origin $current_branch"
echo ""
echo "3. Update .gitignore to prevent re-committing artifacts:"
echo "   (Already done in this script's companion changes)"
echo ""
echo "4. Team members will need to reset their branches:"
echo "   git fetch origin"
echo "   git reset --hard origin/$current_branch"
echo ""
echo -e "${RED}⚠️  Remember: This rewrote history. Coordinate with your team!${NC}"
