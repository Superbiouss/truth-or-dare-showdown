
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
import { 
    PlayerPromptSchema, 
    wildcardPromptTemplate, 
    extremeWildcardPromptTemplate, 
    getSafetySettingsForCategory,
    extremeSafetySettings
} from '@/lib/ai-shared';


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

const kidsPrompt = ai.definePrompt({
  name: 'generateKidsWildcardPrompt',
  input: { schema: GenerateWildcardInputSchema },
  output: { schema: GenerateWildcardOutputSchema },
  prompt: wildcardPromptTemplate,
  config: {
    safetySettings: getSafetySettingsForCategory('kids'),
  }
});

const teensPrompt = ai.definePrompt({
  name: 'generateTeensWildcardPrompt',
  input: { schema: GenerateWildcardInputSchema },
  output: { schema: GenerateWildcardOutputSchema },
  prompt: wildcardPromptTemplate,
  config: {
    safetySettings: getSafetySettingsForCategory('teens'),
  }
});

const adultPrompt = ai.definePrompt({
  name: 'generateAdultWildcardPrompt',
  input: { schema: GenerateWildcardInputSchema },
  output: { schema: GenerateWildcardOutputSchema },
  prompt: wildcardPromptTemplate,
  config: {
    safetySettings: getSafetySettingsForCategory('18+'),
  }
});

const adultExtremeWildcardPrompt = ai.definePrompt({
  name: 'generateAdultExtremeWildcardPrompt',
  input: { schema: GenerateWildcardInputSchema },
  output: { schema: GenerateWildcardOutputSchema },
  prompt: extremeWildcardPromptTemplate,
  config: {
    safetySettings: extremeSafetySettings,
  }
});


const generateWildcardFlow = ai.defineFlow(
  {
    name: 'generateWildcardFlow',
    inputSchema: GenerateWildcardInputSchema,
    outputSchema: GenerateWildcardOutputSchema,
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
                selectedPrompt = adultExtremeWildcardPrompt;
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
        const hasTimeMention = /second|minute/i.test(output.challenge);
        // If there's no time mention but the AI included a timer, remove it.
        if (!hasTimeMention && typeof output.timerInSeconds === 'number') {
            delete output.timerInSeconds;
        }
    }
    
    return output!;
  }
);
