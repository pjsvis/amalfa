#!/bin/bash

# Lift-and-Shift Script: PolyVis → AMALFA
# Copies relevant code while excluding unnecessary files

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  AMALFA Lift-and-Shift from PolyVis${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Define paths
SOURCE_DIR="$HOME/Documents/GitHub/polyvis"
TARGET_DIR="$HOME/Documents/GitHub/amalfa"

# Verify source exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}❌ Source directory not found: $SOURCE_DIR${NC}"
    exit 1
fi

# Verify target exists
if [ ! -d "$TARGET_DIR" ]; then
    echo -e "${RED}❌ Target directory not found: $TARGET_DIR${NC}"
    exit 1
fi

# Check if target is empty (except .git)
TARGET_FILES=$(find "$TARGET_DIR" -mindepth 1 -maxdepth 1 ! -name '.git' ! -name '.gitignore' | wc -l)
if [ "$TARGET_FILES" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Target directory is not empty!${NC}"
    echo "Files will be overwritten. Continue? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
fi

echo -e "${BLUE}📁 Source: $SOURCE_DIR${NC}"
echo -e "${BLUE}📁 Target: $TARGET_DIR${NC}"
echo ""

# Create rsync exclude file
EXCLUDE_FILE=$(mktemp)
cat > "$EXCLUDE_FILE" << 'EOF'
# Version control
.git/
.gitignore

# Dependencies
node_modules/
bun.lockb

# Build artifacts
dist/
.amalfa/
.resonance/

# Database files
*.db
*.db-shm
*.db-wal

# Logs and temp files
*.log
.*.log
*.pid
.DS_Store

# IDE
.vscode/
.idea/
*.swp
*.swo

# Mac specific
.DS_Store
.AppleDouble
.LSOverride

# Temporary files
tmp/
temp/
EOF

echo -e "${GREEN}✓${NC} Created exclusion list"
echo ""
echo -e "${YELLOW}Excluded patterns:${NC}"
cat "$EXCLUDE_FILE" | grep -v '^#' | grep -v '^$'
echo ""

# Confirm before proceeding
echo -e "${YELLOW}Ready to copy. Continue? (y/N)${NC}"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    rm "$EXCLUDE_FILE"
    echo "Cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}🚀 Starting lift-and-shift...${NC}"
echo ""

# Perform the copy with rsync
# -a: archive mode (preserves permissions, timestamps)
# -v: verbose
# --exclude-from: use exclusion file
# --progress: show progress
# --delete: remove files in target that don't exist in source (optional, commented out for safety)

rsync -av \
    --exclude-from="$EXCLUDE_FILE" \
    --progress \
    "$SOURCE_DIR/" \
    "$TARGET_DIR/"

# Cleanup
rm "$EXCLUDE_FILE"

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Lift-and-Shift Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""

# Summary
echo -e "${BLUE}📊 Summary:${NC}"
cd "$TARGET_DIR"
echo -e "  Files copied: ${GREEN}$(find . -type f | wc -l | tr -d ' ')${NC}"
echo -e "  Directories: ${GREEN}$(find . -type d | wc -l | tr -d ' ')${NC}"
echo -e "  Total size: ${GREEN}$(du -sh . | cut -f1)${NC}"
echo ""

# Next steps
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "  1. cd $TARGET_DIR"
echo "  2. bun install"
echo "  3. bun run mcp serve"
echo "  4. Test with Claude Desktop"
echo ""
echo -e "${BLUE}Happy coding! 🚀${NC}"
