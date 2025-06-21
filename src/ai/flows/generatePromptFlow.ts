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
  timerInSeconds: z.number().optional().describe("IMPORTANT: OMIT this field entirely unless the task has a very specific, explicit time limit (e.g., 'stare for 30 seconds'). For most prompts, this field should not be present in the JSON."),
});
export type GeneratePromptOutput = z.infer<typeof GeneratePromptOutputSchema>;


export async function generatePrompt(input: GeneratePromptInput): Promise<GeneratePromptOutput> {
  return generatePromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePrompt',
  input: { schema: GeneratePromptInputSchema.extend({ isAdult: z.boolean() }) },
  output: { schema: GeneratePromptOutputSchema },
  prompt: `Your sole task is to generate a single JSON object for a "{{promptType}}" question in a party game.
Adhere strictly to the following Zod schema for your output.

\`{
  "prompt": "z.string() // The generated truth or dare question.",
  "timerInSeconds": "z.number().optional() // OMIT this field unless the task has a specific time limit."
}\`

**CRITICAL RULES:**
1.  **JSON ONLY:** Your entire response MUST be a single, valid JSON object. Do not include any text, markdown, or any other characters before or after the JSON.
2.  **TIMER:** Only include the \`timerInSeconds\` field if the task has an explicit, specific duration (e.g., "stare for 30 seconds"). For all other prompts, you MUST OMIT this field from the JSON.
3.  **NO REPEATS:** Do not generate any of the prompts from the \`previousPrompts\` list.
4.  **BE CREATIVE:** The prompt should be witty, surprising, and short.

**GAME CONTEXT:**
-   **Prompt Type:** {{promptType}}
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
