
'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing facial expressions from a webcam feed.
 *
 * It takes a data URI of an image from the webcam, analyzes the facial expressions,
 * and returns the detected emotional state and gender.
 *
 * @fileOverview
 * - analyzeFacialExpressions - Analyzes facial expressions from an image.
 * - AnalyzeFacialExpressionsInput - Input type for analyzeFacialExpressions.
 * - AnalyzeFacialExpressionsOutput - Output type for analyzeFacialExpressions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeFacialExpressionsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo from the webcam, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'" 
    ),
});
export type AnalyzeFacialExpressionsInput = z.infer<typeof AnalyzeFacialExpressionsInputSchema>;

const AnalyzeFacialExpressionsOutputSchema = z.object({
  emotionalState: z
    .string()
    .describe(
      'The detected emotional state (e.g., smiles, frowns, tears) from the facial expression analysis.'
    ),
  gender: z.enum(['male', 'female', 'unknown']).describe('The detected gender of the person in the photo.'),
});
export type AnalyzeFacialExpressionsOutput = z.infer<typeof AnalyzeFacialExpressionsOutputSchema>;

export async function analyzeFacialExpressions(
  input: AnalyzeFacialExpressionsInput
): Promise<AnalyzeFacialExpressionsOutput> {
  return analyzeFacialExpressionsFlow(input);
}

const analyzeFacialExpressionsPrompt = ai.definePrompt({
  name: 'analyzeFacialExpressionsPrompt',
  input: {schema: AnalyzeFacialExpressionsInputSchema},
  output: {schema: AnalyzeFacialExpressionsOutputSchema},
  prompt: `You are an AI expert in analyzing human faces.
  Given a photo, analyze the facial expressions to determine the emotional state and also determine the apparent gender of the person.
  Describe the emotional state as concisely as possible (e.g., "smiling", "frowning").
  For gender, respond with 'male', 'female', or 'unknown'.
  Respond ONLY with the determined emotional state and gender in the specified JSON format.
  Photo: {{media url=photoDataUri}}`,
});

const analyzeFacialExpressionsFlow = ai.defineFlow(
  {
    name: 'analyzeFacialExpressionsFlow',
    inputSchema: AnalyzeFacialExpressionsInputSchema,
    outputSchema: AnalyzeFacialExpressionsOutputSchema,
  },
  async input => {
    const {output} = await analyzeFacialExpressionsPrompt(input);
    return output!;
  }
);
