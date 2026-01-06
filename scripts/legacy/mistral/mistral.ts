import { Mistral } from "@mistralai/mistralai";

const apiKey = process.env.MISTRAL_API_KEY;

if (!apiKey) {
	throw new Error("MISTRAL_API_KEY is not set in the environment variables.");
}

const client = new Mistral({
	apiKey: apiKey,
});

const response = await client.beta.conversations.start({
	agentId: "ag_019aee445f3b70cd920088955507b5e9",
	inputs: "Hello there!",
});

console.log(response);
