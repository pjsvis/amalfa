#!/usr/bin/env bun
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const args = process.argv.slice(2);
const query = args[0];

if (!query) {
	console.error("Usage: bun run scripts/test-mcp-search.ts <query>");
	process.exit(1);
}

async function searchGraph(searchQuery: string) {
	console.log(`🔍 Searching for: "${searchQuery}"\n`);

	// Create client and connect to our MCP server
	const transport = new StdioClientTransport({
		command: "bun",
		args: ["run", "src/mcp/index.ts", "serve"],
	});

	const client = new Client(
		{
			name: "test-client",
			version: "1.0.0",
		},
		{
			capabilities: {},
		},
	);

	await client.connect(transport);

	try {
		// Call the search_documents tool
		const result = await client.callTool({
			name: "search_documents",
			arguments: {
				query: searchQuery,
				limit: 5,
			},
		});

		// Parse and display results
		if (
			result.content &&
			Array.isArray(result.content) &&
			result.content.length > 0
		) {
			const text = result.content[0];
			if (
				text &&
				typeof text === "object" &&
				"type" in text &&
				text.type === "text" &&
				"text" in text
			) {
				const results = JSON.parse(text.text as string) as Array<{
					id: string;
					score: string;
					source: string;
					preview: string;
				}>;
				console.log(`📊 Found ${results.length} results:\n`);

				for (const [i, item] of results.entries()) {
					console.log(`${i + 1}. ${item.id} (score: ${item.score})`);
					console.log(`   Source: ${item.source}`);
					console.log(`   Preview: ${item.preview}`);
					console.log();
				}
			}
		} else {
			console.log("No results found.");
		}
	} catch (error) {
		console.error("Search failed:", error);
	} finally {
		await client.close();
	}
}

searchGraph(query);
