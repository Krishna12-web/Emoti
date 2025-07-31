'use server';

/**
 * @fileOverview A flow that generates human-like responses based on detected emotional state.
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
    .describe('The detected emotion of the user (e.g., sadness, happiness, anger, loneliness).'),
  userInput: z.string().describe('The user input text or voice data.'),
  pastConversations: z
    .string()
    .array()
    .optional()
    .describe('Past conversations with the user.'),
});
export type GenerateAdaptiveResponseInput = z.infer<typeof GenerateAdaptiveResponseInputSchema>;

const GenerateAdaptiveResponseOutputSchema = z.object({
  response: z.string().describe('The generated human-like response.'),
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
  prompt: `You are an empathetic and supportive virtual friend. Your goal is to provide comfort and companionship to the user based on their detected emotion and input.

  Detected Emotion: {{{emotion}}}
  User Input: {{{userInput}}}

  {{#if pastConversations}}
  Past Conversations:
  {{#each pastConversations}}
  - {{{this}}}
  {{/each}}
  {{/if}}

  Generate a human-like response that addresses the user's emotion and offers support. Avoid robotic or generic responses. Personalize the response based on past conversations if available.`, // eslint-disable-line max-len
});

const generateAdaptiveResponseFlow = ai.defineFlow(
  {
    name: 'generateAdaptiveResponseFlow',
    inputSchema: GenerateAdaptiveResponseInputSchema,
    outputSchema: GenerateAdaptiveResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
