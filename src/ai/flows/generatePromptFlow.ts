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
  prompt: `You are an AI assistant that ONLY responds with a single, valid JSON object that strictly adheres to the Zod schema provided below. Do not include any other text, markdown, or explanations.

**Zod Schema:**
\`\`\`json
{
  "prompt": "z.string() // The generated truth or dare question.",
  "timerInSeconds": "z.number().optional() // IMPORTANT: OMIT this field entirely unless the task has a very specific, explicit time limit."
}
\`\`\`

**CRITICAL RULES:**
1.  **JSON ONLY:** Your entire response MUST be a single, valid JSON object and nothing else.
2.  **NO TIMER BY DEFAULT:** OMIT the \`timerInSeconds\` field unless the dare requires a specific time duration (e.g., "hold your breath for 20 seconds").
3.  **NO REPEATS:** Do not generate any prompts from the \`previousPrompts\` list.
4.  **BE CREATIVE:** The prompt should be witty, surprising, and short.

**GOOD EXAMPLES:**
- For a 'truth' prompt: \`{"prompt": "What's the most embarrassing thing you've worn in public?"}\`
- For a 'dare' prompt: \`{"prompt": "Do your best impersonation of another player until your next turn."}\`
- For a timed 'dare' prompt: \`{"prompt": "Hold a plank for 30 seconds.", "timerInSeconds": 30}\`

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
