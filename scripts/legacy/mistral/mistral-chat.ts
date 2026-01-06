import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";
import { Mistral } from "@mistralai/mistralai";

// --- Configuration ---

// 1. Set up the Mistral Client
// This reads the API key from your environment variables.
const apiKey = process.env.MISTRAL_API_KEY;

if (!apiKey) {
	console.error(
		"\x1b[31mERROR: MISTRAL_API_KEY is not set in the environment variables.\x1b[0m",
	);
	console.error(
		'Please create a .env file in the project root and add your key, e.g., MISTRAL_API_KEY="your_key_here"',
	);
	process.exit(1);
}

const client = new Mistral({
	apiKey: apiKey,
	// Add retries for network resilience
	timeoutMs: 120 * 1000, // 2-minute timeout
});

// 2. Define the Agent ID
// This is the specific ID of the pre-configured agent you want to chat with.
const agentId = "ag_019aee445f3b70cd920088955507b5e9";

// --- Helper Functions ---

/**
 * Reads multi-line input from the user via the console.
 * @param rl - The readline interface instance.
 * @returns A promise that resolves to the complete multi-line string.
 */
async function readMultiLineInput(rl: readline.Interface): Promise<string> {
	const lines: string[] = [];
	console.log("\nYou (press Enter on an empty line to send):");

	while (true) {
		const line = await rl.question("> ");
		if (line.trim() === "") {
			break;
		}
		lines.push(line);
	}
	return lines.join("\n");
}

// --- Main Application Logic ---

/**
 * Starts and manages a fully interactive chat session with a Mistral Agent.
 */
async function startInteractiveChat() {
	const rl = readline.createInterface({ input, output });
	console.log("\x1b[36m--- Mistral Agent Interactive Chat ---\x1b[0m");
	console.log(`Connecting to agent: \x1b[33m${agentId}\x1b[0m`);
	console.log("Type 'exit' or 'quit' on a new line to end the session.");

	let conversationId: string | null = null;

	try {
		// --- Step 1: Start the conversation ---
		const initialInput = await readMultiLineInput(rl);

		if (["exit", "quit"].includes(initialInput.toLowerCase())) {
			console.log("\nExiting without starting a conversation. Goodbye!");
			return;
		}

		try {
			console.log("\n\x1b[90m> Initializing session, please wait...\x1b[0m");
			const startResponse = await client.beta.conversations.start({
				agentId: agentId,
				inputs: initialInput,
			});

			conversationId = startResponse.conversationId;
			const firstMessage = startResponse.outputs?.find(
				(o) => o.type === "message.output",
			);
			const content = (firstMessage as { content?: string })?.content;

			if (content) {
				console.log(`\n\x1b[32mAgent:\x1b[0m ${content}`);
			} else {
				console.log(
					"\n\x1b[90mAgent did not provide an initial message.\x1b[0m",
				);
			}
		} catch (startError) {
			console.error("\n\x1b[31m--- SESSION START FAILED ---\x1b[0m");
			console.error(
				"Could not start a conversation with the agent:",
				startError,
			);
			return; // Exit if we can't even start the session
		}

		// --- Step 2: Loop for continuous interaction ---
		while (true) {
			if (!conversationId) {
				throw new Error("FATAL: Conversation ID was lost. Cannot continue.");
			}

			const userInput = await readMultiLineInput(rl);

			if (["exit", "quit"].includes(userInput.toLowerCase())) {
				console.log("\nEnding conversation. Goodbye!");
				break;
			}

			if (userInput.trim() === "") {
				console.log("\nEmpty message. Please type something to send.");
				continue;
			}

			// --- Per-message error handling ---
			try {
				console.log("\n\x1b[90m> Sending...\\x1b[0m");

				// VERIFIED FIX: The correct method to continue a conversation
				// is `client.beta.conversations.append()`.
				const appendResponse = await client.beta.conversations.append({
					conversationId: conversationId,
					conversationAppendRequest: {
						inputs: userInput,
					},
				});

				// The response structure of `append` is the same as `start`.
				const reply = appendResponse.outputs?.find(
					(o) => o.type === "message.output",
				);
				const content = (reply as { content?: string })?.content;

				if (content) {
					console.log(`\n\x1b[32mAgent:\x1b[0m ${content}`);
				} else {
					console.log(
						"\n\x1b[90mAgent did not provide a standard text response.\x1b[0m",
					);
					console.log("Full response object:", appendResponse);
				}
			} catch (messageError) {
				console.error("\n\x1b[31m--- MESSAGE SEND FAILED ---\x1b[0m");
				console.error("Could not send message. Please try again.");
				console.error("Details:", messageError);
			}
		}
	} catch (fatalError) {
		console.error("\n\x1b[31m--- FATAL CHAT ERROR ---\x1b[0m");
		console.error("An unexpected and unrecoverable error occurred:");
		console.error(fatalError);
	} finally {
		// Ensure the readline interface is always closed on exit.
		rl.close();
	}
}

// Run the main chat application.
startInteractiveChat();
