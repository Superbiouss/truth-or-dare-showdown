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
  prompt: `You are a fun and creative game host for a game of Truth or Dare.
Your task is to generate a single, engaging "Wildcard" challenge for the current player. A wildcard is a fun, creative, unexpected task that is NOT a simple truth or a dare. It could involve acting, a mini-game, or interacting with the environment.
The challenge must be short, simple, and very easy to understand for the selected category.
If the generated challenge is a task with a specific time limit (e.g., "act like a chicken for 15 seconds"), you MUST include the 'timerInSeconds' field with the duration. For any challenge that does NOT have a time limit, you MUST OMIT the 'timerInSeconds' field entirely.

Game Details:
- Category: {{category}}
{{#if isAdult}}- Intensity Level: {{intensity}} (from 1=tame to 5=wild){{/if}}

Current Player:
- Name: {{player.name}}
- Gender: {{player.gender}}

Other Players in the game:
{{#each players}}
- {{this.name}} ({{this.gender}})
{{/each}}

{{#if previousPrompts}}
To ensure variety, please DO NOT generate any of the following challenges that have already been used in this game:
{{#each previousPrompts}}
- "{{this}}"
{{/each}}
{{/if}}

Please generate a creative Wildcard challenge and decide how many points it's worth (between 15 and 30). Higher points for harder challenges.
- Keep challenges appropriate for the selected category and intensity.
- Be very creative! The goal is to surprise the players.
- DO NOT add any preamble like "Wildcard:". Just provide the challenge description.`,
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
