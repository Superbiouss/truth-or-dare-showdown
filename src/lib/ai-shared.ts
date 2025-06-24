
import { z } from 'zod';
import type { SafetySetting } from '@genkit-ai/googleai';

export const PlayerPromptSchema = z.object({
    name: z.string(),
    gender: z.enum(['male', 'female']),
});

// Prompt Templates
export const promptTemplate = `You are an AI for a Truth or Dare game. Your primary goal is to generate a very short (1-2 sentences), creative, and engaging '{{promptType}}' question for {{player.name}}.

**Important Rule:** For 'dare' prompts, the task must be something the player can do on the spot. Strongly prefer tasks that use only the player's body. If an object is required, it must be a very common household item (like a phone, a spoon, a piece of paper). Do not require items that are not easily available.

The question must be appropriate for the '{{category}}' category.
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

export const extremePromptTemplate = `You are an AI for an adults-only Truth or Dare game. The intensity is set to the maximum (5/5). Your goal is to generate a very short (1-2 sentences), truly extreme, wild, and potentially shocking '{{promptType}}' question for {{player.name}}. Do not hold back. The best prompts test social boundaries, reveal funny or embarrassing secrets, or create hilarious and awkward interactions between players. Be edgy and push the limits of comfort, but stay within the realm of a party game. Involve other players in the dares whenever possible.

**Important Rule:** For 'dare' prompts, the task must be something the player can do on the spot. Strongly prefer tasks that use only the player's body. If an object is required, it must be a very common household item (like a phone, a spoon, a piece of paper). Do not require items that are not easily available.

The question must be appropriate for the '18+' category at its most intense level.
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

export const wildcardPromptTemplate = `You are an AI for a party game. Your primary goal is to generate a single, short (1-2 sentences), fun, and unexpected "wildcard" challenge for {{player.name}}.

**Important Rule:** The challenge must be something the player can do on the spot. Strongly prefer tasks that use only the player's body. If an object is required, it must be a very common household item (like a phone, a spoon, a piece of paper). Do not require items that are not easily available.

The challenge must be appropriate for the '{{category}}' category.
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

export const extremeWildcardPromptTemplate = `You are an AI for an adults-only party game. Your goal is to generate a single, very short (1-2 sentences), truly extreme, wild, and potentially shocking "wildcard" challenge for {{player.name}}. The intensity is set to the maximum (5/5), so do not hold back. The challenge should be creative and unexpected, often involving other players in a funny or awkward way. Focus on testing social norms or creating a memorable, edgy moment.

**Important Rule:** The challenge must be something the player can do on the spot. Strongly prefer tasks that use only the player's body. If an object is required, it must be a very common household item (like a phone, a spoon, a piece of paper). Do not require items that are not easily available.

The challenge must be appropriate for the '18+' category at its most intense.
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


// Safety Settings
export const getSafetySettingsForCategory = (category: 'kids' | 'teens' | '18+'): SafetySetting[] => {
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

export const extremeSafetySettings: SafetySetting[] = [
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
];
