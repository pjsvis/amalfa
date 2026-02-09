import { loadConfig } from "@src/config/defaults";

export async function cmdListSources(args: string[]) {
  const jsonOutput = args.includes("--json");

  try {
    const config = await loadConfig();
    const sources = config.sources || ["./docs"];

    if (jsonOutput) {
      console.log(JSON.stringify({ sources }, null, 2));
    } else {
      console.log("\n📁 Configured Source Directories:\n");
      for (const source of sources) {
        console.log(`  • ${source}`);
      }
      console.log(
        "\n💡 Sources are defined in amalfa.config.json or defaults to ./docs\n",
      );
    }
  } catch (error) {
    if (jsonOutput) {
      console.error(
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    } else {
      console.error(
        "❌ Failed to load config:",
        error instanceof Error ? error.message : error,
      );
    }
    process.exit(1);
  }
}
