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
  prompt: `Your sole task is to generate a single JSON object for a "Wildcard" challenge in a party game.
Adhere strictly to the following Zod schema for your output.

\`{
  "challenge": "z.string() // The creative wildcard challenge.",
  "points": "z.number().int().min(15).max(30) // Points for completion.",
  "timerInSeconds": "z.number().optional() // OMIT this field unless the task has a specific time limit."
}\`

**CRITICAL RULES:**
1.  **JSON ONLY:** Your entire response MUST be a single, valid JSON object. Do not include any text, markdown, or any other characters before or after the JSON.
2.  **TIMER:** Only include the \`timerInSeconds\` field if the task has an explicit, specific duration. For all other challenges, you MUST OMIT this field from the JSON.
3.  **POINTS:** Award points between 15 and 30 based on the challenge's difficulty.
4.  **NO REPEATS:** Do not generate any of the challenges from the \`previousPrompts\` list.
5.  **BE CREATIVE:** Think outside the box. The goal is to surprise the players with something fun and unexpected.

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
