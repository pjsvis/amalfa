#!/bin/bash
# md-reader.sh - Browse and read markdown files with gum

# Find all markdown files
files=$(find . -name "*.md" -type f | sort)

if [ -z "$files" ]; then
  gum style --foreground 196 "No markdown files found"
  exit 1
fi

# Prompt user to select a file
selected=$(echo "$files" | gum choose --header "Select a markdown file:")

if [ -z "$selected" ]; then
  exit 0
fi

# Display with formatting and paging
cat "$selected" | fold -s -w 70 | gum format | gum pager
