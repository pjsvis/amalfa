import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
console.log("API Key:", apiKey.substring(0, 15) + "...");

const genAI = new GoogleGenerativeAI(apiKey);

const modelNames = [
  "gemini-pro",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "models/gemini-pro",
  "models/gemini-1.5-pro",
  "models/gemini-1.5-flash",
];

async function testModel(modelName: string) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Say hello");
    console.log(`✅ ${modelName}: ${result.response.text().substring(0, 50)}`);
    return true;
  } catch (error: any) {
    console.log(`❌ ${modelName}: ${error.message.substring(0, 100)}`);
    return false;
  }
}

async function main() {
  for (const name of modelNames) {
    const success = await testModel(name);
    if (success) {
      console.log(`\n✨ Working model found: ${name}`);
      break;
    }
  }
}

main().catch(console.error);
