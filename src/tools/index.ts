import { toolRegistry } from "@src/utils/ToolRegistry";
import { EmberExtractTool } from "./EmberExtractTool";

export function registerAllTools() {
	toolRegistry.register(EmberExtractTool);
}
