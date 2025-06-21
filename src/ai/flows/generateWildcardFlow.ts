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
  timerInSeconds: z.number().optional().describe('If the challenge is a timed challenge, the duration in seconds. Otherwise, this should be omitted.'),
});
export type GenerateWildcardOutput = z.infer<typeof GenerateWildcardOutputSchema>;

export async function generateWildcard(input: GenerateWildcardInput): Promise<GenerateWildcardOutput> {
  return generateWildcardFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWildcardPrompt',
  input: { schema: GenerateWildcardInputSchema.extend({ isAdult: z.boolean() }) },
  output: { schema: GenerateWildcardOutputSchema },
  prompt: `You are a wildly creative assistant for a party game. Your goal is to generate a single, engaging "Wildcard" challenge. A wildcard is NOT a truth or a dare, but a unique, fun, and surprising task.

The challenge must be short, simple, and very easy to understand for the selected category.

**IMPORTANT RULES:**
1.  **JSON Output:** Your response MUST be a valid JSON object matching this schema: \`{ "challenge": "The challenge description", "points": (number, 15-30), "timerInSeconds": (number, optional) }\`.
2.  **No Extra Text:** Do NOT add any preamble like "Wildcard:". Your entire output must be only the JSON object.
3.  **Points:** Award points between 15 and 30 based on the challenge's difficulty.
4.  **Timer Logic:**
    *   If the generated challenge is a task with a specific time limit (e.g., "act like a chicken for 15 seconds"), you MUST include the 'timerInSeconds' field with the duration.
    *   For any challenge that does NOT have a time limit, you MUST OMIT the 'timerInSeconds' field entirely.
5.  **Be Creative:** Think outside the box. The goal is to surprise the players.
6.  **Avoid Repetition:** DO NOT generate any of the challenges from the \`previousPrompts\` list.

**GAME CONTEXT:**
-   **Category:** {{category}}
{{#if isAdult}}-   **Intensity Level:** {{intensity}} (from 1=tame to 5=wild){{/if}}
-   **Current Player:** {{player.name}} ({{player.gender}})
-   **Other Players:**
    {{#each players}}
    -   {{this.name}} ({{this.gender}})
    {{/each}}
{{#if previousPrompts}}
-   **Previous Prompts (Do Not Use):**
    {{#each previousPrompts}}
    -   "{{this}}"
    {{/each}}
{{/if}}

Generate the JSON for the Wildcard challenge now.`,
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
