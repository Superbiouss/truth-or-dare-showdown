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
  prompt: `You are an AI assistant that ONLY responds with a single, valid JSON object. Do not output markdown, text, or any characters before or after the JSON object.

Your task is to generate a "Wildcard" challenge for a party game. A wildcard is a unique, fun, and surprising task—NOT a truth or a dare.

The JSON object MUST conform to this Zod schema:
\`{
  "challenge": "z.string() // The creative wildcard challenge.",
  "points": "z.number().int().min(15).max(30) // Points for completion.",
  "timerInSeconds": "z.number().optional() // MUST be omitted unless the task has a specific time limit."
}\`

**INSTRUCTIONS:**
1.  **Points:** Award points between 15 and 30 based on the challenge's difficulty and creativity.
2.  **Timed Tasks:** If the challenge has a specific time limit, you MUST include the 'timerInSeconds' field. For all other challenges, you MUST OMIT the 'timerInSeconds' field.
3.  **Be Creative:** Think outside the box. The goal is to surprise the players with something fun and unexpected.
4.  **Avoid Repetition:** Do NOT generate any of the challenges from the \`previousPrompts\` list provided in the context.

**GAME CONTEXT:**
-   **Category:** {{category}}
{{#if isAdult}}-   **Intensity Level (1=tame to 5=wild):** {{intensity}}{{/if}}
-   **Current Player:** {{player.name}} ({{player.gender}})
-   **Other Players:**
    {{#each players}}
    -   {{this.name}} ({{this.gender}})
    {{/each}}
{{#if previousPrompts}}
-   **Previously Used Prompts (Do Not Repeat):**
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
