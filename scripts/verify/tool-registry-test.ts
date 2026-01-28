import { toolRegistry } from "@src/utils/ToolRegistry";
import { toolRegistry as instance } from "@src/utils/ToolRegistry";

console.log("🚀 Testing Tool Registry...");

const echoTool = {
    schema: {
        name: "echo",
        description: "Echoes input back",
        inputSchema: {
            type: "object" as const,
            properties: {
                message: { type: "string" }
            },
            required: ["message"]
        }
    },
    handler: async (args: any) => {
        return { message: `Echo: ${args.message}` };
    }
};

toolRegistry.register(echoTool);
console.log("✅ Tool registered");

const tools = toolRegistry.list();
if (tools.length !== 1 || tools[0]?.name !== "echo") {
    throw new Error("List failed");
}
console.log("✅ Tool listing correct");

const tool = toolRegistry.get("echo");
if (!tool) throw new Error("Get failed");

const result = await tool.handler({ message: "Hello" });
if (result.message !== "Echo: Hello") {
    throw new Error("Execution failed");
}
console.log("✅ Tool execution verified");
