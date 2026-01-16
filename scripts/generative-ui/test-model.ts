import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  const models = await genAI.listModels();
  console.log("Available models:");
  for (const model of models) {
    console.log(`- ${model.name}`);
  }
}

listModels().catch(console.error);
