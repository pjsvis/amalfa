/**
 * script: setup_mcp.ts
 *
 * The "Handshake" Script.
 *
 * Usage: bun run scripts/setup_mcp.ts
 *
 * Purpose:
 * Generates the specific JSON configuration block needed to add THIS
 * PolyVis instance to an MCP client (Claude Desktop, Cursor, etc.).
 *
 * It solves the "Portable" problem by dynamically detecting the
 * absolute path of the current installation.
 */

import { resolve } from "node:path";

const cwd = resolve(process.cwd());
const mcpScript = resolve(cwd, "src/mcp/index.ts");
const _bunPath = process.execPath; // "bun" executable path

const config = {
	mcpServers: {
		polyvis: {
			command: "bun",
			args: ["run", mcpScript],
			env: {
				PATH: process.env.PATH, // Inherit path to find tools
				// Add specific env vars here if needed
			},
		},
	},
};

console.log("\n✅ PolyVis Portable Setup");
console.log("----------------------------------------");
console.log(`📂 Location: ${cwd}`);
console.log("----------------------------------------");
console.log("\n📋 COPY THE JSON BELOW into your MCP Client Config:");
console.log(
	"   - Claude Desktop: ~/Library/Application Support/Claude/claude_desktop_config.json",
);
console.log("   - Other Clients:  Check their 'mcpServers' configuration.");
console.log("\n----------------------------------------\n");

console.log(JSON.stringify(config, null, 4));

console.log("\n----------------------------------------");
console.log("👉 Tip: This configuration will work only on THIS machine.");
console.log("        If you move the folder, run this script again.");
console.log("----------------------------------------\n");
