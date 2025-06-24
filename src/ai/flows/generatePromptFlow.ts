
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
import { 
    PlayerPromptSchema, 
    promptTemplate, 
    extremePromptTemplate, 
    getSafetySettingsForCategory,
    extremeSafetySettings
} from '@/lib/ai-shared';

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
