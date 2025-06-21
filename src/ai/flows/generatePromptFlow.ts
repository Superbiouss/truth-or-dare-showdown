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
  prompt: `You are an expert at creating fun, engaging, and sometimes embarrassing questions for the party game Truth or Dare. Your goal is to be creative, witty, and surprising.

Your task is to generate a single, engaging "{{promptType}}" question for the current player.
The question must be short, simple, and very easy to understand for the selected category.
If the generated prompt is a challenge with a specific time limit (e.g., "stare at another player without laughing for 30 seconds"), you MUST include the 'timerInSeconds' field with the duration. For any prompt that does NOT have a time limit, you MUST OMIT the 'timerInSeconds' field entirely.

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
To ensure variety, please DO NOT generate any of the following prompts that have already been used in this game:
{{#each previousPrompts}}
- "{{this}}"
{{/each}}
{{/if}}

Please generate a creative and context-aware "{{promptType}}" question.
- For the 'kids' category, keep it light, funny, and age-appropriate.
- For the 'teens' category, it can be about school, friends, crushes, and social trends.
- For the '18+' category, tailor the spiciness to the intensity level.
- Make it personal but not mean-spirited. You can reference other players by name if it makes sense.
- DO NOT add any preamble like "Here is a dare:" or "Truth:". Just provide the question itself.
- Be inventive! Avoid generic or boring questions. The more unexpected, the better.`,
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
