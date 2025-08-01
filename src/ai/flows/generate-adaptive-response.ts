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

// Tool: Change Language
const changeLanguageTool = ai.defineTool(
    {
      name: 'changeLanguage',
      description: 'Changes the conversation language.',
      inputSchema: z.object({
        language: z.string().describe('The target language (e.g., "Spanish", "French", "English").'),
      }),
      outputSchema: z.object({
        success: z.boolean(),
      }),
    },
    async () => {
      // The tool's job is to be callable by the LLM. The actual implementation
      // of changing the language is handled on the client side based on the tool call.
      return { success: true };
    }
  );
  
  // Tool: Change Voice Gender
  const changeVoiceGenderTool = ai.defineTool(
    {
      name: 'changeVoiceGender',
      description: "Changes the AI's voice gender.",
      inputSchema: z.object({
        gender: z.enum(['male', 'female']).describe("The target voice gender."),
      }),
      outputSchema: z.object({
        success: z.boolean(),
      }),
    },
    async () => {
      // The client will handle the actual state change.
      return { success: true };
    }
  );

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
  toolCalls: z.array(z.any()).optional().describe('Any tool calls the AI decided to make.'),
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
  tools: [changeLanguageTool, changeVoiceGenderTool],
  system: `You are EmotiFriend, an empathetic and supportive virtual friend. Your goal is to provide comfort and companionship.
  You are also a helpful AI assistant. If the user gives a command, use the available tools to fulfill their request. For example, if they ask to change the language or your voice, use the appropriate tool.
  When using a tool, also provide a brief text response confirming the action. For instance, if changing the language to Spanish, respond with something like "Of course, switching to Spanish now."
  
  Always generate a text response, even when using a tool.`,
  prompt: `Detected Emotion: {{{emotion}}}
  User Input: {{{userInput}}}

  {{#if pastConversations}}
  Past Conversations:
  {{#each pastConversations}}
  - {{{this}}}
  {{/each}}
  {{/if}}

  Generate a human-like response that addresses the user's emotion and offers support. Avoid robotic or generic responses. Personalize the response based on past conversations if available. If the user issues a command, use your tools.`, // eslint-disable-line max-len
});

const generateAdaptiveResponseFlow = ai.defineFlow(
  {
    name: 'generateAdaptiveResponseFlow',
    inputSchema: GenerateAdaptiveResponseInputSchema,
    outputSchema: GenerateAdaptiveResponseOutputSchema,
  },
  async input => {
    const response = await prompt(input);
    const toolCalls = response.toolCalls;

    return {
        response: response.text!,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    }
  }
);
