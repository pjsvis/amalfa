#!/bin/bash

# Lift-and-Shift Script: PolyVis → AMALFA (Auto mode)
# Copies relevant code while excluding unnecessary files

set -e  # Exit on error

echo "════════════════════════════════════════"
echo "  AMALFA Lift-and-Shift from PolyVis"
echo "════════════════════════════════════════"
echo ""

# Define paths
SOURCE_DIR="$HOME/Documents/GitHub/polyvis"
TARGET_DIR="$HOME/Documents/GitHub/amalfa"

echo "📁 Source: $SOURCE_DIR"
echo "📁 Target: $TARGET_DIR"
echo ""

# Verify directories exist
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Source directory not found: $SOURCE_DIR"
    exit 1
fi

if [ ! -d "$TARGET_DIR" ]; then
    echo "❌ Target directory not found: $TARGET_DIR"
    exit 1
fi

echo "🚀 Starting copy..."
echo ""

# Perform the copy with rsync
rsync -av \
    --exclude='.git/' \
    --exclude='node_modules/' \
    --exclude='bun.lockb' \
    --exclude='dist/' \
    --exclude='.amalfa/' \
    --exclude='.resonance/' \
    --exclude='*.db' \
    --exclude='*.db-shm' \
    --exclude='*.db-wal' \
    --exclude='*.log' \
    --exclude='.*.log' \
    --exclude='*.pid' \
    --exclude='.DS_Store' \
    --exclude='.vscode/' \
    --exclude='.idea/' \
    --exclude='*.swp' \
    --exclude='*.swo' \
    --exclude='tmp/' \
    --exclude='temp/' \
    "$SOURCE_DIR/" \
    "$TARGET_DIR/"

echo ""
echo "════════════════════════════════════════"
echo "  ✅ Lift-and-Shift Complete!"
echo "════════════════════════════════════════"
echo ""

# Summary
cd "$TARGET_DIR"
echo "📊 Summary:"
echo "  Files copied: $(find . -type f ! -path './.git/*' | wc -l | tr -d ' ')"
echo "  Directories: $(find . -type d ! -path './.git/*' | wc -l | tr -d ' ')"
echo "  Total size: $(du -sh . | cut -f1)"
echo ""

# Next steps
echo "📝 Next Steps:"
echo "  1. cd $TARGET_DIR"
echo "  2. bun install"
echo "  3. bun run mcp serve"
echo "  4. Test with Claude Desktop"
echo ""
echo "Happy coding! 🚀"
