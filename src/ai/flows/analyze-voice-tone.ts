// src/ai/flows/analyze-voice-tone.ts
'use server';

/**
 * @fileOverview Analyzes the user's voice tone to detect emotions.
 *
 * - analyzeVoiceTone - A function that analyzes the voice tone and returns the detected emotion.
 * - AnalyzeVoiceToneInput - The input type for the analyzeVoiceTone function.
 * - AnalyzeVoiceToneOutput - The return type for the analyzeVoiceTone function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeVoiceToneInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A data URI containing the audio data to analyze. It must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeVoiceToneInput = z.infer<typeof AnalyzeVoiceToneInputSchema>;

const AnalyzeVoiceToneOutputSchema = z.object({
  emotion: z
    .string()
    .describe(
      'The detected emotion from the voice tone (e.g., sadness, happiness, anger).'
    ),
  confidence: z
    .number()
    .describe(
      'A numerical value representing the confidence level of the emotion detection.'
    ),
});
export type AnalyzeVoiceToneOutput = z.infer<typeof AnalyzeVoiceToneOutputSchema>;

export async function analyzeVoiceTone(input: AnalyzeVoiceToneInput): Promise<AnalyzeVoiceToneOutput> {
  return analyzeVoiceToneFlow(input);
}

const analyzeVoiceTonePrompt = ai.definePrompt({
  name: 'analyzeVoiceTonePrompt',
  input: {schema: AnalyzeVoiceToneInputSchema},
  output: {schema: AnalyzeVoiceToneOutputSchema},
  prompt: `Analyze the emotion in the following audio data.  The audio data is represented by the following data URI: {{media url=audioDataUri}}.

  Determine the predominant emotion expressed in the audio (e.g., sadness, happiness, anger). Also, estimate your confidence in the emotion you detected.

  Output in JSON format.
  `, // Ensure correct Handlebars syntax
});

const analyzeVoiceToneFlow = ai.defineFlow(
  {
    name: 'analyzeVoiceToneFlow',
    inputSchema: AnalyzeVoiceToneInputSchema,
    outputSchema: AnalyzeVoiceToneOutputSchema,
  },
  async input => {
    const {output} = await analyzeVoiceTonePrompt(input);
    return output!;
  }
);

