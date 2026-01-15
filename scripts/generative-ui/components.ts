import { z } from 'zod';
import {ActionSchema, VariantSchema } from './action-schema'; 
// --- COMPONENTS ---

// 1. The Info Card (For summaries, stats, small data)
export const StatCardSchema = z.object({
  type: z.literal('StatCard'),
  props: z.object({
    title: z.string(),
    value: z.string().or(z.number()),
    trend: z.number().optional().describe("Percentage change, e.g., +12%"),
    trendDirection: z.enum(['up', 'down', 'neutral']).optional(),
  }),
});

// 2. The Data Grid (For tabular data)
export const DataGridSchema = z.object({
  type: z.literal('DataGrid'),
  props: z.object({
    title: z.string().optional(),
    columns: z.array(z.string()).describe("Header labels"),
    rows: z.array(z.record(z.string().or(z.number()))).describe("Row data matching columns"),
    actions: z.array(ActionSchema).optional().describe("Row-level or table-level actions"),
  }),
});

// 3. The Markdown Block (For text generation, explanations)
export const MarkdownSchema = z.object({
  type: z.literal('Markdown'),
  props: z.object({
    content: z.string().describe("Raw markdown string"),
  }),
});

// 4. The Action Panel (For user choices/inputs)
export const ActionPanelSchema = z.object({
  type: z.literal('ActionPanel'),
  props: z.object({
    prompt: z.string().describe("Question or instruction for the user"),
    buttons: z.array(ActionSchema),
  }),
});

// Union of all possible leaf components
export const ComponentNodeSchema = z.discriminatedUnion('type', [
  StatCardSchema,
  DataGridSchema,
  MarkdownSchema,
  ActionPanelSchema,
]);