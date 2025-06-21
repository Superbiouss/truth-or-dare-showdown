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
  prompt: `You are an AI assistant that ONLY responds with a single, valid JSON object. Do not output markdown, text, or any characters before or after the JSON object.

Your task is to generate a single, witty, and surprising "{{promptType}}" question for a party game. The question must be short and easy to understand.

The JSON object MUST conform to this Zod schema:
\`{
  "prompt": "z.string() // The generated truth or dare question.",
  "timerInSeconds": "z.number().optional() // MUST be omitted unless the task has a specific time limit."
}\`

**INSTRUCTIONS:**
1.  **Timed Tasks:** If the prompt is a challenge with a specific time limit (e.g., "stare at someone for 30 seconds"), you MUST include the 'timerInSeconds' field. For all other prompts, you MUST OMIT the 'timerInSeconds' field.
2.  **Be Creative:** Avoid boring or generic questions. The more unexpected and fun, the better.
3.  **Avoid Repetition:** Do NOT generate any of the prompts from the \`previousPrompts\` list provided in the context.

**GAME CONTEXT:**
-   **Prompt Type:** {{promptType}}
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
