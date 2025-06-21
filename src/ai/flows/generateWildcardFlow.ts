'use server';
/**
 * @fileOverview Generates a wildcard challenge using an AI model.
 *
 * - generateWildcard - A function that creates a unique challenge.
 * - GenerateWildcardInput - The input type for the generateWildcard function.
 * - GenerateWildcardOutput - The return type for the generateWildcard function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const PlayerPromptSchema = z.object({
    name: z.string(),
    gender: z.enum(['male', 'female']),
});

const GenerateWildcardInputSchema = z.object({
  player: PlayerPromptSchema,
  category: z.enum(['kids', 'teens', '18+']),
  intensity: z.number().min(1).max(5),
  players: z.array(PlayerPromptSchema),
  previousPrompts: z.array(z.string()).optional().describe('A list of challenges that have already been used in this game.')
});
export type GenerateWildcardInput = z.infer<typeof GenerateWildcardInputSchema>;

const GenerateWildcardOutputSchema = z.object({
  challenge: z.string().describe('The generated wildcard challenge. This should be a creative, unexpected task.'),
  points: z.number().int().min(15).max(30).describe('The points awarded for completing the challenge, between 15 and 30.'),
  timerInSeconds: z.number().optional().describe("IMPORTANT: OMIT this field entirely unless the task has a very specific, explicit time limit. For most challenges, this field should not be present in the JSON."),
});
export type GenerateWildcardOutput = z.infer<typeof GenerateWildcardOutputSchema>;

export async function generateWildcard(input: GenerateWildcardInput): Promise<GenerateWildcardOutput> {
  return generateWildcardFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWildcardPrompt',
  input: { schema: GenerateWildcardInputSchema.extend({ isAdult: z.boolean() }) },
  output: { schema: GenerateWildcardOutputSchema },
  prompt: `You are an AI assistant that ONLY responds with a single, valid JSON object that strictly adheres to the Zod schema provided below. Do not include any other text, markdown, or explanations.

**Zod Schema:**
\`\`\`json
{
  "challenge": "z.string() // The creative wildcard challenge.",
  "points": "z.number().int().min(15).max(30) // Points for completion.",
  "timerInSeconds": "z.number().optional() // IMPORTANT: OMIT this field unless the task has a specific time limit."
}
\`\`\`

**CRITICAL RULES:**
1.  **JSON ONLY:** Your entire response MUST be a single, valid JSON object and nothing else.
2.  **NO TIMER BY DEFAULT:** OMIT the \`timerInSeconds\` field unless the challenge requires a specific time duration.
3.  **POINTS:** Award points between 15 and 30 based on the challenge's difficulty and creativity.
4.  **NO REPEATS:** Do not generate any challenges from the \`previousPrompts\` list.
5.  **BE CREATIVE:** Think outside the box. The goal is to surprise players with something fun and unexpected.

**GOOD EXAMPLES:**
- \`{"challenge": "Invent a new handshake with the player to your left.", "points": 20}\`
- \`{"challenge": "For the rest of the round, you must speak in a pirate accent.", "points": 25}\`
- \`{"challenge": "Create a 15-second TikTok dance on the spot.", "points": 20, "timerInSeconds": 15}\`

**GAME CONTEXT:**
-   **Category:** {{category}}
{{#if isAdult}}-   **Intensity Level (1=tame, 5=wild):** {{intensity}}{{/if}}
-   **Current Player:** {{player.name}} ({{player.gender}})
-   **Other Players:**
    {{#each players}}
    -   {{this.name}} ({{this.gender}})
    {{/each}}
{{#if previousPrompts}}
-   **Previously Used Prompts (DO NOT REPEAT):**
    {{#each previousPrompts}}
    -   "{{this}}"
    {{/each}}
{{/if}}

Generate the JSON response now.`,
});

const generateWildcardFlow = ai.defineFlow(
  {
    name: 'generateWildcardFlow',
    inputSchema: GenerateWildcardInputSchema,
    outputSchema: GenerateWildcardOutputSchema,
  },
  async (input) => {
    const { output } = await prompt({ ...input, isAdult: input.category === '18+' });
    return output!;
  }
);
