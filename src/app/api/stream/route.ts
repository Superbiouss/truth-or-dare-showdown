
import { ai } from '@/ai/genkit';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import Handlebars from 'handlebars';
import { 
    PlayerPromptSchema, 
    promptTemplate, 
    extremePromptTemplate, 
    wildcardPromptTemplate,
    extremeWildcardPromptTemplate,
    getSafetySettingsForCategory,
    extremeSafetySettings
} from '@/lib/ai-shared';

const InputStreamSchema = z.object({
  player: PlayerPromptSchema,
  category: z.enum(['kids', 'teens', '18+']),
  intensity: z.number().min(1).max(5),
  promptType: z.enum(['truth', 'dare', 'wildcard']),
  players: z.array(PlayerPromptSchema),
  previousPrompts: z.array(z.string()).optional()
});

Handlebars.registerHelper('each', function(context, options) {
    let ret = "";
    for(let i=0, j=context.length; i<j; i++) {
        ret = ret + options.fn(context[i]);
    }
    return ret;
});

Handlebars.registerHelper('if', function(conditional, options) {
    if (conditional) {
        return options.fn(this);
    }
});

export async function POST(req: NextRequest) {
  try {
    const input = InputStreamSchema.parse(await req.json());
    
    let template;
    let safetySettings;
    let points = 0;

    if (input.promptType === 'truth' || input.promptType === 'dare') {
        points = input.promptType === 'truth' ? 5 : 10;
        if (input.category === '18+' && input.intensity === 5) {
            template = extremePromptTemplate;
            safetySettings = extremeSafetySettings;
        } else {
            template = promptTemplate;
            safetySettings = getSafetySettingsForCategory(input.category);
        }
    } else { // Wildcard
        points = Math.floor(Math.random() * (30 - 15 + 1)) + 15; // Random points 15-30
        if (input.category === '18+' && input.intensity === 5) {
            template = extremeWildcardPromptTemplate;
            safetySettings = extremeSafetySettings;
        } else {
            template = wildcardPromptTemplate;
            safetySettings = getSafetySettingsForCategory(input.category);
        }
    }

    const compiledTemplate = Handlebars.compile(template);
    const filledPrompt = compiledTemplate(input);

    const { stream } = await ai.generateStream({
        prompt: filledPrompt,
        config: { safetySettings },
    });

    const readableStream = new ReadableStream({
        async start(controller) {
            for await (const chunk of stream) {
                if (chunk.text) {
                    controller.enqueue(new TextEncoder().encode(chunk.text));
                }
            }
            controller.close();
        }
    });

    return new Response(readableStream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Prompt-Points': points.toString(),
        }
    });

  } catch (e: any) {
    console.error("Error in streaming API:", e);
    return new Response(JSON.stringify({ error: e.message || 'An unexpected error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
