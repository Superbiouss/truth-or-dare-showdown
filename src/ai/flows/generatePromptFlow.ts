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
  timerInSeconds: z.number().optional().describe('If the prompt is a timed challenge, the duration in seconds. Otherwise, this should be omitted.'),
});
export type GeneratePromptOutput = z.infer<typeof GeneratePromptOutputSchema>;


export async function generatePrompt(input: GeneratePromptInput): Promise<GeneratePromptOutput> {
  return generatePromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePrompt',
  input: { schema: GeneratePromptInputSchema.extend({ isAdult: z.boolean() }) },
  output: { schema: GeneratePromptOutputSchema },
  prompt: `You are a creative assistant for the party game Truth or Dare. Your goal is to generate a single, witty, and surprising "{{promptType}}" question based on the provided context.

The question must be short, simple, and very easy to understand for the selected category.

**IMPORTANT RULES:**
1.  **JSON Output:** Your response MUST be a valid JSON object matching this schema: \`{ "prompt": "The generated question", "timerInSeconds": (number, optional) }\`.
2.  **No Extra Text:** Do NOT add any preamble like "Here is a dare:" or "Truth:". Your entire output must be only the JSON object.
3.  **Timer Logic:**
    *   If the generated prompt is a challenge with a specific time limit (e.g., "stare at another player without laughing for 30 seconds"), you MUST include the 'timerInSeconds' field with the duration.
    *   For any prompt that does NOT have a time limit, you MUST OMIT the 'timerInSeconds' field entirely.
4.  **Be Inventive:** Avoid generic or boring questions. The more unexpected, the better.
5.  **Avoid Repetition:** DO NOT generate any of the prompts from the \`previousPrompts\` list.

**GAME CONTEXT:**
-   **Prompt Type:** {{promptType}}
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

Generate the JSON for the "{{promptType}}" question now.`,
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
