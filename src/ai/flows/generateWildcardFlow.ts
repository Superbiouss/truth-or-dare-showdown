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
  timerInSeconds: z.number().optional().describe("Include this field only if the task has a specific time limit. Omit it otherwise."),
});
export type GenerateWildcardOutput = z.infer<typeof GenerateWildcardOutputSchema>;

export async function generateWildcard(input: GenerateWildcardInput): Promise<GenerateWildcardOutput> {
  return generateWildcardFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWildcardPrompt',
  input: { schema: GenerateWildcardInputSchema.extend({ isAdult: z.boolean() }) },
  output: { schema: GenerateWildcardOutputSchema },
  prompt: `You are a creative and unpredictable AI for a party game.

Generate a single, fun, and unexpected "wildcard" challenge for {{player.name}}. The challenge should be something creative they have to do.

Based on the difficulty, award between 15 and 30 points. If the challenge requires a specific time limit (e.g., "create a TikTok dance in 15 seconds"), include a \`timerInSeconds\` value. Otherwise, do not include it.

**Game Details:**
-   **Category:** {{category}}
{{#if isAdult}}-   **Intensity Level (1=tame, 5=wild):** {{intensity}}{{/if}}
-   **Current Player:** {{player.name}} ({{player.gender}})
-   **Other Players:**
    {{#each players}}
    -   {{this.name}} ({{this.gender}})
    {{/each}}
{{#if previousPrompts}}
-   **Do not repeat these previous challenges:**
    {{#each previousPrompts}}
    -   "{{this}}"
    {{/each}}
{{/if}}
`,
});

const generateWildcardFlow = ai.defineFlow(
  {
    name: 'generateWildcardFlow',
    inputSchema: GenerateWildcardInputSchema,
    outputSchema: GenerateWildcardOutputSchema,
  },
  async (input) => {
    const { output } = await prompt({ ...input, isAdult: input.category === '18+' });

    // Post-processing to ensure timer is only present when needed.
    if (output) {
        // Check if the prompt text explicitly mentions a time duration.
        const hasTimeMention = /second|minute/i.test(output.challenge);
        // If there's no time mention but the AI included a timer, remove it.
        if (!hasTimeMention && typeof output.timerInSeconds === 'number') {
            delete output.timerInSeconds;
        }
    }
    
    return output!;
  }
);
