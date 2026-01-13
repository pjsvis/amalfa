#!/bin/bash
find docs/ briefs/ playbooks/ -name "*.md" -exec ./tests/sanitize/sanitize.sh {} \;
exit 0
