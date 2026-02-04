# Global Package Management Playbook

## Philosophy

**Minimize global package pollution.** The guiding principle is to install packages globally only when they provide system-wide CLI tools that are genuinely needed across multiple projects.

### Decision Tree: Where to Install?

```
Does it provide a CLI tool?
├─ NO → Install locally in project (bun install)
└─ YES → Is it needed across multiple projects?
    ├─ NO → Install locally in project (bun install)
    └─ YES → Is it JavaScript/TypeScript related?
        ├─ YES → Use Bun global (bun install -g)
        └─ NO → Is it a binary/native tool?
            ├─ YES → Use Homebrew (brew install)
            └─ NO → Evaluate case-by-case
```

## Installation Guidelines

### Bun Global Packages
**Use for:** JavaScript/TypeScript CLI tools needed system-wide.

**Commands:**
```bash
# Install
bun install -g <package>@latest

# Update
bun install -g <package>@latest

# Remove
bun remove -g <package>

# List
bun pm ls -g
```

**Current Installations:**
- `@anthropic-ai/claude-code@2.1.27` - Claude AI coding assistant
- `@augmentcode/auggie@0.15.0` - Augment Code assistant
- `@github/copilot@0.0.400` - GitHub Copilot
- `@kilocode/cli@0.26.1` - KiloCode CLI
- `@mixedbread/mgrep@0.1.7` - Modern grep alternative
- `@qwen-code/qwen-code@0.9.0` - Qwen Code assistant
- `agent-browser@0.6.0` - Agent browser tool
- `amalfa@1.5.1` - This project's CLI (dogfooding)
- `opencode-ai@1.1.36` - OpenCode AI assistant
- `typescript@5.9.2` - TypeScript compiler
- `wrangler@4.54.0` - Cloudflare Workers CLI

**Total:** 11 packages (1353 including dependencies)

### Homebrew Formulas
**Use for:** Native binaries, system tools, languages, and non-JS CLI utilities.

**Commands:**
```bash
# Install
brew install <formula>

# Update specific
brew upgrade <formula>

# Update all
brew upgrade

# Remove
brew uninstall <formula>

# List
brew list --formula
```

**Current Developer Tools:**
- `aichat` - AI chat CLI
- `ast-grep` - AST-based code search
- `btop` - System monitor
- `fd` - Modern find alternative
- `ffmpeg` - Media processing
- `fzf` - Fuzzy finder
- `gh` - GitHub CLI
- `git` - Version control
- `git-filter-repo` - Git history rewriting
- `graphviz` - Graph visualization
- `jq` - JSON processor
- `llama.cpp` - Local LLM inference
- `memo` - Note-taking tool
- `neovim` - Text editor
- `node` - Node.js runtime
- `node@22` - Node.js v22
- `pipx` - Python app installer
- `qwen-code` - Qwen Code binary
- `ripgrep` - Fast grep alternative
- `sevenzip` - Archive utility
- `sqld` - LibSQL server
- `stakpak` - Package management
- `starship` - Shell prompt
- `tmux` - Terminal multiplexer
- `tree` - Directory visualization
- `turso` - Turso CLI
- `wget` - HTTP downloader
- `yazi` - Terminal file manager
- `zoxide` - Smart cd replacement

**System Libraries/Dependencies:** (auto-installed, don't manage manually)
- Various media codecs, graphics libraries, crypto libraries, etc.

### Homebrew Casks
**Use for:** GUI applications.

**Commands:**
```bash
# Install
brew install --cask <cask>

# Update
brew upgrade --cask <cask>

# Remove
brew uninstall --cask <cask>

# List
brew list --cask
```

**Current Applications:**
- `antigravity` - Productivity tool
- `block-goose` - Goose CLI GUI
- `bloom` - Application
- `docker-desktop` - Docker GUI
- `font-fira-code` - Coding font
- `font-fira-code-nerd-font` - Nerd Font variant
- `font-symbols-only-nerd-font` - Nerd Font symbols
- `google-chrome` - Web browser
- `keyboardcleantool` - Keyboard cleaning utility
- `marta` - File manager
- `rectangle` - Window management
- `visual-studio-code` - VS Code stable
- `visual-studio-code@insiders` - VS Code insiders
- `warp` - Modern terminal

### NPM Global Packages
**Use for:** NOTHING. Migrate to Bun.

**Current Status:** ✅ Clean (only npm itself remains)
```
/opt/homebrew/lib
└── npm@11.8.0
```

**Migration Strategy:**
1. Audit existing npm globals: `npm list -g --depth=0`
2. Install equivalent via Bun: `bun install -g <package>`
3. Remove from npm: `npm uninstall -g <package>`
4. Verify binary still works

## Best Practices

### 1. Prefer Local Over Global
If a tool is only needed for one project, install it locally:
```bash
bun install <package>
# Use via: bun run <script> or bunx <package>
```

### 2. Use `bunx` for One-Off Commands
Instead of installing globally:
```bash
bunx create-react-app my-app  # Downloads, runs, discards
```

### 3. Document Project-Specific CLIs
Add to `package.json` scripts:
```json
{
  "scripts": {
    "format": "prettier --write .",
    "lint": "eslint ."
  }
}
```

### 4. Keep Global Installs Updated
```bash
# Bun globals
bun install -g <package>@latest

# Homebrew
brew upgrade

# Check for outdated
brew outdated
```

### 5. Audit Regularly
```bash
# Review what's installed
bun pm ls -g
brew list --formula
brew list --cask

# Remove unused
bun remove -g <package>
brew uninstall <package>
```

### 6. Pin Critical Tools
For CI/CD or critical tools, consider version pinning:
```bash
bun install -g typescript@5.9.2  # Specific version
```

## Maintenance Schedule

**Weekly:**
- Check for Bun global updates: Review changelogs before updating AI assistants

**Monthly:**
- Run `brew update && brew upgrade`
- Audit global packages for unused tools
- Review new AI assistant versions

**Quarterly:**
- Full cleanup: Remove unused globals
- Review local vs. global decisions
- Update this playbook

## Troubleshooting

### Bun Global Not Found
```bash
# Ensure Bun's bin is in PATH
echo $PATH | grep -q "\.bun/bin" || echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Conflicting Versions (Bun vs Homebrew)
```bash
# Check which binary is used
which <command>

# Prefer Bun for JS tools
# Prefer Homebrew for native binaries
```

### Global Install Failed
```bash
# Check Bun cache
bun pm cache rm

# Retry
bun install -g <package>@latest
```

## Anti-Patterns to Avoid

❌ **Don't:** Install every dev tool globally  
✅ **Do:** Use project-local dependencies and `bunx`

❌ **Don't:** Install duplicate tools (e.g., `prettier` in Bun + Homebrew)  
✅ **Do:** Choose one installation method per tool

❌ **Don't:** Install npm globals  
✅ **Do:** Migrate to Bun or Homebrew

❌ **Don't:** Install GUI apps via npm/Bun  
✅ **Do:** Use Homebrew casks

❌ **Don't:** Install system libraries via Bun  
✅ **Do:** Let Homebrew handle native dependencies

## Reference: Current State

**Bun Globals:** 11 packages  
**Homebrew Formulas:** ~130 packages (including dependencies)  
**Homebrew Casks:** 14 applications  
**NPM Globals:** 0 (npm itself doesn't count)

**Status:** ✅ Lean and clean global environment
