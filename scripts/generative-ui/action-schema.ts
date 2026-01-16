import { z } from 'zod';

// --- PRIMITIVES ---

/**
 * Defines an interaction trigger.
 * Maps directly to DataStar 'data-fetch' or Hono routes.
 */
export const ActionSchema = z.object({
  label: z.string().describe("Text to display on the button/link"),
  endpoint: z.string().describe("The Hono route ID to hit (e.g., '/api/sort-table')"),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('POST'),
  payload: z.record(z.any()).optional().describe("Static data to send with the request"),
  variant: z.enum(['default', 'primary', 'destructive', 'ghost', 'outline']).default('default'),
});

/**
 * Standard visual styles to constrain the Agent's creativity to our design system.
 */
export const VariantSchema = z.enum(['default', 'primary', 'destructive', 'ghost', 'outline']);