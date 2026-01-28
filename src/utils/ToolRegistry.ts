import type {
	ToolImplementation,
	ToolRegistry,
	ToolSchema,
} from "@src/types/tools";
import { getLogger } from "./Logger";

export class DynamicToolRegistry implements ToolRegistry {
	private tools = new Map<string, ToolImplementation>();
	private log = getLogger("ToolRegistry");

	register(tool: ToolImplementation): void {
		if (this.tools.has(tool.schema.name)) {
			this.log.warn({ tool: tool.schema.name }, "Overwriting existing tool");
		}
		this.tools.set(tool.schema.name, tool);
		this.log.debug({ tool: tool.schema.name }, "Registered tool");
	}

	get(name: string): ToolImplementation | undefined {
		return this.tools.get(name);
	}

	list(): ToolSchema[] {
		return Array.from(this.tools.values()).map((t) => t.schema);
	}
}

export const toolRegistry = new DynamicToolRegistry();
