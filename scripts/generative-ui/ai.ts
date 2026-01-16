/**
 * ai.ts
 * The "Brain": Gemini Integration with Strict Schema Enforcement
 */
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { z } from "zod";
import type { ScreenDef } from "./layout-engine";
import { ScreenSchema } from "./layout-engine";

// 1. Initialize Gemini (lazy-loaded to ensure .env is processed)
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found in environment");
  }
  console.log('🔑 API Key loaded:', apiKey.substring(0, 10) + '...');
  return new GoogleGenerativeAI(apiKey);
}

// 2. Define the Schema for the Model
// We map our Zod schema to the Gemini SDK's expected format.
// This ensures the model *cannot* hallucinate invalid fields.
const modelSchema: any = {
  description: "A definition of a server-driven UI screen.",
  type: SchemaType.OBJECT,
  properties: {
    screenTitle: { type: SchemaType.STRING, description: "Title of the dashboard/page" },
    sections: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          layout: { type: SchemaType.STRING, enum: ["single", "two-column", "three-column", "grid"] },
          children: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                type: { type: SchemaType.STRING, enum: ["StatCard", "DataGrid", "Markdown", "ActionPanel"] },
                props: { type: SchemaType.STRING }
              },
              required: ["type", "props"]
            }
          }
        },
        required: ["id", "layout", "children"]
      }
    }
  },
  required: ["screenTitle", "sections"]
};

const SYSTEM_PROMPT = `
You are an expert UI Designer and Data Analyst.
Your job is to generate a JSON definition for a dashboard based on the user's request.

You have access to the following component library:

1. StatCard: For single metrics. Props: { title, value, trend (number), trendDirection ('up'|'down'|'neutral') }
2. DataGrid: For tables. Props: { title, columns (string[]), rows (object[]) }
3. ActionPanel: For suggested user actions. Props: { prompt, buttons: [{ label, endpoint, variant, method }] }
   - For 'endpoint', invent a plausible API path (e.g., '/api/actions/export')
   - For 'variant', use ONLY: 'default', 'primary', 'destructive', 'ghost', or 'outline'
   - For 'method', use: 'GET', 'POST', 'PUT', or 'DELETE' (default: 'POST')
4. Markdown: For text explanations. Props: { content }

RULES:
- Be concise
- Choose the best layout for the data: 'single', 'two-column', 'three-column', or 'grid'
- If the user asks for analysis, perform it and display the result in a Markdown component or StatCard
- CRITICAL: Use ONLY the valid variant values listed above
`;

// 4. The Generator Function
export async function generateScreen(userPrompt: string): Promise<ScreenDef> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
    systemInstruction: SYSTEM_PROMPT + `\n\nReturn JSON matching this structure:\n${JSON.stringify(modelSchema, null, 2)}`,
  });

  try {
    const result = await model.generateContent(userPrompt);
    const json = JSON.parse(result.response.text());
    
    console.log('Raw AI response:', JSON.stringify(json, null, 2));
    
    const validated = ScreenSchema.parse(json);
    
    return validated;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Fallback UI in case of failure
    return {
      screenTitle: "System Error",
      sections: [{
        id: "error",
        layout: "single",
        children: [{ type: "Markdown", props: { content: `**Error generating UI:** ${errorMessage}` } }]
      }]
    };
  }
}