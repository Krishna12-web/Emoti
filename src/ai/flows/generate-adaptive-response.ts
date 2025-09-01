
'use server';

/**
 * @fileOverview A flow that generates human-like responses based on detected emotional state and a persona.
 *
 * - generateAdaptiveResponse - A function that generates an adaptive response.
 * - GenerateAdaptiveResponseInput - The input type for the generateAdaptiveResponse function.
 * - GenerateAdaptiveResponseOutput - The return type for the generateAdaptiveResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAdaptiveResponseInputSchema = z.object({
  emotion: z
    .string()
    .describe('The detected vocal characteristics of the persona (e.g., Tone: warm, Pitch: high).'),
  userInput: z.string().describe('The current user input text.'),
  pastConversations: z
    .string()
    .array()
    .describe('A text sample of the persona\'s chat history to learn their style.'),
});
export type GenerateAdaptiveResponseInput = z.infer<typeof GenerateAdaptiveResponseInputSchema>;

const GenerateAdaptiveResponseOutputSchema = z.object({
  response: z.string().describe('The generated response in the persona\'s style.'),
});
export type GenerateAdaptiveResponseOutput = z.infer<typeof GenerateAdaptiveResponseOutputSchema>;

export async function generateAdaptiveResponse(
  input: GenerateAdaptiveResponseInput
): Promise<GenerateAdaptiveResponseOutput> {
  return generateAdaptiveResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAdaptiveResponsePrompt',
  input: {schema: GenerateAdaptiveResponseInputSchema},
  output: {schema: GenerateAdaptiveResponseOutputSchema},
  system: `You are a Digital Twin. Your task is to become a specific person based on the data provided.
You will receive a chat history to learn their communication style, vocal characteristics to understand their tone, and the user's current message to respond to.
Analyze the persona's chat history to understand their personality, common phrases, emoji usage, and general demeanor.
Analyze the vocal characteristics to further inform the emotional tone of your response.
Generate a response to the user's input that is authentic to the persona you are emulating.
DO NOT break character. You are not an AI assistant; you ARE the persona.`,
  prompt: `
  PERSONA CHAT HISTORY (Learn this style):
  {{#each pastConversations}}
  - {{{this}}}
  {{/each}}

  PERSONA VOCAL CHARACTERISTICS (Use this for tone):
  {{{emotion}}}

  CURRENT CONVERSATION (Respond to the last message):
  User: {{{userInput}}}
  Persona:`,
});

const generateAdaptiveResponseFlow = ai.defineFlow(
  {
    name: 'generateAdaptiveResponseFlow',
    inputSchema: GenerateAdaptiveResponseInputSchema,
    outputSchema: GenerateAdaptiveResponseOutputSchema,
  },
  async input => {
    const response = await prompt(input);
    return {
        response: response.text!,
    }
  }
);

    