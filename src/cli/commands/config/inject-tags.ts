import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { injectTag } from "@src/utils/TagInjector";
import { defineCommand } from "citty";

export const injectTagsCommand = defineCommand({
  meta: {
    name: "inject-tags",
    description: "Add metadata tags to markdown file",
  },
  args: {
    path: {
      type: "positional",
      description: "Path to the markdown file",
      required: true,
    },
    tags: {
      type: "positional",
      description: "Tags to inject",
      required: true,
    },
    json: {
      type: "boolean",
      description: "Output results as JSON",
      alias: "j",
    },
  },
  async run({ args, rawArgs }) {
    const { path: filePath, json: jsonOutput } = args;

    // Citty positional args only capture the first one if not properly handled
    // For multiple tags, we need to extract from rawArgs
    const pathIdx = rawArgs.indexOf(filePath);
    const tags = rawArgs.slice(pathIdx + 1).filter((a) => !a.startsWith("-"));

    if (tags.length === 0) {
      if (jsonOutput) {
        console.error(JSON.stringify({ error: "No tags provided" }));
      } else {
        console.error("❌ Error: No tags provided");
      }
      process.exit(1);
    }

    // Resolve to absolute path
    const absolutePath = resolve(process.cwd(), filePath);

    // Check if file exists
    if (!existsSync(absolutePath)) {
      if (jsonOutput) {
        console.error(
          JSON.stringify({ error: "File not found", path: absolutePath }),
        );
      } else {
        console.error(`❌ File not found: ${absolutePath}`);
      }
      process.exit(1);
    }

    // Check if it's a markdown file
    if (!absolutePath.endsWith(".md")) {
      if (jsonOutput) {
        console.error(
          JSON.stringify({ error: "Not a markdown file", path: absolutePath }),
        );
      } else {
        console.error("❌ Not a markdown file (only .md supported)");
      }
      process.exit(1);
    }

    try {
      // Inject each tag
      let successCount = 0;
      for (const tag of tags) {
        const success = injectTag(absolutePath, "tag", tag);
        if (success) {
          successCount++;
        }
      }

      // Output
      if (jsonOutput) {
        console.log(
          JSON.stringify({
            success: true,
            file: absolutePath,
            tags_injected: successCount,
            tags,
          }),
        );
      } else {
        console.log(
          `\n✅ Successfully injected ${successCount} tag(s) into: ${filePath}`,
        );
        console.log("\nTags:");
        for (const tag of tags) {
          console.log(`  • ${tag}`);
        }
        console.log(
          "\n💡 Tip: Re-run 'amalfa init' to index the updated metadata\n",
        );
      }
    } catch (error) {
      if (jsonOutput) {
        console.error(
          JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            file: absolutePath,
          }),
        );
      } else {
        console.error(
          "❌ Tag injection failed:",
          error instanceof Error ? error.message : error,
        );
      }
      process.exit(1);
    }
  },
});

// Legacy export
export async function cmdInjectTags(args: string[]) {
  if (injectTagsCommand.run) {
    const filePath = args.find((arg) => !arg.startsWith("--"));
    return injectTagsCommand.run({
      rawArgs: args,
      args: {
        _: args,
        path: filePath || "",
        tags: "", // dummy
        json: args.includes("--json"),
        j: args.includes("--json"),
      } as any,
      cmd: injectTagsCommand,
      data: {},
    });
  }
}
