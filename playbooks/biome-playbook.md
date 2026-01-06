# Biome Playbook

## Core Philosophy

**Entropy Reduction (PHI-12):** Replace the complex web of ESLint, Prettier, and their associated plugins with a single, high-performance Rust toolchain.

## Core Usage

Default to using Biome for all linting and formatting tasks.

  - **Check & Fix:** Use `biome check --write .` instead of running separate lint and format commands.
  - **CI/CD:** Use `biome ci .` instead of `npm run lint`. (This command exits with an error code if violations are found but does *not* modify files).
  - **Format Only:** Use `biome format --write .` if you only want to normalize whitespace/style.
  - **Lint Only:** Use `biome lint --write .` if you only want to fix code quality issues.

## Configuration (`biome.json`)

Maintain a single, root-level `biome.json`. Avoid nested configurations to prevent "Contextual Brittleness."

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "ignore": ["dist", "node_modules"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 80
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always"
    }
  }
}
```

## IDE Integration (VS Code)

Enforce standards at the "Input Activation Threshold" by configuring VS Code to fix on save. Add this to `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "[javascript]": { "editor.defaultFormatter": "biomejs.biome" },
  "[typescript]": { "editor.defaultFormatter": "biomejs.biome" },
  "[json]": { "editor.defaultFormatter": "biomejs.biome" }
}
```

## Scripts (`package.json`)

Standardize these scripts to ensure "Workflow Durability" across all environments:

```json
"scripts": {
  "format": "biome check --write .",
  "format:check": "biome ci .",
  "lint": "biome lint ."
}
```

-----

### Integration Note

I have synthesized this based on the configuration patterns observed in the `mgrep` repository, specifically the inclusion of VCS integration (`"vcs": { "enabled": true ... }`), which allows Biome to respect your `.gitignore` natively—a critical feature for preventing it from scanning build artifacts.