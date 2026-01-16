# CLI Commands Directory

⚠️ **DO NOT DELETE THESE FILES** ⚠️

This directory contains modular CLI command implementations that are imported by `src/cli.ts`.

## Files

- `doctor.ts` - Installation and configuration health checks
- `init.ts` - Database initialization from markdown files
- `server.ts` - MCP server management (serve, servers status, stop-all)
- `services.ts` - Service lifecycle management (daemon, vector, sonar, ember)
- `setup.ts` - MCP configuration generator
- `stats.ts` - Database statistics display
- `validate.ts` - Pre-publish validation gates
- `enhance.ts` - Graph enhancement strategies

## History

These files were factored out from a monolithic `cli.ts` file during the Phase 6 refactoring (commit `8ecd54b`).

**IMPORTANT**: If `cli.ts` imports fail, these files are missing. Recover with:
```bash
git checkout 6d412e3 -- src/cli/commands/
```

## Recent Issues

- **2026-01-16**: Files were accidentally deleted twice. This README added to prevent future deletion.
- If you need to modify CLI behavior, edit these files - don't delete and recreate in `cli.ts`!
