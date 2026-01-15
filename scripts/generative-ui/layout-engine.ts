import {ComponentNodeSchema} from './components';
import {z} from 'zod';

// --- LAYOUT ---

const SectionSchema = z.object({
  id: z.string(),
  layout: z.enum(['single', 'two-column', 'three-column', 'grid']),
  title: z.string().optional(),
  description: z.string().optional(),
  // The content of this section is a list of components
  children: z.array(ComponentNodeSchema),
});

// --- THE ROOT OUTPUT ---
// This is what we ask Gemini to generate.
export const ScreenSchema = z.object({
  screenTitle: z.string(),
  sections: z.array(SectionSchema),
});

export type ScreenDef = z.infer<typeof ScreenSchema>;