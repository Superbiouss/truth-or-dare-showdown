'use server';
/**
 * @fileOverview Generates truth or dare prompts using an AI model.
 *
 * - generatePrompt - A function that creates a truth or dare question.
 * - GeneratePromptInput - The input type for the generatePrompt function.
 * - GeneratePromptOutput - The return type for the generatePrompt function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const PlayerPromptSchema = z.object({
    name: z.string(),
    gender: z.enum(['male', 'female']),
});

const GeneratePromptInputSchema = z.object({
  player: PlayerPromptSchema,
  category: z.enum(['kids', 'teens', '18+']),
  intensity: z.number().min(1).max(5),
  promptType: z.enum(['truth', 'dare']),
  players: z.array(PlayerPromptSchema),
  previousPrompts: z.array(z.string()).optional().describe('A list of prompts that have already been used in this game.')
});
export type GeneratePromptInput = z.infer<typeof GeneratePromptInputSchema>;

const GeneratePromptOutputSchema = z.object({
  prompt: z.string().describe('The generated truth or dare question.'),
  timerInSeconds: z.number().optional().describe("Include this field only if the task has a specific time limit (e.g., 'stare for 30 seconds'). Omit it otherwise."),
});
export type GeneratePromptOutput = z.infer<typeof GeneratePromptOutputSchema>;


export async function generatePrompt(input: GeneratePromptInput): Promise<GeneratePromptOutput> {
  return generatePromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePrompt',
  input: { schema: GeneratePromptInputSchema.extend({ isAdult: z.boolean() }) },
  output: { schema: GeneratePromptOutputSchema },
  prompt: `You are a creative and witty AI for a game of Truth or Dare.

Generate a single, fun, and engaging '{{promptType}}' question for {{player.name}}.

The question should be short and surprising. If the dare requires a specific time limit (e.g., "stare at the wall for 30 seconds"), include a \`timerInSeconds\` value. Otherwise, do not include it.

**Game Details:**
-   **Category:** {{category}}
{{#if isAdult}}-   **Intensity Level (1=tame, 5=wild):** {{intensity}}{{/if}}
-   **Current Player:** {{player.name}} ({{player.gender}})
-   **Other Players:**
    {{#each players}}
    -   {{this.name}} ({{this.gender}})
    {{/each}}
{{#if previousPrompts}}
-   **Do not repeat these previous prompts:**
    {{#each previousPrompts}}
    -   "{{this}}"
    {{/each}}
{{/if}}
`,
});

const generatePromptFlow = ai.defineFlow(
  {
    name: 'generatePromptFlow',
    inputSchema: GeneratePromptInputSchema,
    outputSchema: GeneratePromptOutputSchema,
  },
  async (input) => {
    const { output } = await prompt({ ...input, isAdult: input.category === '18+' });
    return output!;
  }
);
