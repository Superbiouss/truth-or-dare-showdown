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
import type { SafetySetting } from '@genkit-ai/googleai';

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
  timerInSeconds: z.number().optional().describe("Include this field only if the task has a specific time limit. Omit it otherwise."),
});
export type GenerateWildcardOutput = z.infer<typeof GenerateWildcardOutputSchema>;

export async function generateWildcard(input: GenerateWildcardInput): Promise<GenerateWildcardOutput> {
  return generateWildcardFlow(input);
}

const promptTemplate = `You are an AI for a party game. Your primary goal is to generate a single, fun, and unexpected "wildcard" challenge for {{player.name}}.

**Key Requirement: Make it TRENDY & RELATABLE.**
To ensure the game feels current and exciting, you MUST base the challenge on recent events or modern themes. Be specific and creative in how you use them. Good sources of inspiration include:
- **Trending Social Media Challenges:** Think of popular challenges on TikTok, Instagram, or other platforms.
- **Current Pop Culture:** Reference recent movies, viral TV shows (like on Netflix or HBO), popular music artists, or celebrity news.
- **Internet Memes & Slang:** Weave in a popular, recent meme or use slang that the current generation would understand.
- **Modern Social Situations:** Create scenarios related to dating apps, group chats, streaming services, or online gaming.

The challenge must be appropriate for the '{{category}}' category. Award between 15 and 30 points based on difficulty.
Do not repeat any of the previous challenges. Focus on being fun and surprising.

**Game Details:**
-   **Category:** {{category}}
-   **Current Player:** {{player.name}} ({{player.gender}})
-   **Other Players:**
    {{#each players}}
    -   {{this.name}} ({{this.gender}})
    {{/each}}
{{#if previousPrompts}}
-   **Do not repeat these previous challenges:**
    {{#each previousPrompts}}
    -   "{{this}}"
    {{/each}}
{{/if}}
`;

const extremeWildcardPromptTemplate = `You are an AI for an adults-only party game. Generate a single, truly extreme, wild, and potentially shocking "wildcard" challenge for {{player.name}}. The intensity is set to the maximum (5/5), so do not hold back.

**Key Requirement: Make it TRENDY, RELATABLE, and EDGY.**
To ensure the game feels current and shocking, you MUST base the challenge on recent events or modern themes, but push them to the limit. Good sources of inspiration include:
- **Trending Social Media Challenges:** Find the most controversial or risqué challenges and amplify them.
- **Current Pop Culture:** Reference adult-themed movies (R-rated), explicit TV shows (like on HBO), or scandalous celebrity news.
- **Internet Memes & Slang:** Use edgy, dark humor memes or slang in a provocative way.
- **Modern Social Situations:** Create scenarios related to the wild side of dating apps, group chats, or nightlife.

The challenge must be appropriate for the '18+' category at its most intense. Award between 15 and 30 points based on difficulty.
Do not repeat any of the previous challenges. Focus on being edgy and surprising.

**Game Details:**
-   **Category:** {{category}} (Maximum Intensity)
-   **Current Player:** {{player.name}} ({{player.gender}})
-   **Other Players:**
    {{#each players}}
    -   {{this.name}} ({{this.gender}})
    {{/each}}
{{#if previousPrompts}}
-   **Do not repeat these previous challenges:**
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
  name: 'generateKidsWildcardPrompt',
  input: { schema: GenerateWildcardInputSchema },
  output: { schema: GenerateWildcardOutputSchema },
  prompt: promptTemplate,
  config: {
    safetySettings: getSafetySettingsForCategory('kids'),
  }
});

const teensPrompt = ai.definePrompt({
  name: 'generateTeensWildcardPrompt',
  input: { schema: GenerateWildcardInputSchema },
  output: { schema: GenerateWildcardOutputSchema },
  prompt: promptTemplate,
  config: {
    safetySettings: getSafetySettingsForCategory('teens'),
  }
});

const adultPrompt = ai.definePrompt({
  name: 'generateAdultWildcardPrompt',
  input: { schema: GenerateWildcardInputSchema },
  output: { schema: GenerateWildcardOutputSchema },
  prompt: promptTemplate,
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
