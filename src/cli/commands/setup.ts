export async function cmdSetupMcp(args: string[]) {
	const { resolve } = await import("node:path");

	const cwd = resolve(process.cwd());
	const mcpScript = resolve(cwd, "src/mcp/index.ts");

	// Minimal PATH for MCP - only include essential directories
	const bunPath = process.execPath.replace(/\/bun$/, ""); // Directory containing bun
	const minimalPath = [
		bunPath,
		"/usr/local/bin",
		"/usr/bin",
		"/bin",
		"/usr/sbin",
		"/sbin",
		"/opt/homebrew/bin", // Apple Silicon Homebrew
	].join(":");

	const config = {
		mcpServers: {
			amalfa: {
				command: "bun",
				args: ["run", "--cwd", cwd, mcpScript],
				env: {
					PATH: minimalPath,
				},
			},
		},
	};

	console.log("\n✅ AMALFA MCP Configuration");
	console.log("=".repeat(60));
	console.log(`📂 Installation: ${cwd}`);
	console.log("=".repeat(60));
	console.log("\n📋 Copy this JSON to your MCP client config:");
	console.log(
		"   Claude Desktop: ~/Library/Application Support/Claude/claude_desktop_config.json",
	);
	console.log("   Warp Preview: MCP settings\n");
	console.log("=".repeat(60));
	console.log();

	console.log(JSON.stringify(config, null, 2));

	console.log();
	console.log("=".repeat(60));
	console.log("💡 Tip: If you move this folder, run 'amalfa setup-mcp' again");
	console.log("=".repeat(60));
	console.log();
}
