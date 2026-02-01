export interface ToolSchema {
	name: string;
	description: string;
	inputSchema: {
		type: "object";
		properties: Record<string, unknown>;
		required?: string[];
	};
}

export interface ToolImplementation {
	schema: ToolSchema;
	handler: (args: any) => Promise<any>;
}

export interface ToolRegistry {
	register(tool: ToolImplementation): void;
	get(name: string): ToolImplementation | undefined;
	list(): ToolSchema[];
}
