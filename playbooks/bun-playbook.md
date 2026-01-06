# Bun Playbook

## Core Usage

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts
import { test, expect } from "bun:test";
## 4. Process Management & Zombie Defense

### Dev Server Management
The `dev` script now supports subcommands for better process control:
-   `bun run dev start` (Default): Starts the server and watchers.
-   `bun run dev stop`: Kills the server running on port 3000.
-   `bun run dev restart`: Stops and then starts.
-   `bun run dev status`: Checks if the server is running.

### The "Zombie" Problem
In Bun, file handles (especially to SQLite DBs or SHM files) can persist if a process crashes hard or is detached. This causes "Disk I/O Errors" for future processes.

### The Solution: `ZombieDefense`
Use `src/utils/ZombieDefense.ts` to enforce a clean environment before critical operations.

```typescript
import { ZombieDefense } from "@src/utils/ZombieDefense";

// In your startup logic:
await ZombieDefense.assertClean("MyService", true); // true = interactive mode
```

### Whitelist
The defense system kills any `bun` process NOT in the whitelist. If adding a new persistent service, update `ZombieDefense.WHITELIST`.
test("hello world", () => {
  expect(1).toBe(1);
});
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.md`.
