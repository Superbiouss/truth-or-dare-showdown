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
import type { SafetySetting } from '@genkit-ai/googleai';

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

const promptTemplate = `You are an AI for a Truth or Dare game. Generate a short and creative '{{promptType}}' question for {{player.name}}.

The question must be appropriate for the '{{category}}' category.

To make the game exciting and up-to-date, incorporate current events, trending topics, social media challenges, or modern pop culture references.

Do not repeat any of the previous prompts. Focus on being fun and surprising.

**Game Details:**
-   **Category:** {{category}}
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
`;

const extremePromptTemplate = `You are an AI for an adults-only Truth or Dare game. The intensity is set to the maximum (5/5). Generate a truly extreme, wild, and potentially shocking '{{promptType}}' question for {{player.name}}. Do not hold back.

The question must be appropriate for the '18+' category at its most intense level.

To make the game exciting and up-to-date, incorporate current events, trending topics, social media challenges, or modern pop culture references.

Do not repeat any of the previous prompts. Focus on being shocking and edgy.

**Game Details:**
-   **Category:** {{category}} (Maximum Intensity)
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
`;

const getSafetySettingsForCategory = (category: 'kids' | 'teens' | '18+'): SafetySetting[] => {
    switch (category) {
        case 'kids':
            return [
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            ];
        case 'teens':
             return [
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            ];
        case '18+':
            return [
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
            ];
    }
}

const extremeSafetySettings: SafetySetting[] = [
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
];

const kidsPrompt = ai.definePrompt({
  name: 'generateKidsPrompt',
  input: { schema: GeneratePromptInputSchema },
  output: { schema: GeneratePromptOutputSchema },
  prompt: promptTemplate,
  config: {
    safetySettings: getSafetySettingsForCategory('kids'),
  }
});

const teensPrompt = ai.definePrompt({
  name: 'generateTeensPrompt',
  input: { schema: GeneratePromptInputSchema },
  output: { schema: GeneratePromptOutputSchema },
  prompt: promptTemplate,
  config: {
    safetySettings: getSafetySettingsForCategory('teens'),
  }
});

const adultPrompt = ai.definePrompt({
  name: 'generateAdultPrompt',
  input: { schema: GeneratePromptInputSchema },
  output: { schema: GeneratePromptOutputSchema },
  prompt: promptTemplate,
  config: {
    safetySettings: getSafetySettingsForCategory('18+'),
  }
});

const adultExtremePrompt = ai.definePrompt({
  name: 'generateAdultExtremePrompt',
  input: { schema: GeneratePromptInputSchema },
  output: { schema: GeneratePromptOutputSchema },
  prompt: extremePromptTemplate,
  config: {
    safetySettings: extremeSafetySettings,
  }
});

const generatePromptFlow = ai.defineFlow(
  {
    name: 'generatePromptFlow',
    inputSchema: GeneratePromptInputSchema,
    outputSchema: GeneratePromptOutputSchema,
  },
  async (input) => {
    let selectedPrompt;
    switch (input.category) {
        case 'kids':
            selectedPrompt = kidsPrompt;
            break;
        case 'teens':
            selectedPrompt = teensPrompt;
            break;
        case '18+':
            if (input.intensity === 5) {
                selectedPrompt = adultExtremePrompt;
            } else {
                selectedPrompt = adultPrompt;
            }
            break;
        default:
            selectedPrompt = kidsPrompt;
    }
    
    const { output } = await selectedPrompt(input);
    
    // Post-processing to ensure timer is only present when needed.
    if (output) {
        // Check if the prompt text explicitly mentions a time duration.
        const hasTimeMention = /second|minute/i.test(output.prompt);
        // If there's no time mention but the AI included a timer, remove it.
        if (!hasTimeMention && typeof output.timerInSeconds === 'number') {
            delete output.timerInSeconds;
        }
    }

    return output!;
  }
);
