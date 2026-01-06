import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
	process.env.SKIP_ZOMBIE_CHECK = "true"; // Bypass zombie defense for testing
	const query = process.argv[2] || "status";
	console.error("🔍 Testing MCP Query:", query);

	// Transport spawns the process
	const transport = new StdioClientTransport({
		command: "bun",
		args: ["run", "src/mcp/index.ts", "serve"],
	});

	const client = new Client(
		{ name: "test-client", version: "1.0.0" },
		{ capabilities: {} },
	);

	console.error("🔌 Connecting...");
	await client.connect(transport);
	console.error("✅ Connected!");

	// List tools to verify discovery
	const tools = await client.listTools();
	console.error(`🛠️  Found ${tools.tools.length} tools.`);

	// Execute Search
	console.error(`🚀 Calling search_documents('${query}')...`);
	const result = await client.callTool({
		name: "search_documents",
		arguments: { query: query },
	});

	// Output result to stdout (for humans)
	// console.log(JSON.stringify(result, null, 2));

	// Format strictly
	const content = (result as { content: { type: string; text?: string }[] })
		.content[0];
	if (content && content.type === "text") {
		console.log(content.text);
	} else {
		console.log("Non-text response or empty:", content);
	}

	await client.close();
}

main().catch(console.error);
